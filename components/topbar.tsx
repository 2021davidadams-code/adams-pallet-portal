export function Topbar() {
  return (
    <div className="rounded-3xl bg-white px-5 py-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">Production Preview</div>
          <div className="text-sm text-slate-500">Review the portal before connecting real data.</div>
        </div>
        <div className="text-sm text-slate-500">519-919-9857</div>
      </div>
    </div>
  );
}
