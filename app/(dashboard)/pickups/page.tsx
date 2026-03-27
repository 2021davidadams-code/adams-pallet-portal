import { pickups } from "@/lib/data";
import { StatusBadge } from "@/components/status-badge";

export default function PickupsPage() {
  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold tracking-tight">Pickups</h1>
      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="pb-3 pr-4">Company</th>
              <th className="pb-3 pr-4">Service</th>
              <th className="pb-3 pr-4">Location</th>
              <th className="pb-3 pr-4">Qty</th>
              <th className="pb-3 pr-4">Date</th>
              <th className="pb-3 pr-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {pickups.map((row) => (
              <tr key={row.id} className="border-b border-slate-100">
                <td className="py-3 pr-4">{row.company}</td>
                <td className="py-3 pr-4">{row.service}</td>
                <td className="py-3 pr-4">{row.location}</td>
                <td className="py-3 pr-4">{row.qty}</td>
                <td className="py-3 pr-4">{row.date}</td>
                <td className="py-3 pr-4"><StatusBadge status={row.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
