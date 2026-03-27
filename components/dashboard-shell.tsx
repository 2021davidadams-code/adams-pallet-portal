import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <Sidebar />
      <main className="min-w-0 flex-1 space-y-6">
        <Topbar />
        {children}
      </main>
    </div>
  );
}
