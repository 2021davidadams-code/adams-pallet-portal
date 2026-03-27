export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Adams Pallet Plus</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to access the pallet tracking portal.</p>
        <form className="mt-6 space-y-4">
          <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Email" />
          <input className="w-full rounded-2xl border border-slate-300 px-4 py-3" placeholder="Password" type="password" />
          <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white">Sign In</button>
        </form>
      </div>
    </div>
  );
}
