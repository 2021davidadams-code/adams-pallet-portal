"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string | null;
  role?: string | null;
  company_name?: string | null;
  is_active?: boolean | null;
};

type Transfer = {
  id: string;
  user_id: string;
  destination: string | null;
  to_name?: string | null;
  quantity: number | string | null;
  damaged: number | string | null;
  shipment_date: string | null;
  transfer_date?: string | null;
  status: string | null;
  created_at: string | null;
  transfer_number?: string | null;
  request_type?: string | null;
  notes?: string | null;
};

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() || "";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function statusLabel(status?: string | null) {
  if (!status) return "Unknown";
  if (status === "pending_review") return "Pending Review";
  if (status === "completed") return "Completed";
  return status;
}

function requestTypeLabel(type?: string | null) {
  if (!type || type === "transfer") return "Transfer";
  if (type === "pickup_request") return "Pickup Request";
  if (type === "shipment_request") return "Shipment Request";
  return type;
}

export default function DashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [approvalBlocked, setApprovalBlocked] = useState(false);
  const [submittingTransfer, setSubmittingTransfer] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [pageError, setPageError] = useState("");

  const [userId, setUserId] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [records, setRecords] = useState<Transfer[]>([]);

  const [destination, setDestination] = useState("");
  const [quantity, setQuantity] = useState("");
  const [damaged, setDamaged] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");

  const [requestType, setRequestType] = useState<"pickup_request" | "shipment_request">(
    "pickup_request"
  );
  const [requestDestination, setRequestDestination] = useState("");
  const [requestQuantity, setRequestQuantity] = useState("");
  const [requestDate, setRequestDate] = useState("");
  const [requestNotes, setRequestNotes] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const loadDashboard = async () => {
    setLoading(true);
    setPageError("");
    setApprovalBlocked(false);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.log("Auth user fetch error:", userError.message || userError);
    }

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const cleanEmail = (user.email || "").toLowerCase();
    const metadataCompanyName =
      typeof user.user_metadata?.company_name === "string"
        ? user.user_metadata.company_name.trim()
        : "";

    setUserId(user.id);
    setAuthEmail(cleanEmail);

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, company_name, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.log("Profile fetch error:", profileError.message || profileError);
    }

    let resolvedProfile = (profileData as Profile | null) || null;

    if (!resolvedProfile) {
      const isAdminEmail = cleanEmail === ADMIN_EMAIL && ADMIN_EMAIL !== "";

      const upsertPayload = {
        id: user.id,
        email: cleanEmail,
        role: isAdminEmail ? "admin" : "user",
        company_name: metadataCompanyName || null,
        is_active: isAdminEmail ? true : true,
      };

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(upsertPayload, { onConflict: "id" });

      if (upsertError) {
        console.log("Profile upsert error:", upsertError.message || upsertError);
      } else {
        resolvedProfile = upsertPayload;
      }
    }

    setProfile(resolvedProfile);

    if (resolvedProfile?.is_active === false) {
      setApprovalBlocked(true);
      setLoading(false);
      return;
    }

    const { data: transfersData, error: transfersError } = await supabase
      .from("transfers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (transfersError) {
      console.log("Transfers fetch error:", transfersError.message || transfersError);
      setRecords([]);
    } else {
      setRecords((transfersData as Transfer[]) || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const companyDisplayName =
    profile?.company_name?.trim() || profile?.email || authEmail || "Your Company";

  const secondaryIdentity =
    profile?.company_name?.trim() && (profile.email || authEmail)
      ? profile.email || authEmail
      : "";

  const isAdmin =
    (profile?.role || "").toLowerCase() === "admin" ||
    (authEmail && ADMIN_EMAIL && authEmail === ADMIN_EMAIL);

  const filteredRecords = useMemo(() => {
    const now = new Date();

    return records.filter((record) => {
      if (statusFilter !== "all" && (record.status || "") !== statusFilter) {
        return false;
      }

      if (dateFilter === "all") {
        return true;
      }

      const rawDate = record.shipment_date || record.transfer_date || record.created_at;
      if (!rawDate) return false;

      const rowDate = new Date(rawDate);
      if (Number.isNaN(rowDate.getTime())) return false;

      if (dateFilter === "today") {
        return rowDate.toDateString() === now.toDateString();
      }

      if (dateFilter === "last7") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return rowDate >= sevenDaysAgo;
      }

      if (dateFilter === "last30") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return rowDate >= thirtyDaysAgo;
      }

      return true;
    });
  }, [records, statusFilter, dateFilter]);

  const transferRecords = useMemo(() => {
    return filteredRecords.filter((record) => (record.request_type || "transfer") === "transfer");
  }, [filteredRecords]);

  const serviceRequests = useMemo(() => {
    return filteredRecords.filter((record) => (record.request_type || "transfer") !== "transfer");
  }, [filteredRecords]);

  const totals = useMemo(() => {
    return transferRecords.reduce(
      (acc, record) => {
        const qty = Number(record.quantity || 0);
        const dmg = Number(record.damaged || 0);
        const status = record.status || "";

        acc.totalTransfers += 1;
        acc.totalPallets += qty;
        acc.damagedLost += dmg;
        acc.netDelivered += Math.max(qty - dmg, 0);

        if (status === "pending_review") acc.pending += 1;
        if (status === "completed") acc.completed += 1;

        return acc;
      },
      {
        totalTransfers: 0,
        totalPallets: 0,
        damagedLost: 0,
        netDelivered: 0,
        pending: 0,
        completed: 0,
      }
    );
  }, [transferRecords]);

  const openRequestCount = useMemo(() => {
    return serviceRequests.filter((record) => record.status === "pending_review").length;
  }, [serviceRequests]);

  const completionRate =
    totals.totalTransfers > 0
      ? Math.round((totals.completed / totals.totalTransfers) * 100)
      : 0;

  const pendingRate =
    totals.totalTransfers > 0
      ? Math.round((totals.pending / totals.totalTransfers) * 100)
      : 0;

  const lossPercentage =
    totals.totalPallets > 0
      ? ((totals.damagedLost / totals.totalPallets) * 100).toFixed(1)
      : "0.0";

  const handleAddTransfer = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanDestination = destination.trim();
    const qty = Number(quantity || 0);
    const dmg = Number(damaged || 0);
    const finalDate = shipmentDate || new Date().toISOString().slice(0, 10);

    if (!cleanDestination) {
      alert("Destination name is required.");
      return;
    }

    if (Number.isNaN(qty) || qty <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    if (Number.isNaN(dmg) || dmg < 0) {
      alert("Damaged / lost pallets must be 0 or more.");
      return;
    }

    if (!userId) {
      alert("User not loaded yet. Please try again.");
      return;
    }

    setSubmittingTransfer(true);

    const { error } = await supabase.from("transfers").insert([
      {
        user_id: userId,
        destination: cleanDestination,
        to_name: cleanDestination,
        quantity: qty,
        damaged: dmg,
        shipment_date: finalDate,
        transfer_date: finalDate,
        status: "pending_review",
        request_type: "transfer",
        notes: null,
      },
    ]);

    if (error) {
      alert(error.message);
      setSubmittingTransfer(false);
      return;
    }

    setDestination("");
    setQuantity("");
    setDamaged("");
    setShipmentDate("");
    await loadDashboard();
    setSubmittingTransfer(false);
  };

  const handleServiceRequest = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanDestination = requestDestination.trim();
    const qty = Number(requestQuantity || 0);
    const finalDate = requestDate || new Date().toISOString().slice(0, 10);
    const cleanNotes = requestNotes.trim();

    if (!cleanDestination) {
      alert("Location or destination is required.");
      return;
    }

    if (Number.isNaN(qty) || qty <= 0) {
      alert("Requested quantity must be greater than 0.");
      return;
    }

    if (!userId) {
      alert("User not loaded yet. Please try again.");
      return;
    }

    setSubmittingRequest(true);

    const { error } = await supabase.from("transfers").insert([
      {
        user_id: userId,
        destination: cleanDestination,
        to_name: cleanDestination,
        quantity: qty,
        damaged: 0,
        shipment_date: finalDate,
        transfer_date: finalDate,
        status: "pending_review",
        request_type: requestType,
        notes: cleanNotes || null,
      },
    ]);

    if (error) {
      alert(error.message);
      setSubmittingRequest(false);
      return;
    }

    setRequestDestination("");
    setRequestQuantity("");
    setRequestDate("");
    setRequestNotes("");
    setRequestType("pickup_request");
    await loadDashboard();
    setSubmittingRequest(false);

    alert("Request submitted. Admin can now see it on the admin dashboard.");
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-3xl bg-white px-8 py-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (approvalBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Awaiting Admin Approval</h1>
          <p className="mt-3 text-slate-600">
            Your account has been created, but it must be approved by Adams Pallet Plus before
            dashboard access is allowed.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Company
            </p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {companyDisplayName}
            </p>
            {secondaryIdentity ? (
              <p className="mt-1 text-sm text-slate-500">{secondaryIdentity}</p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/"
              className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back to Home
            </a>
            <button
              type="button"
              onClick={signOut}
              className="rounded-2xl bg-[#11284a] px-5 py-3 font-semibold text-white hover:bg-[#0c1d36]"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Adams Pallet Plus
              </h1>
              <p className="mt-2 text-slate-500">
                Manage pallet transfers, shipment dates, and damaged/lost pallet counts.
              </p>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Company
                </p>
                <p className="mt-1 text-lg font-bold text-slate-900">
                  {companyDisplayName}
                </p>
                {secondaryIdentity ? (
                  <p className="mt-1 text-sm text-slate-500">{secondaryIdentity}</p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {isAdmin ? (
                <a
                  href="/admin"
                  className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Admin Dashboard
                </a>
              ) : null}

              <button
                type="button"
                onClick={signOut}
                className="rounded-2xl bg-[#11284a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0c1d36]"
              >
                Logout
              </button>
            </div>
          </div>

          {pageError ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Transfers</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{totals.totalTransfers}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Pallets</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{totals.totalPallets}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Damaged / Lost</p>
            <p className="mt-3 text-4xl font-bold text-red-600">{totals.damagedLost}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Net Delivered</p>
            <p className="mt-3 text-4xl font-bold text-green-600">{totals.netDelivered}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending Transfers</p>
            <p className="mt-3 text-4xl font-bold text-amber-600">{totals.pending}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Open Requests</p>
            <p className="mt-3 text-4xl font-bold text-[#11284a]">{openRequestCount}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Completion Rate</p>
              <p className="text-sm font-semibold text-slate-700">{completionRate}%</p>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-green-500"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Pending Rate</p>
              <p className="text-sm font-semibold text-slate-700">{pendingRate}%</p>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-amber-500"
                style={{ width: `${pendingRate}%` }}
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">Loss Percentage</p>
              <p className="text-sm font-semibold text-green-600">{lossPercentage}%</p>
            </div>
            <div className="mt-3 h-3 rounded-full bg-slate-100">
              <div
                className="h-3 rounded-full bg-[#11284a]"
                style={{ width: `${Math.min(Number(lossPercentage), 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_360px_minmax(0,1fr)]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Add Transfer</h2>
            <p className="mt-2 text-slate-500">Create a new pallet transfer.</p>

            <form onSubmit={handleAddTransfer} className="mt-6 space-y-4">
              <div>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Destination Name"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="Quantity"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <input
                  type="number"
                  value={damaged}
                  onChange={(e) => setDamaged(e.target.value)}
                  placeholder="Damaged / Lost Pallets"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <input
                  type="date"
                  value={shipmentDate}
                  onChange={(e) => setShipmentDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingTransfer}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submittingTransfer ? "Adding Transfer..." : "Add Transfer"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Request Service</h2>
            <p className="mt-2 text-slate-500">
              Submit a pickup or shipment request for admin review.
            </p>

            <form onSubmit={handleServiceRequest} className="mt-6 space-y-4">
              <div>
                <select
                  value={requestType}
                  onChange={(e) =>
                    setRequestType(e.target.value as "pickup_request" | "shipment_request")
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                >
                  <option value="pickup_request">Pickup Request</option>
                  <option value="shipment_request">Shipment Request</option>
                </select>
              </div>

              <div>
                <input
                  type="text"
                  value={requestDestination}
                  onChange={(e) => setRequestDestination(e.target.value)}
                  placeholder="Pickup or shipment location"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <input
                  type="number"
                  value={requestQuantity}
                  onChange={(e) => setRequestQuantity(e.target.value)}
                  placeholder="Requested pallet quantity"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                  required
                />
              </div>

              <div>
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  placeholder="Notes for admin"
                  className="min-h-[120px] w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={submittingRequest}
                className="w-full rounded-2xl bg-[#11284a] px-4 py-3 font-semibold text-white hover:bg-[#0c1d36] disabled:opacity-60"
              >
                {submittingRequest ? "Submitting Request..." : "Submit Request"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Transfers & Requests</h2>
            <p className="mt-2 text-slate-500">View your transfer history and service requests.</p>

            <div className="mt-6 space-y-5">
              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Status Filter</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All" },
                    { value: "pending_review", label: "Pending" },
                    { value: "completed", label: "Completed" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setStatusFilter(item.value)}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                        statusFilter === item.value
                          ? "bg-[#11284a] text-white"
                          : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Date Filter</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: "all", label: "All Dates" },
                    { value: "today", label: "Today" },
                    { value: "last7", label: "Last 7 Days" },
                    { value: "last30", label: "Last 30 Days" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setDateFilter(item.value)}
                      className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                        dateFilter === item.value
                          ? "bg-[#11284a] text-white"
                          : "border border-slate-300 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200">
              {filteredRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No transfers or requests found for the current filters.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredRecords.map((record) => {
                    const qty = Number(record.quantity || 0);
                    const dmg = Number(record.damaged || 0);
                    const net = Math.max(qty - dmg, 0);
                    const type = record.request_type || "transfer";

                    return (
                      <div key={record.id} className="bg-white p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                                {record.transfer_number || "Pending Number"}
                              </span>
                              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                {requestTypeLabel(type)}
                              </span>
                            </div>

                            <p className="mt-3 text-lg font-bold text-slate-900">
                              {record.destination || "Unnamed Destination"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {formatDate(record.shipment_date || record.transfer_date || record.created_at)}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              Company: {companyDisplayName}
                            </p>
                            {record.notes ? (
                              <p className="mt-2 text-sm text-slate-600">
                                Notes: {record.notes}
                              </p>
                            ) : null}
                          </div>

                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                              record.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {statusLabel(record.status)}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Quantity
                            </p>
                            <p className="mt-2 text-xl font-bold text-slate-900">{qty}</p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Damaged / Lost
                            </p>
                            <p className="mt-2 text-xl font-bold text-red-600">
                              {type === "transfer" ? dmg : 0}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              {type === "transfer" ? "Net Delivered" : "Request Status"}
                            </p>
                            <p className="mt-2 text-xl font-bold text-green-600">
                              {type === "transfer" ? net : statusLabel(record.status)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}