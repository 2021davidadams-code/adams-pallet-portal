import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const color = {
    Reported: "bg-sky-50 text-sky-700 border-sky-200",
    "Pending Review": "bg-amber-50 text-amber-700 border-amber-200",
    Confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Open: "bg-rose-50 text-rose-700 border-rose-200",
    Investigating: "bg-violet-50 text-violet-700 border-violet-200",
    Draft: "bg-slate-100 text-slate-700 border-slate-200"
  }[status] || "bg-slate-50 text-slate-700 border-slate-200";

  return <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-medium", color)}>{status}</span>;
}
