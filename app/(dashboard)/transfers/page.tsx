import { transfers } from "@/lib/data";
import { StatusBadge } from "@/components/status-badge";

export default function TransfersPage() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight">Transfers</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">From</th>
              <th className="pb-3 pr-4">To</th>
              <th className="pb-3 pr-4">Asset Type</th>
              <th className="pb-3 pr-4">Qty</th>
              <th className="pb-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-3 pr-4">{row.date}</td>
                <td className="py-3 pr-4">{row.from}</td>
                <td className="py-3 pr-4">{row.to}</td>
                <td className="py-3 pr-4">{row.assetType}</td>
                <td className="py-3 pr-4">{row.qty}</td>
                <td className="py-3 pr-4"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
