import { StatCard } from "@/components/stat-card";
import { summaryStats } from "@/lib/data";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryStats.map((item) => (
          <StatCard key={item.label} label={item.label} value={item.value} subtext={item.subtext} />
        ))}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Launch review</h2>
        <p className="mt-2 text-sm text-slate-500">This starter dashboard is ready for Supabase auth and real data wiring next.</p>
      </section>
    </div>
  );
}
