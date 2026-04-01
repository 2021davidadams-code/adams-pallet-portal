"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL?.toLowerCase() || "";

export default function SignupPage() {
  const supabase = createClient();

  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorText, setErrorText] = useState("");

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorText("");

    const cleanCompany = companyName.trim();
    const cleanEmail = email.trim().toLowerCase();
    const isAdminEmail = cleanEmail === ADMIN_EMAIL && ADMIN_EMAIL !== "";

    if (!cleanCompany) {
      setErrorText("Company name is required.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          company_name: cleanCompany,
        },
      },
    });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: data.user.id,
          email: cleanEmail,
          role: isAdminEmail ? "admin" : "user",
          company_name: cleanCompany,
          is_active: isAdminEmail,
        },
        { onConflict: "id" }
      );

      if (profileError) {
        setErrorText(profileError.message);
        setLoading(false);
        return;
      }
    }

    if (isAdminEmail) {
      setMessage("Admin account created. You can now sign in.");
    } else {
      setMessage(
        "Account created successfully. Your account is waiting for admin approval before dashboard access."
      );
    }

    setCompanyName("");
    setEmail("");
    setPassword("");
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Create Account</h1>
        <p className="mt-2 text-slate-500">
          Register your company for Adams Pallet Plus access.
        </p>

        <form onSubmit={handleSignup} className="mt-6 space-y-4">
          <div>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              required
            />
          </div>

          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              required
            />
          </div>

          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#11284a] px-4 py-3 font-semibold text-white hover:bg-[#0c1d36] disabled:opacity-60"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {message ? (
          <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {message}
          </div>
        ) : null}

        {errorText ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorText}
          </div>
        ) : null}

        <div className="mt-6 text-sm text-slate-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#11284a] hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

