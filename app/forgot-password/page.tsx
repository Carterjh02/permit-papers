"use client";

import { useState, SyntheticEvent } from "react";
import Link from "next/link";
import PublicNav from "../(public)/PublicNav";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const res = await fetch("/api/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();
    setMessage(data.message);
  }

  return (
    <>
      <PublicNav />
      <div className="login-shell">
        <div className="login-container">
          <div className="login-card">
            <h1 className="login-title">Reset Your Password</h1>
            <p className="login-subtitle">
              Enter your account email and we’ll send you a reset link.
            </p>

            <form onSubmit={handleSubmit} className="login-form">
              <label>
                Email
                <input
                  type="email"
                  name="email"
                  className="login-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <button type="submit" className="btn-primary w-full">
                Send Reset Link
              </button>
            </form>

            {message && <p className="login-security">{message}</p>}

            <div className="login-footer">
              <Link href="/login" className="btn-secondary w-full">
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
