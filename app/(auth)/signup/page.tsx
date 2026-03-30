"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSignup = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Account created! You can now log in.");
      router.push("/login");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold tracking-tight">Sign Up</h1>

        <p className="mt-2 text-sm text-slate-500">
          Create your Adams Pallet Plus account.
        </p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <input
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full rounded-2xl border border-slate-300 px-4 py-3"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-semibold text-white"
            type="submit"
          >
            Create Account
          </button>
        </form>
      </div>
    </div>
  );
}