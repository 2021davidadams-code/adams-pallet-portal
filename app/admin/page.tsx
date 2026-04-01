"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  email: string;
  role: string;
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

type AuditLog = {
  id: string;
  action: string | null;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  created_at: string | null;
  user_id?: string | null;
};

type EditTransferForm = {
  id: string;
  destination: string;
  quantity: string;
  damaged: string;
  shipment_date: string;
  status: string;
  request_type: string;
  notes: string;
};

type EditUserForm = {
  id: string;
  company_name: string;
  role: string;
  is_active: boolean;
};

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() || "";

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
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

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function AdminPage() {
  const supabase = createClient();
  const restoreInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [userFilter, setUserFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [editingTransfer, setEditingTransfer] = useState<EditTransferForm | null>(null);
  const [editingUser, setEditingUser] = useState<EditUserForm | null>(null);
  const [busyAction, setBusyAction] = useState<string>("");
  const [pageError, setPageError] = useState("");

  const profileLookup = useMemo(() => {
    return profiles.reduce<Record<string, Profile>>((acc, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {});
  }, [profiles]);

  const getUserDisplayName = (userId: string) => {
    const profile = profileLookup[userId];
    if (!profile) return userId;
    return profile.company_name?.trim() || profile.email || userId;
  };

  const getUserSecondaryText = (userId: string) => {
    const profile = profileLookup[userId];
    if (!profile) return "";
    if (profile.company_name?.trim() && profile.email) return profile.email;
    return "";
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, role, company_name, is_active")
      .order("email", { ascending: true });

    if (error) {
      console.log("Profiles fetch error:", error.message || error);
      setProfiles([]);
      return;
    }

    setProfiles((data as Profile[]) || []);
  };

  const fetchTransfers = async () => {
    const { data, error } = await supabase
      .from("transfers")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.log("Transfers fetch error:", error.message || error);
      setTransfers([]);
      return;
    }

    setTransfers((data as Transfer[]) || []);
  };

  const fetchAuditLogs = async () => {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.log("Audit logs fetch error:", error.message || error);
      setAuditLogs([]);
      return;
    }

    setAuditLogs((data as AuditLog[]) || []);
  };

  const addAuditLog = async (
    action: string,
    entityType: string,
    entityId: string,
    details: any
  ) => {
    try {
      await supabase.from("audit_logs").insert([
        {
          action,
          entity_type: entityType,
          entity_id: entityId,
          details,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (error) {
      console.log("Audit log insert failed:", error);
    }
  };

  const checkAdminAndLoad = async () => {
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

    const currentEmail = (user.email || "").toLowerCase();
    setAuthEmail(currentEmail);

    const { data: profileById, error: profileByIdError } = await supabase
      .from("profiles")
      .select("id, email, role, company_name, is_active")
      .eq("id", user.id)
      .maybeSingle();

    let resolvedProfile = profileById as Profile | null;

    if (!resolvedProfile && user.email) {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("id, email, role, company_name, is_active")
        .eq("email", currentEmail)
        .maybeSingle();

      resolvedProfile = profileByEmail as Profile | null;
    }

    if (profileByIdError) {
      console.log("Profile fetch error:", profileByIdError.message || profileByIdError);
    }

    const emailIsAdmin =
      !!currentEmail && currentEmail === ADMIN_EMAIL && ADMIN_EMAIL !== "";

    const profileIsActive = resolvedProfile?.is_active !== false;

    const hasAdminAccess =
      profileIsActive && (resolvedProfile?.role === "admin" || emailIsAdmin);

    if (!hasAdminAccess) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    setIsAdmin(true);

    await Promise.all([fetchProfiles(), fetchTransfers(), fetchAuditLogs()]);

    setLoading(false);
  };

  useEffect(() => {
    checkAdminAndLoad();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTransfers = useMemo(() => {
    const now = new Date();

    return transfers.filter((transfer) => {
      if (userFilter !== "all" && transfer.user_id !== userFilter) {
        return false;
      }

      if (statusFilter !== "all" && (transfer.status || "") !== statusFilter) {
        return false;
      }

      if (dateFilter === "all") {
        return true;
      }

      const rawDate = transfer.shipment_date || transfer.transfer_date || transfer.created_at;
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
  }, [transfers, userFilter, statusFilter, dateFilter]);

  const transferOnlyRecords = useMemo(() => {
    return filteredTransfers.filter(
      (transfer) => (transfer.request_type || "transfer") === "transfer"
    );
  }, [filteredTransfers]);

  const serviceRequests = useMemo(() => {
    return filteredTransfers.filter(
      (transfer) => (transfer.request_type || "transfer") !== "transfer"
    );
  }, [filteredTransfers]);

  const totals = useMemo(() => {
    return transferOnlyRecords.reduce(
      (acc, transfer) => {
        const quantity = Number(transfer.quantity || 0);
        const damaged = Number(transfer.damaged || 0);
        const status = transfer.status || "";

        acc.totalTransfers += 1;
        acc.totalPallets += quantity;
        acc.damagedLost += damaged;
        acc.netDelivered += Math.max(quantity - damaged, 0);

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
  }, [transferOnlyRecords]);

  const pendingRequestCount = useMemo(() => {
    return serviceRequests.filter((transfer) => transfer.status === "pending_review").length;
  }, [serviceRequests]);

  const userSummaries = useMemo(() => {
    const grouped = transferOnlyRecords.reduce<
      Record<
        string,
        {
          userId: string;
          transfers: number;
          pallets: number;
          damaged: number;
          net: number;
        }
      >
    >((acc, transfer) => {
      const key = transfer.user_id || "unknown";
      const quantity = Number(transfer.quantity || 0);
      const damaged = Number(transfer.damaged || 0);

      if (!acc[key]) {
        acc[key] = {
          userId: key,
          transfers: 0,
          pallets: 0,
          damaged: 0,
          net: 0,
        };
      }

      acc[key].transfers += 1;
      acc[key].pallets += quantity;
      acc[key].damaged += damaged;
      acc[key].net += Math.max(quantity - damaged, 0);

      return acc;
    }, {});

    return Object.values(grouped).sort((a, b) => b.pallets - a.pallets);
  }, [transferOnlyRecords]);

  const startEditTransfer = (transfer: Transfer) => {
    setEditingTransfer({
      id: transfer.id,
      destination: transfer.destination || "",
      quantity: String(transfer.quantity ?? ""),
      damaged: String(transfer.damaged ?? ""),
      shipment_date: transfer.shipment_date
        ? String(transfer.shipment_date).slice(0, 10)
        : "",
      status: transfer.status || "pending_review",
      request_type: transfer.request_type || "transfer",
      notes: transfer.notes || "",
    });
  };

  const cancelEditTransfer = () => {
    setEditingTransfer(null);
  };

  const saveTransferEdits = async () => {
    if (!editingTransfer) return;

    const destination = editingTransfer.destination.trim();
    const quantity = Number(editingTransfer.quantity || 0);
    const damaged = Number(editingTransfer.damaged || 0);

    if (!destination) {
      alert("Destination is required.");
      return;
    }

    if (Number.isNaN(quantity) || quantity < 0) {
      alert("Quantity must be a valid number.");
      return;
    }

    if (Number.isNaN(damaged) || damaged < 0) {
      alert("Damaged / lost must be a valid number.");
      return;
    }

    setBusyAction(`save-${editingTransfer.id}`);

    const effectiveDate =
      editingTransfer.shipment_date || new Date().toISOString().slice(0, 10);

    const payload = {
      destination,
      to_name: destination,
      quantity,
      damaged,
      shipment_date: effectiveDate,
      transfer_date: effectiveDate,
      status: editingTransfer.status || "pending_review",
      request_type: editingTransfer.request_type || "transfer",
      notes: editingTransfer.notes.trim() || null,
    };

    const { error } = await supabase
      .from("transfers")
      .update(payload)
      .eq("id", editingTransfer.id);

    if (error) {
      alert(error.message);
      setBusyAction("");
      return;
    }

    await addAuditLog("update", "transfer", editingTransfer.id, payload);
    await fetchTransfers();
    await fetchAuditLogs();
    setEditingTransfer(null);
    setBusyAction("");
  };

  const toggleTransferStatus = async (transfer: Transfer) => {
    const newStatus =
      transfer.status === "pending_review" ? "completed" : "pending_review";

    setBusyAction(`toggle-${transfer.id}`);

    const { error } = await supabase
      .from("transfers")
      .update({ status: newStatus })
      .eq("id", transfer.id);

    if (error) {
      alert(error.message);
      setBusyAction("");
      return;
    }

    await addAuditLog("status_change", "transfer", transfer.id, {
      from: transfer.status,
      to: newStatus,
    });

    await fetchTransfers();
    await fetchAuditLogs();
    setBusyAction("");
  };

  const deleteTransfer = async (transfer: Transfer) => {
    const confirmed = window.confirm(
      `Delete ${requestTypeLabel(transfer.request_type)} ${transfer.transfer_number || ""}?`
    );

    if (!confirmed) return;

    setBusyAction(`delete-${transfer.id}`);

    const { error } = await supabase
      .from("transfers")
      .delete()
      .eq("id", transfer.id);

    if (error) {
      alert(error.message);
      setBusyAction("");
      return;
    }

    await addAuditLog("delete", "transfer", transfer.id, transfer);
    await fetchTransfers();
    await fetchAuditLogs();
    setBusyAction("");
  };

  const startEditUser = (profile: Profile) => {
    setEditingUser({
      id: profile.id,
      company_name: profile.company_name || "",
      role: profile.role || "user",
      is_active: profile.is_active !== false,
    });
  };

  const cancelEditUser = () => {
    setEditingUser(null);
  };

  const saveUserEdits = async () => {
    if (!editingUser) return;

    const originalProfile = profiles.find((profile) => profile.id === editingUser.id);
    if (!originalProfile) return;

    const cleanCompanyName = editingUser.company_name.trim();
    if (!cleanCompanyName) {
      alert("Company name is required.");
      return;
    }

    const originalEmail = (originalProfile.email || "").toLowerCase();

    if (originalEmail === ADMIN_EMAIL && editingUser.role !== "admin") {
      alert("You cannot remove admin from the protected admin email.");
      return;
    }

    if (originalEmail === ADMIN_EMAIL && editingUser.is_active === false) {
      alert("You cannot remove access for the protected admin email.");
      return;
    }

    if (originalEmail === authEmail && editingUser.is_active === false) {
      alert("You cannot remove access for your current admin session.");
      return;
    }

    setBusyAction(`user-save-${editingUser.id}`);

    const payload = {
      company_name: cleanCompanyName,
      role: editingUser.role,
      is_active: editingUser.is_active,
    };

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", editingUser.id);

    if (error) {
      alert(error.message);
      setBusyAction("");
      return;
    }

    await addAuditLog("user_update", "profile", editingUser.id, {
      email: originalProfile.email,
      before: {
        company_name: originalProfile.company_name,
        role: originalProfile.role,
        is_active: originalProfile.is_active,
      },
      after: payload,
    });

    await fetchProfiles();
    await fetchAuditLogs();
    setEditingUser(null);
    setBusyAction("");
  };

  const toggleUserAccess = async (profile: Profile) => {
    const email = (profile.email || "").toLowerCase();
    const nextIsActive = profile.is_active === false ? true : false;

    if (email === ADMIN_EMAIL && !nextIsActive) {
      alert("You cannot remove access for the protected admin email.");
      return;
    }

    if (email === authEmail && !nextIsActive) {
      alert("You cannot remove access for your current admin session.");
      return;
    }

    const confirmed = window.confirm(
      nextIsActive
        ? `Restore access for ${profile.company_name?.trim() || profile.email}?`
        : `Remove access for ${profile.company_name?.trim() || profile.email}?`
    );

    if (!confirmed) return;

    setBusyAction(`access-${profile.id}`);

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: nextIsActive })
      .eq("id", profile.id);

    if (error) {
      alert(error.message);
      setBusyAction("");
      return;
    }

    await addAuditLog("user_access_change", "profile", profile.id, {
      email: profile.email,
      company_name: profile.company_name,
      from: profile.is_active !== false,
      to: nextIsActive,
    });

    await fetchProfiles();
    await fetchAuditLogs();
    setBusyAction("");
  };

  const exportCsv = () => {
    const rows = [
      [
        "TransferNumber",
        "Type",
        "Company",
        "Email",
        "Destination",
        "Quantity",
        "DamagedLost",
        "NetDelivered",
        "ShipmentDate",
        "Status",
        "Notes",
        "CreatedAt",
      ],
      ...filteredTransfers.map((transfer) => {
        const company = getUserDisplayName(transfer.user_id);
        const email =
          getUserSecondaryText(transfer.user_id) ||
          profileLookup[transfer.user_id]?.email ||
          "";
        const quantity = Number(transfer.quantity || 0);
        const damaged = Number(transfer.damaged || 0);
        return [
          transfer.transfer_number || "",
          requestTypeLabel(transfer.request_type),
          company,
          email,
          transfer.destination || "",
          String(quantity),
          String(damaged),
          String(Math.max(quantity - damaged, 0)),
          transfer.shipment_date || transfer.transfer_date || "",
          statusLabel(transfer.status),
          transfer.notes || "",
          transfer.created_at || "",
        ];
      }),
    ];

    const csv = rows
      .map((row) =>
        row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `admin-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadBackup = async () => {
    const payload = {
      exportedAt: new Date().toISOString(),
      profiles,
      transfers,
      auditLogs,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `adams-pallet-plus-backup-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestoreBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const confirmed = window.confirm(
      "Restore from backup file? This can overwrite existing data."
    );
    if (!confirmed) {
      event.target.value = "";
      return;
    }

    setBusyAction("restore");

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (Array.isArray(parsed.profiles) && parsed.profiles.length > 0) {
        const { error: profilesError } = await supabase.from("profiles").upsert(
          parsed.profiles.map((profile: Profile) => ({
            id: profile.id,
            email: profile.email,
            role: profile.role,
            company_name: profile.company_name || null,
            is_active: profile.is_active !== false,
          })),
          { onConflict: "id" }
        );

        if (profilesError) throw profilesError;
      }

      if (Array.isArray(parsed.transfers) && parsed.transfers.length > 0) {
        const { error: transfersError } = await supabase
          .from("transfers")
          .upsert(parsed.transfers, { onConflict: "id" });

        if (transfersError) throw transfersError;
      }

      if (Array.isArray(parsed.auditLogs) && parsed.auditLogs.length > 0) {
        const { error: auditError } = await supabase
          .from("audit_logs")
          .upsert(parsed.auditLogs, { onConflict: "id" });

        if (auditError) {
          console.log("Audit log restore skipped:", auditError.message || auditError);
        }
      }

      await addAuditLog("restore", "backup", "backup-file", {
        fileName: file.name,
      });

      await Promise.all([fetchProfiles(), fetchTransfers(), fetchAuditLogs()]);
      alert("Backup restored successfully.");
    } catch (error: any) {
      alert(error?.message || "Failed to restore backup.");
    }

    setBusyAction("");
    event.target.value = "";
  };

  const printReport = () => {
    const companyRows = userSummaries
      .map(
        (summary) => `
          <tr>
            <td>${escapeHtml(getUserDisplayName(summary.userId))}</td>
            <td>${summary.transfers}</td>
            <td>${summary.pallets}</td>
            <td>${summary.damaged}</td>
            <td>${summary.net}</td>
          </tr>
        `
      )
      .join("");

    const transferRows = filteredTransfers
      .map((transfer) => {
        const company = getUserDisplayName(transfer.user_id);
        const email =
          getUserSecondaryText(transfer.user_id) ||
          profileLookup[transfer.user_id]?.email ||
          "";
        const quantity = Number(transfer.quantity || 0);
        const damaged = Number(transfer.damaged || 0);

        return `
          <tr>
            <td>${escapeHtml(transfer.transfer_number || "")}</td>
            <td>${escapeHtml(requestTypeLabel(transfer.request_type))}</td>
            <td>${escapeHtml(company)}</td>
            <td>${escapeHtml(email)}</td>
            <td>${escapeHtml(transfer.destination || "")}</td>
            <td>${quantity}</td>
            <td>${damaged}</td>
            <td>${Math.max(quantity - damaged, 0)}</td>
            <td>${escapeHtml(formatDate(transfer.shipment_date || transfer.transfer_date || transfer.created_at))}</td>
            <td>${escapeHtml(statusLabel(transfer.status))}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <title>Adams Pallet Plus Admin Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #0f172a; }
            h1, h2 { margin-bottom: 8px; }
            p { margin: 4px 0 16px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
            th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; font-size: 13px; }
            th { background: #e2e8f0; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
            .card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px; }
            @media print { .page-break { page-break-before: always; } }
          </style>
        </head>
        <body>
          <h1>Adams Pallet Plus Inc. — Admin Report</h1>
          <p>Generated: ${escapeHtml(new Date().toLocaleString())}</p>

          <div class="stats">
            <div class="card"><strong>Total Transfers:</strong><br/>${totals.totalTransfers}</div>
            <div class="card"><strong>Total Pallets:</strong><br/>${totals.totalPallets}</div>
            <div class="card"><strong>Damaged / Lost:</strong><br/>${totals.damagedLost}</div>
            <div class="card"><strong>Net Delivered:</strong><br/>${totals.netDelivered}</div>
            <div class="card"><strong>Pending Transfers:</strong><br/>${totals.pending}</div>
            <div class="card"><strong>Open Requests:</strong><br/>${pendingRequestCount}</div>
          </div>

          <h2>User Totals</h2>
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Transfers</th>
                <th>Pallets</th>
                <th>Damaged</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              ${companyRows || "<tr><td colspan='5'>No rows</td></tr>"}
            </tbody>
          </table>

          <div class="page-break"></div>

          <h2>Transfer Details</h2>
          <table>
            <thead>
              <tr>
                <th>Transfer #</th>
                <th>Type</th>
                <th>Company</th>
                <th>Email</th>
                <th>Destination</th>
                <th>Qty</th>
                <th>Damaged</th>
                <th>Net</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${transferRows || "<tr><td colspan='10'>No rows</td></tr>"}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank", "width=1200,height=900");
    if (!printWindow) {
      alert("Unable to open print window.");
      return;
    }

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-3xl bg-white px-8 py-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Access denied</h1>
          <p className="mt-3 text-slate-500">This page is for admins only.</p>
          <div className="mt-6 flex justify-center gap-3">
            <a
              href="/dashboard"
              className="rounded-2xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
            >
              Back to Dashboard
            </a>
            <a
              href="/login"
              className="rounded-2xl bg-[#11284a] px-5 py-3 font-semibold text-white hover:bg-[#0c1d36]"
            >
              Login
            </a>
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
                Admin Dashboard
              </h1>
              <p className="mt-2 text-slate-500">
                System-wide view of users, transfers, requests, reports, audit logs, and recovery tools.
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Signed in as: {authEmail}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/dashboard"
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                User Dashboard
              </a>

              <button
                type="button"
                onClick={printReport}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Printable Report
              </button>

              <button
                type="button"
                onClick={exportCsv}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Export CSV
              </button>

              <button
                type="button"
                onClick={downloadBackup}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                Download Backup
              </button>

              <button
                type="button"
                onClick={() => restoreInputRef.current?.click()}
                disabled={busyAction === "restore"}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
              >
                {busyAction === "restore" ? "Restoring..." : "Restore Backup"}
              </button>

              <button
                type="button"
                onClick={signOut}
                className="rounded-2xl bg-[#11284a] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0c1d36]"
              >
                Logout
              </button>

              <input
                ref={restoreInputRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleRestoreBackup}
              />
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

          <div className="rounded-3xl border-2 border-[#11284a] bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Open Requests</p>
            <p className="mt-3 text-4xl font-bold text-[#11284a]">{pendingRequestCount}</p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Filters</h2>
            <p className="mt-2 text-slate-500">Narrow the admin view.</p>

            <div className="mt-6 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Company / User
                </label>
                <select
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                >
                  <option value="all">All Companies</option>
                  {profiles.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {(profile.company_name?.trim() || profile.email) +
                        (profile.company_name?.trim() ? ` — ${profile.email}` : "")}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-700">Status</p>
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
                <p className="mb-2 text-sm font-medium text-slate-700">Date Range</p>
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
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">User Totals</h2>
            <p className="mt-2 text-slate-500">Summary by user across transfer activity.</p>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                    <th className="pb-3 pr-4 font-medium">User</th>
                    <th className="pb-3 pr-4 font-medium">Transfers</th>
                    <th className="pb-3 pr-4 font-medium">Pallets</th>
                    <th className="pb-3 pr-4 font-medium">Damaged</th>
                    <th className="pb-3 pr-4 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {userSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-sm text-slate-500">
                        No user totals found for the current filters.
                      </td>
                    </tr>
                  ) : (
                    userSummaries.map((summary) => (
                      <tr key={summary.userId} className="border-b border-slate-100 text-sm">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-slate-900">
                            {getUserDisplayName(summary.userId)}
                          </div>
                          {getUserSecondaryText(summary.userId) ? (
                            <div className="text-xs text-slate-500">
                              {getUserSecondaryText(summary.userId)}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{summary.transfers}</td>
                        <td className="py-3 pr-4 text-slate-700">{summary.pallets}</td>
                        <td className="py-3 pr-4 text-red-600">{summary.damaged}</td>
                        <td className="py-3 pr-4 text-green-600">{summary.net}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Transfers & Requests</h2>
          <p className="mt-2 text-slate-500">
            Review transfer numbers, shipment activity, and user requests.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Transfer #</th>
                  <th className="pb-3 pr-4 font-medium">Type</th>
                  <th className="pb-3 pr-4 font-medium">Company</th>
                  <th className="pb-3 pr-4 font-medium">Destination / Notes</th>
                  <th className="pb-3 pr-4 font-medium">Qty</th>
                  <th className="pb-3 pr-4 font-medium">Damaged</th>
                  <th className="pb-3 pr-4 font-medium">Date</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransfers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-6 text-sm text-slate-500">
                      No transfers found for the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredTransfers.map((transfer) => {
                    const isEditing = editingTransfer?.id === transfer.id;

                    return (
                      <tr key={transfer.id} className="border-b border-slate-100 align-top text-sm">
                        <td className="py-4 pr-4">
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                            {transfer.transfer_number || "Pending"}
                          </span>
                        </td>

                        <td className="py-4 pr-4">
                          {isEditing ? (
                            <select
                              value={editingTransfer.request_type}
                              onChange={(e) =>
                                setEditingTransfer({
                                  ...editingTransfer,
                                  request_type: e.target.value,
                                })
                              }
                              className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                            >
                              <option value="transfer">Transfer</option>
                              <option value="pickup_request">Pickup Request</option>
                              <option value="shipment_request">Shipment Request</option>
                            </select>
                          ) : (
                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                              {requestTypeLabel(transfer.request_type)}
                            </span>
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          <div className="font-medium text-slate-900">
                            {getUserDisplayName(transfer.user_id)}
                          </div>
                          {getUserSecondaryText(transfer.user_id) ? (
                            <div className="text-xs text-slate-500">
                              {getUserSecondaryText(transfer.user_id)}
                            </div>
                          ) : null}
                        </td>

                        <td className="py-4 pr-4">
                          {isEditing ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingTransfer.destination}
                                onChange={(e) =>
                                  setEditingTransfer({
                                    ...editingTransfer,
                                    destination: e.target.value,
                                  })
                                }
                                className="w-56 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                              />
                              <input
                                type="text"
                                value={editingTransfer.notes}
                                onChange={(e) =>
                                  setEditingTransfer({
                                    ...editingTransfer,
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="Notes"
                                className="w-56 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                              />
                            </div>
                          ) : (
                            <>
                              <div className="text-slate-900">
                                {transfer.destination || "—"}
                              </div>
                              {transfer.notes ? (
                                <div className="mt-1 text-xs text-slate-500">
                                  {transfer.notes}
                                </div>
                              ) : null}
                            </>
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editingTransfer.quantity}
                              onChange={(e) =>
                                setEditingTransfer({
                                  ...editingTransfer,
                                  quantity: e.target.value,
                                })
                              }
                              className="w-24 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                            />
                          ) : (
                            <span className="text-slate-700">
                              {Number(transfer.quantity || 0)}
                            </span>
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editingTransfer.damaged}
                              onChange={(e) =>
                                setEditingTransfer({
                                  ...editingTransfer,
                                  damaged: e.target.value,
                                })
                              }
                              className="w-24 rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                            />
                          ) : (
                            <span className="text-red-600">
                              {Number(transfer.damaged || 0)}
                            </span>
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          {isEditing ? (
                            <input
                              type="date"
                              value={editingTransfer.shipment_date}
                              onChange={(e) =>
                                setEditingTransfer({
                                  ...editingTransfer,
                                  shipment_date: e.target.value,
                                })
                              }
                              className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                            />
                          ) : (
                            <span className="text-slate-700">
                              {formatDate(transfer.shipment_date || transfer.transfer_date || transfer.created_at)}
                            </span>
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          {isEditing ? (
                            <select
                              value={editingTransfer.status}
                              onChange={(e) =>
                                setEditingTransfer({
                                  ...editingTransfer,
                                  status: e.target.value,
                                })
                              }
                              className="rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                            >
                              <option value="pending_review">Pending Review</option>
                              <option value="completed">Completed</option>
                            </select>
                          ) : (
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                transfer.status === "completed"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {statusLabel(transfer.status)}
                            </span>
                          )}
                        </td>

                        <td className="py-4 pr-4">
                          <div className="flex flex-wrap gap-2">
                            {isEditing ? (
                              <>
                                <button
                                  type="button"
                                  onClick={saveTransferEdits}
                                  disabled={busyAction === `save-${transfer.id}`}
                                  className="rounded-xl bg-[#11284a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0c1d36] disabled:opacity-60"
                                >
                                  {busyAction === `save-${transfer.id}` ? "Saving..." : "Save"}
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditTransfer}
                                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => startEditTransfer(transfer)}
                                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                >
                                  Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() => toggleTransferStatus(transfer)}
                                  disabled={busyAction === `toggle-${transfer.id}`}
                                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-60"
                                >
                                  {busyAction === `toggle-${transfer.id}`
                                    ? "Updating..."
                                    : transfer.status === "pending_review"
                                    ? "Mark Complete"
                                    : "Mark Pending"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteTransfer(transfer)}
                                  disabled={busyAction === `delete-${transfer.id}`}
                                  className="rounded-xl border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                                >
                                  {busyAction === `delete-${transfer.id}` ? "Deleting..." : "Delete"}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">User Management</h2>
            <p className="mt-2 text-slate-500">
              Edit company names, change roles, and remove or restore access.
            </p>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-sm text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Company / Email</th>
                    <th className="pb-3 pr-4 font-medium">Access</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 pr-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile) => {
                    const accessActive = profile.is_active !== false;

                    return (
                      <tr key={profile.id} className="border-b border-slate-100 text-sm">
                        <td className="py-3 pr-4">
                          <div className="font-medium text-slate-900">
                            {profile.company_name?.trim() || "No company name"}
                          </div>
                          <div className="text-xs text-slate-500">{profile.email}</div>
                        </td>

                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              accessActive
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {accessActive ? "Active" : "Removed"}
                          </span>
                        </td>

                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              profile.role === "admin"
                                ? "bg-purple-100 text-purple-700"
                                : "bg-slate-100 text-slate-700"
                            }`}
                          >
                            {profile.role}
                          </span>
                        </td>

                        <td className="py-3 pr-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => startEditUser(profile)}
                              className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Edit User
                            </button>

                            <button
                              type="button"
                              onClick={() => toggleUserAccess(profile)}
                              disabled={busyAction === `access-${profile.id}`}
                              className={`rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-60 ${
                                accessActive
                                  ? "border border-red-200 text-red-700 hover:bg-red-50"
                                  : "border border-green-200 text-green-700 hover:bg-green-50"
                              }`}
                            >
                              {busyAction === `access-${profile.id}`
                                ? "Updating..."
                                : accessActive
                                ? "Remove Access"
                                : "Restore Access"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {profiles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-sm text-slate-500">
                        No profiles found.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">Audit Log</h2>
            <p className="mt-2 text-slate-500">Latest administrative activity.</p>

            <div className="mt-6 space-y-3">
              {auditLogs.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No audit log entries found.
                </div>
              ) : (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {log.action || "activity"} • {log.entity_type || "entity"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDateTime(log.created_at)}
                        </p>
                        <p className="mt-2 text-xs text-slate-600">
                          Entity ID: {log.entity_id || "—"}
                        </p>
                      </div>
                    </div>

                    {log.details ? (
                      <pre className="mt-3 overflow-x-auto rounded-xl bg-white p-3 text-xs text-slate-700">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {editingUser ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900">Edit User</h3>
            <p className="mt-2 text-sm text-slate-500">
              Update company name, role, and access status.
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Company Name
                </label>
                <input
                  type="text"
                  value={editingUser.company_name}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      company_name: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Access
                </label>
                <select
                  value={editingUser.is_active ? "active" : "removed"}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      is_active: e.target.value === "active",
                    })
                  }
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                >
                  <option value="active">Active</option>
                  <option value="removed">Removed</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={cancelEditUser}
                className="rounded-2xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={saveUserEdits}
                disabled={busyAction === `user-save-${editingUser.id}`}
                className="rounded-2xl bg-[#11284a] px-4 py-3 font-semibold text-white hover:bg-[#0c1d36] disabled:opacity-60"
              >
                {busyAction === `user-save-${editingUser.id}` ? "Saving..." : "Save User"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}