"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PublicNav from "../(public)/PublicNav";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [showCookiePopup, setShowCookiePopup] = useState<boolean>(false);

  // Detect redirect loop safely (ESLint-compliant)
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      window.location.search.includes("callbackUrl")
    ) {
      Promise.resolve().then(() => setShowCookiePopup(true));
    }
  }, []);

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> {
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

      const lower = result.error.toLowerCase();
      if (
        lower.includes("session") ||
        lower.includes("cookie") ||
        lower.includes("callback")
      ) {
        setShowCookiePopup(true);
      }

      return;
    }

    // Allow cookie to commit
    await new Promise((resolve) => setTimeout(resolve, 250));

    const session = await fetch("/api/auth/session").then((res) => res.json());
    console.log("Session after login:", session);

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
      {/* Browser-only debug logger */}
      {typeof window !== "undefined" && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.group("🔵 LOGIN DEBUG");
              console.log("🌐 URL:", window.location.href);
              console.log("🍪 Cookies:", document.cookie);
              console.log("🔧 Cookie Enabled:", navigator.cookieEnabled);
              console.log("📦 LocalStorage Keys:", Object.keys(localStorage));
              console.groupEnd();
            `,
          }}
        />
      )}
  
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
  
      {showCookiePopup && (
        <div className="popup-overlay">
          <div className="popup-card">
            <h2 className="popup-title">Login Issue Detected</h2>
  
            <p className="popup-text">
              Your browser is blocking secure cookies, which prevents Permit
              Papers from keeping you logged in.
            </p>
  
            <p className="popup-text">
              You can fix this by allowing cookies, disabling strict tracking
              prevention, or trying another browser.
            </p>
  
            <div className="popup-buttons">
              <Link href="/forums#login-cookies" className="btn-primary">
                Learn More
              </Link>
  
              <Link href="/fix-login" className="btn-secondary">
                Fix My Login
              </Link>
  
              <button
                className="btn-secondary"
                onClick={() => setShowCookiePopup(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}  