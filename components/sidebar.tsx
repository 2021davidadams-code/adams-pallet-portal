import Link from "next/link";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/transfers", label: "Transfers" },
  { href: "/pickups", label: "Pickups" },
  { href: "/incidents", label: "Incidents" },
  { href: "/billing", label: "Billing" }
];

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className="rounded-3xl bg-white p-4 shadow-sm">
        <div className="mb-6 text-xl font-bold">Adams Pallet Plus</div>
        <div className="space-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="block rounded-2xl bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}
