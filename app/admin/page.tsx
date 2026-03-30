"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Transfer = {
  id: string;
  user_id: string;
  transfer_number: string;
  to_name: string;
  quantity: number | string;
  damaged_lost?: number | string;
  transfer_date: string;
  status: string;
  created_at?: string;
};

type Profile = {
  id: string;
  email: string | null;
  role?: string | null;
};

type AuditLog = {
  id: number;
  admin_user_id: string | null;
  admin_email: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  details: any;
  created_at: string;
};

type BackupPayload = {
  exported_at: string;
  exported_by: string;
  version: string;
  transfers: Transfer[];
  profiles: Profile[];
  audit_logs: AuditLog[];
};

export default function AdminPage() {
  const supabase = createClient();
  const restoreFileRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [adminUserId, setAdminUserId] = useState("");
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editToName, setEditToName] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editDamagedLost, setEditDamagedLost] = useState("");
  const [editTransferDate, setEditTransferDate] = useState("");
  const [editStatus, setEditStatus] = useState("pending_review");
  const [savingEdit, setSavingEdit] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(false);

  const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "";

  useEffect(() => {
    checkAdminAndLoad();
  }, []);

  const checkAdminAndLoad = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const email = user.email || "";
    setUserEmail(email);
    setAdminUserId(user.id);

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, role")
      .eq("id", user.id)
      .maybeSingle();

    const adminByRole = profile?.role === "admin";
    const adminByEmail = ADMIN_EMAIL && email === ADMIN_EMAIL;

    if (!adminByRole && !adminByEmail) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);
    await Promise.all([fetchProfiles(), fetchTransfers(), fetchAuditLogs()]);
    setLoading(false);
  };

  const refreshAll = async () => {
    setRefreshing(true);
    await Promise.all([fetchProfiles(), fetchTransfers(), fetchAuditLogs()]);
    setRefreshing(false);
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role")
      .order("email", { ascending: true });

    if (error) {
      console.log("Profiles fetch error:", error);
      setProfiles([]);
      return;
    }

    setProfiles((data || []) as Profile[]);
  };

  const fetchTransfers = async () => {
    const { data, error } = await supabase
      .from("transfers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Transfers fetch error:", error?.message || error);
      setTransfers([]);
      return;
    }

    setTransfers((data || []) as Transfer[]);
  };

  const fetchAuditLogs = async () => {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.log("Audit logs fetch error:", error?.message || error);
      setAuditLogs([]);
      return;
    }

    setAuditLogs((data || []) as AuditLog[]);
  };

  const writeAuditLog = async (
    action: string,
    targetId: string,
    details: Record<string, any>
  ) => {
    const { error } = await supabase.from("audit_logs").insert([
      {
        admin_user_id: adminUserId || null,
        admin_email: userEmail || null,
        action,
        target_table: "transfers",
        target_id: targetId,
        details,
      },
    ]);

    if (error) {
      console.log("Audit log write error:", error?.message || error);
    }
  };

  const getUserEmail = (userId: string) => {
    const profile = profiles.find((p) => p.id === userId);
    return profile?.email || userId;
  };

  const isInDateRange = (transferDateValue: string, filter: string) => {
    if (filter === "all") return true;
    if (!transferDateValue) return false;

    const transferDate = new Date(transferDateValue);
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    if (filter === "today") {
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);
      return transferDate >= startOfToday && transferDate < endOfToday;
    }

    if (filter === "week") {
      const sevenDaysAgo = new Date(startOfToday);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      return transferDate >= sevenDaysAgo;
    }

    if (filter === "month") {
      const thirtyDaysAgo = new Date(startOfToday);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      return transferDate >= thirtyDaysAgo;
    }

    return true;
  };

  const filteredTransfers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return transfers.filter((t) => {
      const matchesStatus =
        statusFilter === "all" ? true : t.status === statusFilter;

      const matchesDate = isInDateRange(t.transfer_date, dateFilter);

      const matchesUser =
        userFilter === "all" ? true : t.user_id === userFilter;

      const email = getUserEmail(t.user_id).toLowerCase();
      const destination = String(t.to_name || "").toLowerCase();
      const transferNumber = String(t.transfer_number || "").toLowerCase();

      const matchesSearch =
        term === ""
          ? true
          : email.includes(term) ||
            destination.includes(term) ||
            transferNumber.includes(term);

      return matchesStatus && matchesDate && matchesUser && matchesSearch;
    });
  }, [transfers, statusFilter, dateFilter, userFilter, searchTerm, profiles]);

  const totalTransfers = filteredTransfers.length;
  const totalPallets = filteredTransfers.reduce(
    (sum, t) => sum + (Number(t.quantity) || 0),
    0
  );
  const totalDamagedLost = filteredTransfers.reduce(
    (sum, t) => sum + (Number(t.damaged_lost) || 0),
    0
  );
  const totalNetDelivered = filteredTransfers.reduce(
    (sum, t) =>
      sum + ((Number(t.quantity) || 0) - (Number(t.damaged_lost) || 0)),
    0
  );
  const pendingCount = filteredTransfers.filter(
    (t) => t.status === "pending_review"
  ).length;
  const completedCount = filteredTransfers.filter(
    (t) => t.status === "completed"
  ).length;

  const lossPercentage =
    totalPallets > 0 ? ((totalDamagedLost / totalPallets) * 100).toFixed(1) : "0.0";

  const completionRate =
    totalTransfers > 0 ? ((completedCount / totalTransfers) * 100).toFixed(1) : "0.0";

  const pendingRate =
    totalTransfers > 0 ? ((pendingCount / totalTransfers) * 100).toFixed(1) : "0.0";

  const userSummaries = useMemo(() => {
    const map = new Map<string, any>();

    for (const t of filteredTransfers) {
      const current = map.get(t.user_id) || {
        user_id: t.user_id,
        email: getUserEmail(t.user_id),
        transfers: 0,
        pallets: 0,
        damaged: 0,
        net: 0,
      };

      current.transfers += 1;
      current.pallets += Number(t.quantity) || 0;
      current.damaged += Number(t.damaged_lost) || 0;
      current.net += (Number(t.quantity) || 0) - (Number(t.damaged_lost) || 0);

      map.set(t.user_id, current);
    }

    return Array.from(map.values()).sort((a, b) =>
      (a.email || "").localeCompare(b.email || "")
    );
  }, [filteredTransfers, profiles]);

  const topLossUsers = useMemo(() => {
    return [...userSummaries]
      .sort((a, b) => b.damaged - a.damaged)
      .slice(0, 5);
  }, [userSummaries]);

  const monthlyTrend = useMemo(() => {
    const buckets = new Map<string, { label: string; pallets: number; damaged: number }>();

    filteredTransfers.forEach((t) => {
      const d = new Date(t.transfer_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      });

      const current = buckets.get(key) || { label, pallets: 0, damaged: 0 };
      current.pallets += Number(t.quantity) || 0;
      current.damaged += Number(t.damaged_lost) || 0;
      buckets.set(key, current);
    });

    return Array.from(buckets.values()).slice(-6);
  }, [filteredTransfers]);

  const maxTrendValue = Math.max(
    1,
    ...monthlyTrend.flatMap((m) => [m.pallets, m.damaged])
  );

  const highLossTransfers = filteredTransfers.filter((t) => {
    const qty = Number(t.quantity) || 0;
    const damaged = Number(t.damaged_lost) || 0;
    if (qty <= 0) return false;
    return damaged / qty > 0.1;
  });

  const exportCsv = () => {
    const rows = filteredTransfers.map((t) => {
      const qty = Number(t.quantity) || 0;
      const damaged = Number(t.damaged_lost) || 0;
      const net = qty - damaged;
      const loss = qty > 0 ? ((damaged / qty) * 100).toFixed(1) : "0.0";

      return {
        transfer_number: t.transfer_number,
        user_email: getUserEmail(t.user_id),
        destination: t.to_name,
        quantity: qty,
        damaged_lost: damaged,
        net_delivered: net,
        loss_percent: loss,
        transfer_date: t.transfer_date,
        status: t.status,
      };
    });

    const headers = [
      "transfer_number",
      "user_email",
      "destination",
      "quantity",
      "damaged_lost",
      "net_delivered",
      "loss_percent",
      "transfer_date",
      "status",
    ];

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((header) => {
            const value = String((row as any)[header] ?? "");
            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "admin-transfers-report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJsonBackup = () => {
    const payload: BackupPayload = {
      exported_at: new Date().toISOString(),
      exported_by: userEmail,
      version: "1.0",
      transfers,
      profiles,
      audit_logs: auditLogs,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.href = url;
    link.setAttribute("download", `admin-backup-${timestamp}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const triggerRestoreFilePicker = () => {
    restoreFileRef.current?.click();
  };

  const handleRestoreBackupFile = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();

    try {
      const parsed = JSON.parse(text) as Partial<BackupPayload>;
      const restoreTransfers = Array.isArray(parsed.transfers)
        ? parsed.transfers
        : [];

      if (restoreTransfers.length === 0) {
        alert("No transfers found in backup file.");
        return;
      }

      const confirmed = window.confirm(
        `Restore ${restoreTransfers.length} transfer record(s)? This will upsert by id.`
      );

      if (!confirmed) return;

      setRestoringBackup(true);

      const sanitizedTransfers = restoreTransfers.map((t) => ({
        id: t.id,
        user_id: t.user_id,
        transfer_number: t.transfer_number,
        to_name: t.to_name,
        quantity: Number(t.quantity) || 0,
        damaged_lost: Number(t.damaged_lost) || 0,
        transfer_date: t.transfer_date,
        status: t.status || "pending_review",
      }));

      const { error } = await supabase
        .from("transfers")
        .upsert(sanitizedTransfers, { onConflict: "id" });

      setRestoringBackup(false);

      if (error) {
        alert(error.message);
        return;
      }

      await writeAuditLog("restore_backup", "bulk", {
        restored_count: sanitizedTransfers.length,
        file_name: file.name,
      });

      await refreshAll();
      alert("Backup restore completed.");
    } catch {
      setRestoringBackup(false);
      alert("Invalid backup file.");
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const restoreDeletedTransferFromAudit = async (log: AuditLog) => {
    const deletedTransfer = log?.details?.deleted_transfer;

    if (!deletedTransfer) {
      alert("No deleted transfer data found in this audit log.");
      return;
    }

    const confirmed = window.confirm(
      `Restore deleted transfer ${deletedTransfer.transfer_number || deletedTransfer.id}?`
    );

    if (!confirmed) return;

    const restorePayload = {
      id: deletedTransfer.id,
      user_id: deletedTransfer.user_id,
      transfer_number: deletedTransfer.transfer_number,
      to_name: deletedTransfer.to_name,
      quantity: Number(deletedTransfer.quantity) || 0,
      damaged_lost: Number(deletedTransfer.damaged_lost) || 0,
      transfer_date: deletedTransfer.transfer_date,
      status: deletedTransfer.status || "pending_review",
    };

    const { error } = await supabase
      .from("transfers")
      .upsert([restorePayload], { onConflict: "id" });

    if (error) {
      alert(error.message);
      return;
    }

    await writeAuditLog("restore_deleted_transfer", String(restorePayload.id), {
      source_audit_log_id: log.id,
      restored_transfer: restorePayload,
    });

    await refreshAll();
  };

  const printReport = () => {
    window.print();
  };

  const startEdit = (t: Transfer) => {
    setEditingId(t.id);
    setEditToName(String(t.to_name || ""));
    setEditQuantity(String(t.quantity ?? ""));
    setEditDamagedLost(String(t.damaged_lost ?? 0));
    setEditTransferDate(String(t.transfer_date || ""));
    setEditStatus(String(t.status || "pending_review"));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditToName("");
    setEditQuantity("");
    setEditDamagedLost("");
    setEditTransferDate("");
    setEditStatus("pending_review");
  };

  const saveEdit = async (id: string) => {
    const existing = transfers.find((t) => t.id === id);
    const quantityNumber = Number(editQuantity);
    const damagedLostNumber = Number(editDamagedLost);

    if (!editToName.trim()) {
      alert("Destination name is required.");
      return;
    }

    if (!editTransferDate) {
      alert("Shipment date is required.");
      return;
    }

    if (Number.isNaN(quantityNumber) || quantityNumber <= 0) {
      alert("Quantity must be greater than 0.");
      return;
    }

    if (Number.isNaN(damagedLostNumber) || damagedLostNumber < 0) {
      alert("Damaged / Lost must be 0 or greater.");
      return;
    }

    if (damagedLostNumber > quantityNumber) {
      alert("Damaged / Lost cannot be greater than quantity.");
      return;
    }

    setSavingEdit(true);

    const { error } = await supabase
      .from("transfers")
      .update({
        to_name: editToName.trim(),
        quantity: quantityNumber,
        damaged_lost: damagedLostNumber,
        transfer_date: editTransferDate,
        status: editStatus,
      })
      .eq("id", id);

    setSavingEdit(false);

    if (error) {
      alert(error.message);
      return;
    }

    await writeAuditLog("update_transfer", id, {
      before: existing || null,
      after: {
        to_name: editToName.trim(),
        quantity: quantityNumber,
        damaged_lost: damagedLostNumber,
        transfer_date: editTransferDate,
        status: editStatus,
      },
    });

    cancelEdit();
    await refreshAll();
  };

  if (loading) {
    return (
      <>
        <style>{printStyles}</style>
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="rounded-2xl bg-white px-6 py-4 shadow-sm text-slate-700">
            Loading admin dashboard...
          </div>
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <style>{printStyles}</style>
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
          <div className="max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
            <h1 className="text-2xl font-bold text-slate-900">Access denied</h1>
            <p className="mt-3 text-slate-600">
              This page is for admins only.
            </p>
            <button
              onClick={() => {
                window.location.href = "/dashboard";
              }}
              className="mt-5 rounded-xl bg-slate-800 px-4 py-2 text-white"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{printStyles}</style>

      <input
        ref={restoreFileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={handleRestoreBackupFile}
      />

      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto max-w-7xl p-6">
          <div className="mb-8 rounded-3xl bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">
                  Admin Dashboard
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  System-wide view of all users, shipments, analytics, alerts, audit history, and recovery tools
                </p>
                <p className="mt-2 text-xs font-medium text-slate-400">
                  Signed in as: {userEmail}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 no-print">
                <button
                  onClick={refreshAll}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>

                <button
                  onClick={exportCsv}
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  Export CSV
                </button>

                <button
                  onClick={exportJsonBackup}
                  className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
                >
                  Download Backup
                </button>

                <button
                  onClick={triggerRestoreFilePicker}
                  disabled={restoringBackup}
                  className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  {restoringBackup ? "Restoring..." : "Restore Backup"}
                </button>

                <button
                  onClick={printReport}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Printable Report
                </button>

                <button
                  onClick={() => {
                    window.location.href = "/dashboard";
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  User Dashboard
                </button>

                <button
                  onClick={async () => {
                    await supabase.auth.signOut();
                    window.location.href = "/login";
                  }}
                  className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {highLossTransfers.length > 0 && (
            <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-red-700">
                Alerts: High Loss Transfers
              </h2>
              <p className="mt-1 text-sm text-red-600">
                {highLossTransfers.length} transfer(s) are above 10% loss.
              </p>
            </div>
          )}

          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Transfers</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalTransfers}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Pallets</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {totalPallets}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Damaged / Lost</p>
              <p className="mt-2 text-3xl font-bold text-red-600">
                {totalDamagedLost}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Net Delivered</p>
              <p className="mt-2 text-3xl font-bold text-green-600">
                {totalNetDelivered}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Pending</p>
              <p className="mt-2 text-3xl font-bold text-amber-600">
                {pendingCount}
              </p>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Loss %</p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {lossPercentage}%
              </p>
            </div>
          </div>

          <div className="mb-6 grid gap-4 lg:grid-cols-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Completion Rate
                </span>
                <span className="text-sm text-slate-500">{completionRate}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-green-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Pending Rate
                </span>
                <span className="text-sm text-slate-500">{pendingRate}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200">
                <div
                  className="h-3 rounded-full bg-amber-500"
                  style={{ width: `${pendingRate}%` }}
                />
              </div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">
                  Loss Percentage
                </span>
                <span className="text-sm text-slate-500">{lossPercentage}%</span>
              </div>
              <div className="h-3 w-full rounded-full bg-slate-200">
                <div
                  className={`h-3 rounded-full ${
                    Number(lossPercentage) > 10
                      ? "bg-red-500"
                      : Number(lossPercentage) > 0
                      ? "bg-amber-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${Math.min(Number(lossPercentage), 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-3 no-print">
            <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-1">
              <h2 className="text-xl font-semibold text-slate-900">Filters</h2>
              <p className="mt-1 text-sm text-slate-500">
                Narrow down system data
              </p>

              <div className="mt-5 space-y-5">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Search
                  </p>
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Email, destination, or transfer #"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  />
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    User
                  </p>
                  <select
                    value={userFilter}
                    onChange={(e) => setUserFilter(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                  >
                    <option value="all">All Users</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.email || p.id}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Status
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ${
                        statusFilter === "all"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter("pending_review")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ${
                        statusFilter === "pending_review"
                          ? "bg-amber-500 text-white"
                          : "border border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      Pending
                    </button>
                    <button
                      onClick={() => setStatusFilter("completed")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ${
                        statusFilter === "completed"
                          ? "bg-green-600 text-white"
                          : "border border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      Completed
                    </button>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Date Range
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setDateFilter("all")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ${
                        dateFilter === "all"
                          ? "bg-slate-900 text-white"
                          : "border border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      All Dates
                    </button>
                    <button
                      onClick={() => setDateFilter("today")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ${
                        dateFilter === "today"
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => setDateFilter("week")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ${
                        dateFilter === "week"
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      Last 7 Days
                    </button>
                    <button
                      onClick={() => setDateFilter("month")}
                      className={`rounded-xl px-3 py-2 text-sm font-medium ${
                        dateFilter === "month"
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      Last 30 Days
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-2">
              <h2 className="text-xl font-semibold text-slate-900">
                User Totals
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Summary by user across current filters
              </p>

              <div className="mt-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="pb-3 pr-4">User</th>
                      <th className="pb-3 pr-4">Transfers</th>
                      <th className="pb-3 pr-4">Pallets</th>
                      <th className="pb-3 pr-4">Damaged</th>
                      <th className="pb-3 pr-4">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400">
                          No users found for the current filters.
                        </td>
                      </tr>
                    ) : (
                      userSummaries.map((u) => (
                        <tr key={u.user_id} className="border-b border-slate-100">
                          <td className="py-3 pr-4">{u.email || u.user_id}</td>
                          <td className="py-3 pr-4">{u.transfers}</td>
                          <td className="py-3 pr-4">{u.pallets}</td>
                          <td className="py-3 pr-4 text-red-600">{u.damaged}</td>
                          <td className="py-3 pr-4 text-green-600">{u.net}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Top Loss Users
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Highest damaged/lost totals in current filters
              </p>

              <div className="mt-5 space-y-4">
                {topLossUsers.length === 0 ? (
                  <p className="text-sm text-slate-400">No data available.</p>
                ) : (
                  topLossUsers.map((u) => {
                    const maxDamaged = Math.max(
                      1,
                      ...topLossUsers.map((item) => item.damaged)
                    );
                    const width = (u.damaged / maxDamaged) * 100;

                    return (
                      <div key={u.user_id}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-700">
                            {u.email}
                          </span>
                          <span className="text-red-600 font-semibold">
                            {u.damaged}
                          </span>
                        </div>
                        <div className="h-3 rounded-full bg-slate-200">
                          <div
                            className="h-3 rounded-full bg-red-500"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900">
                Shipment Trend
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Last 6 month buckets for pallets and damaged/lost
              </p>

              <div className="mt-5 space-y-4">
                {monthlyTrend.length === 0 ? (
                  <p className="text-sm text-slate-400">No trend data available.</p>
                ) : (
                  monthlyTrend.map((m) => (
                    <div key={m.label}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-700">{m.label}</span>
                        <span className="text-slate-500">
                          {m.pallets} pallets / {m.damaged} damaged
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <div className="mb-1 text-xs text-slate-500">Pallets</div>
                          <div className="h-3 rounded-full bg-slate-200">
                            <div
                              className="h-3 rounded-full bg-blue-500"
                              style={{ width: `${(m.pallets / maxTrendValue) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="mb-1 text-xs text-slate-500">Damaged</div>
                          <div className="h-3 rounded-full bg-slate-200">
                            <div
                              className="h-3 rounded-full bg-red-500"
                              style={{ width: `${(m.damaged / maxTrendValue) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Backup & Recovery
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Download full backups, restore from backup files, and recover deleted transfers
            </p>

            <div className="mt-5 flex flex-wrap gap-3 no-print">
              <button
                onClick={exportJsonBackup}
                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Download Full JSON Backup
              </button>

              <button
                onClick={triggerRestoreFilePicker}
                disabled={restoringBackup}
                className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
              >
                {restoringBackup ? "Restoring Backup..." : "Restore From Backup File"}
              </button>
            </div>

            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Backup files include transfers, profiles, and recent audit logs. Restore currently upserts transfer records by id for safe recovery of deleted or changed shipment data.
            </div>
          </div>

          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              User Management
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Role changes are disabled for now.
            </p>
          </div>

          <div className="mb-6 rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              Audit Log
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Recent admin actions on transfers, with recovery tools
            </p>

            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-3 pr-4">Time</th>
                    <th className="pb-3 pr-4">Admin</th>
                    <th className="pb-3 pr-4">Action</th>
                    <th className="pb-3 pr-4">Target ID</th>
                    <th className="pb-3 pr-4 no-print">Recovery</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        No audit events yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-100">
                        <td className="py-3 pr-4">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">{log.admin_email || "-"}</td>
                        <td className="py-3 pr-4">{log.action}</td>
                        <td className="py-3 pr-4">{log.target_id || "-"}</td>
                        <td className="py-3 pr-4 no-print">
                          {log.action === "delete_transfer" &&
                          log?.details?.deleted_transfer ? (
                            <button
                              onClick={() => restoreDeletedTransferFromAudit(log)}
                              className="rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                            >
                              Restore Deleted Transfer
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
              All Transfers
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View, edit, and manage shipment records across all users
            </p>

            <div className="mt-5 space-y-4">
              {filteredTransfers.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
                  No transfers found for the current filters.
                </div>
              ) : (
                filteredTransfers.map((t) => {
                  const damaged = Number(t.damaged_lost) || 0;
                  const qty = Number(t.quantity) || 0;
                  const netDelivered = qty - damaged;
                  const rowLossPercent =
                    qty > 0 ? ((damaged / qty) * 100).toFixed(1) : "0.0";

                  const isEditing = editingId === t.id;

                  return (
                    <div
                      key={t.id}
                      className={`rounded-3xl border p-5 ${
                        damaged > 0
                          ? "border-red-200 bg-red-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-4">
                          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-lg font-bold text-slate-900">
                                Editing {t.transfer_number}
                              </p>
                              <p className="text-sm text-slate-500">
                                User: {getUserEmail(t.user_id)}
                              </p>
                            </div>

                            <div className="flex gap-2 no-print">
                              <button
                                onClick={cancelEdit}
                                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => saveEdit(t.id)}
                                disabled={savingEdit}
                                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                              >
                                {savingEdit ? "Saving..." : "Save Changes"}
                              </button>
                            </div>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2">
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Destination
                              </label>
                              <input
                                value={editToName}
                                onChange={(e) => setEditToName(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Shipment Date
                              </label>
                              <input
                                type="date"
                                value={editTransferDate}
                                onChange={(e) => setEditTransferDate(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="1"
                                value={editQuantity}
                                onChange={(e) => setEditQuantity(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                              />
                            </div>

                            <div>
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Damaged / Lost
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={editDamagedLost}
                                onChange={(e) => setEditDamagedLost(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                              />
                            </div>

                            <div className="md:col-span-2">
                              <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Status
                              </label>
                              <select
                                value={editStatus}
                                onChange={(e) => setEditStatus(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none"
                              >
                                <option value="pending_review">pending_review</option>
                                <option value="completed">completed</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <p className="text-lg font-bold text-slate-900">
                              {t.transfer_number}
                            </p>

                            <p className="text-slate-700">
                              <span className="font-semibold">User:</span>{" "}
                              {getUserEmail(t.user_id)}
                            </p>

                            <p className="text-slate-700">
                              <span className="font-semibold">Destination:</span>{" "}
                              {t.to_name}
                            </p>

                            <p className="text-slate-700">
                              <span className="font-semibold">Quantity:</span> {qty}
                            </p>

                            <p className="text-slate-700">
                              <span className="font-semibold">Damaged/Lost:</span>{" "}
                              <span
                                className={
                                  damaged > 0
                                    ? "font-semibold text-red-600"
                                    : "font-semibold text-slate-700"
                                }
                              >
                                {damaged}
                              </span>
                            </p>

                            <p className="text-slate-700">
                              <span className="font-semibold">Net Delivered:</span>{" "}
                              <span
                                className={
                                  damaged > 0
                                    ? "font-semibold text-red-600"
                                    : "font-semibold text-green-600"
                                }
                              >
                                {netDelivered}
                              </span>
                            </p>

                            <p className="text-slate-700">
                              <span className="font-semibold">Loss %:</span>{" "}
                              <span
                                className={
                                  Number(rowLossPercent) > 10
                                    ? "font-semibold text-red-600"
                                    : Number(rowLossPercent) > 0
                                    ? "font-semibold text-amber-600"
                                    : "font-semibold text-green-600"
                                }
                              >
                                {rowLossPercent}%
                              </span>
                            </p>

                            <p className="text-slate-700">
                              <span className="font-semibold">Shipment Date:</span>{" "}
                              {t.transfer_date}
                            </p>

                            <p>
                              <span className="font-semibold text-slate-700">
                                Status:
                              </span>{" "}
                              <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                                  t.status === "completed"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {t.status}
                              </span>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 no-print">
                            <button
                              onClick={() => startEdit(t)}
                              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                            >
                              Edit
                            </button>

                            <button
                              onClick={async () => {
                                const { error } = await supabase
                                  .from("transfers")
                                  .delete()
                                  .eq("id", t.id);

                                if (error) {
                                  alert(error.message);
                                } else {
                                  await writeAuditLog("delete_transfer", t.id, {
                                    deleted_transfer: t,
                                  });
                                  refreshAll();
                                }
                              }}
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                            >
                              Delete
                            </button>

                            <button
                              onClick={async () => {
                                const newStatus =
                                  t.status === "pending_review"
                                    ? "completed"
                                    : "pending_review";

                                const { error } = await supabase
                                  .from("transfers")
                                  .update({ status: newStatus })
                                  .eq("id", t.id);

                                if (error) {
                                  alert(error.message);
                                } else {
                                  await writeAuditLog("toggle_status", t.id, {
                                    before_status: t.status,
                                    after_status: newStatus,
                                  });
                                  refreshAll();
                                }
                              }}
                              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                              {t.status === "pending_review"
                                ? "Mark Complete"
                                : "Mark Pending"}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

const printStyles = `
@media print {
  body {
    background: white !important;
  }

  .no-print {
    display: none !important;
  }

  .rounded-3xl,
  .rounded-2xl {
    border-radius: 0 !important;
  }

  .shadow-sm {
    box-shadow: none !important;
  }

  .bg-slate-100,
  .bg-slate-50,
  .bg-white,
  .bg-red-50 {
    background: white !important;
  }

  .border,
  .border-slate-200,
  .border-red-200,
  .border-dashed {
    border-color: #d1d5db !important;
  }

  .text-red-600,
  .text-green-600,
  .text-amber-600,
  .text-slate-900,
  .text-slate-700,
  .text-slate-500 {
    color: black !important;
  }

  button {
    display: none !important;
  }

  input,
  select {
    border: 1px solid #d1d5db !important;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th, td {
    border-bottom: 1px solid #e5e7eb;
    padding: 8px;
  }

  @page {
    size: auto;
    margin: 16mm;
  }
}
`;