export function StatCard({ label, value, subtext }: { label: string; value: string; subtext: string }) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-2 text-3xl font-bold tracking-tight">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{subtext}</div>
    </div>
  );
}
