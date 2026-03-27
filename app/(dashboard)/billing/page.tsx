import { invoices } from "@/lib/data";
import { StatusBadge } from "@/components/status-badge";

export default function BillingPage() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {invoices.map((invoice) => (
        <div key={invoice.id} className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm text-slate-500">{invoice.id}</div>
              <div className="mt-1 text-xl font-semibold">{invoice.company}</div>
            </div>
            <StatusBadge status={invoice.status} />
          </div>
          <div className="mt-3 text-sm text-slate-500">{invoice.reason}</div>
          <div className="mt-4 text-3xl font-bold tracking-tight">{invoice.amount}</div>
        </div>
      ))}
    </div>
  );
}
