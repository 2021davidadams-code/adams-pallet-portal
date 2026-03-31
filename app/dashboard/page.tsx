"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string | null;
  role?: string | null;
  company_name?: string | null;
};

type Transfer = {
  id: string;
  user_id: string;
  destination: string | null;
  quantity: number | string | null;
  damaged: number | string | null;
  shipment_date: string | null;
  status: string | null;
  created_at: string | null;
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

export default function DashboardPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");

  const [userId, setUserId] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  const [destination, setDestination] = useState("");
  const [quantity, setQuantity] = useState("");
  const [damaged, setDamaged] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const loadDashboard = async () => {
    setLoading(true);
    setPageError("");

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
      .select("id, email, role, company_name")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      console.log("Profile fetch error:", profileError.message || profileError);
    }

    let resolvedProfile = (profileData as Profile | null) || null;

    if (!resolvedProfile || (!resolvedProfile.company_name && metadataCompanyName)) {
      const upsertPayload = {
        id: user.id,
        email: cleanEmail,
        role: resolvedProfile?.role || "user",
        company_name: metadataCompanyName || resolvedProfile?.company_name || null,
      };

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(upsertPayload, { onConflict: "id" });

      if (upsertError) {
        console.log("Profile upsert error:", upsertError.message || upsertError);
      } else {
        resolvedProfile = {
          id: user.id,
          email: cleanEmail,
          role: resolvedProfile?.role || "user",
          company_name: metadataCompanyName || resolvedProfile?.company_name || null,
        };
      }
    }

    setProfile(resolvedProfile);

    const { data: transfersData, error: transfersError } = await supabase
      .from("transfers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (transfersError) {
      console.log("Transfers fetch error:", transfersError.message || transfersError);
      setTransfers([]);
    } else {
      setTransfers((transfersData as Transfer[]) || []);
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

  const filteredTransfers = useMemo(() => {
    const now = new Date();

    return transfers.filter((transfer) => {
      if (statusFilter !== "all" && (transfer.status || "") !== statusFilter) {
        return false;
      }

      if (dateFilter === "all") {
        return true;
      }

      const rawDate = transfer.shipment_date || transfer.created_at;
      if (!rawDate) return false;

      const transferDate = new Date(rawDate);
      if (Number.isNaN(transferDate.getTime())) return false;

      if (dateFilter === "today") {
        return transferDate.toDateString() === now.toDateString();
      }

      if (dateFilter === "last7") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(now.getDate() - 7);
        return transferDate >= sevenDaysAgo;
      }

      if (dateFilter === "last30") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        return transferDate >= thirtyDaysAgo;
      }

      return true;
    });
  }, [transfers, statusFilter, dateFilter]);

  const totals = useMemo(() => {
    return filteredTransfers.reduce(
      (acc, transfer) => {
        const qty = Number(transfer.quantity || 0);
        const dmg = Number(transfer.damaged || 0);
        const status = transfer.status || "";

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
  }, [filteredTransfers]);

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

    setSubmitting(true);

    const { error } = await supabase.from("transfers").insert([
      {
        user_id: userId,
        destination: cleanDestination,
        quantity: qty,
        damaged: dmg,
        shipment_date: shipmentDate || null,
        status: "pending_review",
      },
    ]);

    if (error) {
      alert(error.message);
      setSubmitting(false);
      return;
    }

    setDestination("");
    setQuantity("");
    setDamaged("");
    setShipmentDate("");
    await loadDashboard();
    setSubmitting(false);
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
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-3 text-4xl font-bold text-amber-600">{totals.pending}</p>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="mt-3 text-4xl font-bold text-slate-900">{totals.completed}</p>
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

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
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
                disabled={submitting}
                className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {submitting ? "Adding Transfer..." : "Add Transfer"}
              </button>
            </form>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Transfers</h2>
            <p className="mt-2 text-slate-500">View and manage your pallet movements.</p>

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
              {filteredTransfers.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  No transfers found for the current filters.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filteredTransfers.map((transfer) => {
                    const qty = Number(transfer.quantity || 0);
                    const dmg = Number(transfer.damaged || 0);
                    const net = Math.max(qty - dmg, 0);

                    return (
                      <div key={transfer.id} className="bg-white p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <p className="text-lg font-bold text-slate-900">
                              {transfer.destination || "Unnamed Destination"}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {formatDate(transfer.shipment_date || transfer.created_at)}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              Company: {companyDisplayName}
                            </p>
                          </div>

                          <span
                            className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                              transfer.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {statusLabel(transfer.status)}
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
                            <p className="mt-2 text-xl font-bold text-red-600">{dmg}</p>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="text-xs uppercase tracking-wide text-slate-500">
                              Net Delivered
                            </p>
                            <p className="mt-2 text-xl font-bold text-green-600">{net}</p>
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