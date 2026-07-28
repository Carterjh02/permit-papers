"use client";

import { useState, useEffect, SyntheticEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PublicNav from "../(public)/PublicNav";
import { useToast } from "../components/ToastProvider";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Load remembered values on first render
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe");
    if (remembered === "true") {
      const savedUsername = localStorage.getItem("username");
      const savedCompany = localStorage.getItem("company");

      if (savedUsername) {
        const usernameInput = document.querySelector(
          'input[name="username"]'
        ) as HTMLInputElement;
        if (usernameInput) usernameInput.value = savedUsername;
      }

      if (savedCompany) {
        const companyInput = document.querySelector(
          'input[name="company"]'
        ) as HTMLInputElement;
        if (companyInput) companyInput.value = savedCompany;
      }

      Promise.resolve().then(() => setRememberMe(true));
    }
  }, []);

  async function handleLogin(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

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

    setLoading(false);

    if (result?.error) {
      setError(result.error);
      showToast(result.error);
      return;
    }

    // Allow cookie to commit
    await new Promise((resolve) => setTimeout(resolve, 250));
    const session = await fetch("/api/auth/session").then((res) => res.json());

    if (!session?.user) {
      const msg = "Unexpected error. Please try again.";
      setError(msg);
      showToast(msg);
      return;
    }

    // Save remembered values
    if (rememberMe) {
      localStorage.setItem("rememberMe", "true");
      localStorage.setItem("username", username);
      localStorage.setItem("company", company);
    } else {
      localStorage.removeItem("rememberMe");
      localStorage.removeItem("username");
      localStorage.removeItem("company");
    }

    if (session.user.role === "master") router.push("/master");
    else router.push("/dashboard");
  }

  return (
    <>
      <PublicNav />

      <div className="login-shell">
        <div className="login-container">
          <div className="login-card">
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">
              Sign in to manage your permits and jobs securely.
            </p>

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

              <div className="login-options">
                <label className="remember-me">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  Remember me
                </label>

                <Link href="/forgot-password" className="forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            <div className="login-footer">
              <p>Don’t have an account?</p>
              <Link href="/signup" className="btn-secondary w-full">
                Sign Up
              </Link>
            </div>

            <p className="login-security">
              🔒 Your credentials are securely encrypted.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
