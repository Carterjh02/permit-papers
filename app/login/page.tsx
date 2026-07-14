"use client";

import { useState, SyntheticEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PublicNav from "../(public)/PublicNav";
import "../globals.css";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");

  async function handleLogin(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    const username = formData.get("username") as string;
    const password = formData.get("password") as string;
    const company = formData.get("company") as string;

    const result = await signIn("credentials", {
      redirect: false,
      username,
      password,
      company,
      callbackUrl: "/dashboard",
    });

    if (result?.error) {
      setError(result.error);
      return;
    }

    // Allow cookie to commit
    await new Promise((resolve) => setTimeout(resolve, 250));

    const session = await fetch("/api/auth/session").then((res) => res.json());

    if (!session?.user) {
      setError("Unexpected error. Please try again.");
      return;
    }

    if (session.user.role === "master") {
      router.push("/master");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="login-shell">
      <PublicNav />

      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Login</h1>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="login-error">{error}</div>}

            <label>
              Username
              <input name="username" className="login-input" required />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                className="login-input"
                required
              />
            </label>

            <label>
              Company Code
              <input name="company" className="login-input" />
            </label>

            <button type="submit" className="btn-primary w-full">
              Login
            </button>
          </form>

          <div className="login-footer">
            <p>Don’t have an account?</p>
            <Link href="/signup" className="btn-secondary w-full">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
