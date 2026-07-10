"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PublicNav from "../(public)/PublicNav";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const companyName = formData.get("companyName") as string;
    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    // -------------------------------
    // PAYMENT PLACEHOLDER (Stripe later)
    // -------------------------------
    const cardNumber = formData.get("cardNumber") as string;
    const exp = formData.get("exp") as string;
    const cvc = formData.get("cvc") as string;

    if (!cardNumber || !exp || !cvc) {
      setError("Please enter payment information.");
      setLoading(false);
      return;
    }

    // TEMPORARY MOCK — replace with Stripe Checkout later
    const paymentSuccess = true;

    if (!paymentSuccess) {
      setError("Payment failed. Please try again.");
      setLoading(false);
      return;
    }

    // -------------------------------
    // CREATE COMPANY + USER
    // -------------------------------
    const res = await fetch("/api/signup", {
      method: "POST",
      body: JSON.stringify({
        companyName,
        username,
        email,
        password,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="login-shell">
      <PublicNav />

      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Sign Up</h1>

          <form onSubmit={handleSignup} className="login-form">
            {error && <div className="login-error">{error}</div>}

            <label>
              Company Name
              <input name="companyName" className="login-input" required />
            </label>

            <label>
              Username
              <input name="username" className="login-input" required />
            </label>

            <label>
              Email
              <input name="email" type="email" className="login-input" required />
            </label>

            <label>
              Password
              <input name="password" type="password" className="login-input" required />
            </label>

            <label>
              Confirm Password
              <input name="confirmPassword" type="password" className="login-input" required />
            </label>

            <hr className="my-4" />

            <h2 className="text-lg font-semibold mb-2">Payment Information</h2>

            <label>
              Card Number
              <input name="cardNumber" className="login-input" placeholder="1234 5678 9012 3456" required />
            </label>

            <label>
              Expiration (MM/YY)
              <input name="exp" className="login-input" placeholder="08/27" required />
            </label>

            <label>
              CVC
              <input name="cvc" className="login-input" placeholder="123" required />
            </label>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="login-footer">
            <p>Already have an account?</p>
            <a href="/login" className="btn-secondary w-full">
              Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
