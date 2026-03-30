"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DashboardPage() {
  const supabase = createClient();

  const [transfers, setTransfers] = useState<any[]>([]);
  const [toName, setToName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [damagedLost, setDamagedLost] = useState("");
  const [shipmentDate, setShipmentDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [userEmail, setUserEmail] = useState("");

  const isAdmin = userEmail === "daverino1@hotmail.com";

  const fetchTransfers = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setUserEmail(user.email || "");

    const { data, error } = await supabase
      .from("transfers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setTransfers(data || []);
    }
  };

  useEffect(() => {
    fetchTransfers();

    const channel = supabase
      .channel("transfers-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transfers" },
        () => {
          fetchTransfers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const addTransfer = async (e: any) => {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("Not logged in");
      return;
    }

    if (!toName.trim()) {
      alert("Please enter a destination name");
      return;
    }

    if (!quantity || Number(quantity) <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    if (!shipmentDate) {
      alert("Please select a shipment date");
      return;
    }

    if (damagedLost && Number(damagedLost) < 0) {
      alert("Damaged/Lost pallets cannot be negative");
      return;
    }

    if (Number(damagedLost || 0) > Number(quantity)) {
      alert("Damaged/Lost pallets cannot be greater than quantity");
      return;
    }

    const { error } = await supabase.from("transfers").insert([
      {
        transfer_number: "T-" + Math.floor(Math.random() * 10000),
        to_name: toName,
        quantity: Number(quantity),
        damaged_lost: damagedLost ? Number(damagedLost) : 0,
        transfer_date: shipmentDate,
        status: "pending_review",
        user_id: user.id,
      },
    ]);

    if (error) {
      alert(error.message);
    } else {
      setToName("");
      setQuantity("");
      setDamagedLost("");
      setShipmentDate("");
      fetchTransfers();
    }
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
    return transfers.filter((t) => {
      const matchesStatus =
        statusFilter === "all" ? true : t.status === statusFilter;

      const matchesDate = isInDateRange(t.transfer_date, dateFilter);

      return matchesStatus && matchesDate;
    });
  }, [transfers, statusFilter, dateFilter]);

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
  const completionPercent =
    totalTransfers > 0 ? Math.round((completedCount / totalTransfers) * 100) : 0;
  const pendingPercent =
    totalTransfers > 0 ? Math.round((pendingCount / totalTransfers) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-8 flex flex-col gap-4 rounded-2xl bg-white px-6 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Adams Pallet Plus
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage pallet transfers, shipment dates, and damaged/lost pallet counts
            </p>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Signed in as: {userEmail || "Loading..."}
            </p>
          </div>

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

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Transfers</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalTransfers}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Total Pallets</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {totalPallets}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Damaged / Lost</p>
            <p className="mt-2 text-2xl font-bold text-red-600">
              {totalDamagedLost}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Net Delivered</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {totalNetDelivered}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Pending</p>
            <p className="mt-2 text-2xl font-bold text-amber-600">
              {pendingCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">Completed</p>
            <p className="mt-2 text-2xl font-bold text-green-600">
              {completedCount}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Completion Rate</p>
              <p className="text-sm text-slate-500">{completionPercent}%</p>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200">
              <div
                className="h-3 rounded-full bg-green-600"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Pending Rate</p>
              <p className="text-sm text-slate-500">{pendingPercent}%</p>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200">
              <div
                className="h-3 rounded-full bg-amber-500"
                style={{ width: `${pendingPercent}%` }}
              />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-700">Loss Percentage</p>
              <p
                className={`text-sm font-semibold ${
                  Number(lossPercentage) > 10
                    ? "text-red-600"
                    : Number(lossPercentage) > 0
                    ? "text-amber-600"
                    : "text-green-600"
                }`}
              >
                {lossPercentage}%
              </p>
            </div>
            <div className="h-3 w-full rounded-full bg-slate-200">
              <div
                className={`h-3 rounded-full ${
                  Number(lossPercentage) > 10
                    ? "bg-red-600"
                    : Number(lossPercentage) > 0
                    ? "bg-amber-500"
                    : "bg-green-600"
                }`}
                style={{ width: `${Math.min(Number(lossPercentage), 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-1">
            <h2 className="text-xl font-semibold text-slate-900">
              Add Transfer
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Create a new pallet transfer
            </p>

            <form onSubmit={addTransfer} className="mt-5 space-y-4">
              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="Destination Name"
                value={toName}
                onChange={(e) => setToName(e.target.value)}
              />

              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                placeholder="Damaged / Lost Pallets"
                type="number"
                value={damagedLost}
                onChange={(e) => setDamagedLost(e.target.value)}
              />

              <input
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
                type="date"
                value={shipmentDate}
                onChange={(e) => setShipmentDate(e.target.value)}
              />

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Add Transfer
              </button>
            </form>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex flex-col gap-5">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Transfers
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  View and manage your pallet movements
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Status Filter
                  </p>
                  <div className="flex gap-2">
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
                    Date Filter
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

            <div className="space-y-4">
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

                  return (
                    <div
                      key={t.id}
                      className={`rounded-2xl border p-5 ${
                        damaged > 0
                          ? "border-red-200 bg-red-50"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <p className="text-lg font-bold text-slate-900">
                            {t.transfer_number}
                          </p>

                          <p className="text-slate-700">
                            <span className="font-semibold">Destination:</span>{" "}
                            {t.to_name}
                          </p>

                          <p className="text-slate-700">
                            <span className="font-semibold">Quantity:</span>{" "}
                            {qty}
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

                        {isAdmin ? (
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                const { error } = await supabase
                                  .from("transfers")
                                  .delete()
                                  .eq("id", t.id);

                                if (error) {
                                  alert(error.message);
                                } else {
                                  fetchTransfers();
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
                                  fetchTransfers();
                                }
                              }}
                              className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
                            >
                              {t.status === "pending_review"
                                ? "Mark Complete"
                                : "Mark Pending"}
                            </button>
                          </div>
                        ) : (
                          <div className="rounded-xl bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">
                            Admin controls only
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
