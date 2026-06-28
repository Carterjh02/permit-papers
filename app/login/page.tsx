"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const company = formData.get("company") as string;

    // Attempt login — FORCE callbackUrl to avoid NextAuth sending user to "/"
    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
      company,
      callbackUrl: "/dashboard", // ← IMPORTANT FIX
    });

    if (result?.error) {
      setError(result.error);
      return;
    }

    // Fetch session to determine role
    const session = await fetch("/api/auth/session").then((res) => res.json());

    if (!session?.user) {
      setError("Unexpected error. Please try again.");
      return;
    }

    // Role-based redirect
    if (session.user.role === "master") {
      router.push("/master");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="page-container max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-center">Login</h1>

      <form onSubmit={handleLogin} className="card p-6 space-y-4">
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded border border-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium">Username</label>
          <input name="username" className="input" required />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input name="password" type="password" className="input" required />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Company Code (leave blank if Master)
          </label>
          <input
            name="company"
            className="input"
            placeholder="Guardian, Locktight, etc."
          />
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Login
        </button>
      </form>
    </div>
  );
}
