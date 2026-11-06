"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import PublicNav from "../(public)/PublicNav";
import PublicFooter from "../(public)/PublicFooter";

import { useToast } from "../components/ToastProvider";

// ============================================================
// ICONS
// ============================================================

function EyeIcon({ visible }: { visible: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />

      {!visible && (
        <path d="M3 3l18 18" />
      )}
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

// ============================================================
// LOGIN PAGE
// ============================================================

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const usernameRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const rememberRef = useRef<HTMLInputElement>(null);

  // ==========================================================
  // RESTORE REMEMBERED LOGIN DETAILS
  //
  // Only username and company code are remembered.
  // Passwords are never saved to localStorage.
  // ==========================================================

  useEffect(() => {
    try {
      const remembered =
        localStorage.getItem("rememberMe") === "true";

      if (!remembered) return;

      const username = localStorage.getItem("username");
      const company = localStorage.getItem("company");

      if (usernameRef.current && username) {
        usernameRef.current.value = username;
      }

      if (companyRef.current && company) {
        companyRef.current.value = company;
      }

      if (rememberRef.current) {
        rememberRef.current.checked = true;
      }
    } catch {
      // Login remains available if local storage is disabled.
    }
  }, []);

  // ==========================================================
  // HANDLE LOGIN
  // ==========================================================

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const formData = new FormData(event.currentTarget);

    const username = String(
      formData.get("username") ?? ""
    ).trim();

    const password = String(
      formData.get("password") ?? ""
    );

    const company = String(
      formData.get("company") ?? ""
    ).trim();

    const rememberMe =
      formData.get("rememberMe") === "on";

    // Basic validation.
    // We do not impose new password-length requirements here
    // because existing users may have older credentials.

    if (!username) {
      setError("Please enter your username.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // Existing NextAuth credentials authentication.

      const result = await signIn("credentials", {
        redirect: false,
        username,
        password,
        company,
        callbackUrl: "/dashboard",
      });

      if (!result || result.error) {
        const message =
          "Unable to sign in. Please check your username, password, and company code.";

        setError(message);
        showToast(message);
        return;
      }

      // Allow the authentication cookie to become available.

      await new Promise((resolve) =>
        setTimeout(resolve, 250)
      );

      const response = await fetch(
        "/api/auth/session",
        {
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error("Session verification failed.");
      }

      const session = await response.json();

      if (!session?.user) {
        throw new Error("Session could not be verified.");
      }

      // Remember username and company if requested.

      try {
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("username", username);
          localStorage.setItem("company", company);
        } else {
          localStorage.removeItem("rememberMe");
          localStorage.removeItem("username");
          localStorage.removeItem("company");
        }
      } catch {
        // Authentication does not depend on local storage.
      }

      // Preserve existing role-based navigation.

      if (session.user.role === "master") {
        router.push("/master");
      } else {
        router.push("/dashboard");
      }
    } catch {
      const message =
        "Something went wrong while signing in. Please try again.";

      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // STYLING
  // ==========================================================

  const inputClass = `
    mt-2
    w-full
    rounded-lg
    border
    border-[#d5e2f3]
    bg-[#f8fbff]
    px-4
    py-3
    text-base
    text-[#0a1737]
    outline-none
    transition
    placeholder:text-[#91a0b5]
    focus:border-[#086df2]
    focus:ring-2
    focus:ring-[#086df2]/15
  `;

  const labelClass =
    "block text-sm font-bold text-[#20314c]";

  const benefits = [
    "Access and manage your permit jobs.",
    "Prepare permit documents faster.",
    "Keep customer and company information organized.",
    "Built specifically for contractors.",
  ];

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f9ff] text-[#0a1737]">

      {/* SHARED FIXED NAVIGATION */}

      <header className="fixed inset-x-0 top-0 z-[100]">
        <PublicNav />
      </header>

      <div
        className="h-[4.75rem] shrink-0"
        aria-hidden="true"
      />

      {/* ======================================================
          MAIN LOGIN SECTION
         ====================================================== */}

      <main className="relative flex flex-1 items-center overflow-hidden bg-gradient-to-br from-[#f8fbff] via-[#eaf4ff] to-[#d9eaff] py-[clamp(3rem,6vw,6rem)]">

        {/* DECORATIVE BACKGROUND */}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[15vw] top-0 h-[35vw] w-[35vw] rounded-full bg-[#c8e4ff]/40 blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-[10vw] bottom-0 h-[30vw] w-[30vw] rounded-full bg-[#a9d4ff]/30 blur-3xl"
        />

        <div className="relative mx-auto grid w-[94vw] max-w-[84rem] grid-cols-1 items-center gap-[clamp(2rem,5vw,5rem)] lg:grid-cols-2">

          {/* ==================================================
              LEFT SIDE: BRANDING
             ================================================== */}

          <section className="max-w-[37rem]">

            <span className="inline-flex rounded-full bg-[#dcecff] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[#086df2]">
              Welcome Back
            </span>

            <h1 className="mt-6 text-[clamp(2.5rem,4.2vw,4.5rem)] font-extrabold leading-[1.08] tracking-tight">

              Your Permitting
              <span className="block text-[#086df2]">
                Workspace.
              </span>

            </h1>

            <p className="mt-5 max-w-[34rem] text-base leading-relaxed text-[#40516b] sm:text-lg">
              Sign in to access your PermitPapers dashboard,
              manage your jobs, and prepare permit documents
              from one convenient place.
            </p>

            {/* BENEFITS */}

            <div className="mt-9 space-y-4">

              {benefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-center gap-4"
                >

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dcf5e9] text-[#149d55]">
                    <CheckIcon />
                  </span>

                  <p className="text-sm font-semibold text-[#1e304b] sm:text-base">
                    {benefit}
                  </p>

                </div>
              ))}

            </div>

            {/* SUPPORT LINK */}

            <p className="mt-9 text-sm text-[#52627b]">
              Having trouble accessing your account?{" "}
              <Link
                href="/contact"
                className="font-bold text-[#086df2] hover:underline"
              >
                Contact Support
              </Link>
            </p>

          </section>

          {/* ==================================================
              RIGHT SIDE: LOGIN CARD
             ================================================== */}

          <section className="w-full rounded-2xl border border-[#dce8f7] bg-white p-[clamp(1.5rem,3vw,2.75rem)] shadow-[0_15px_45px_rgba(12,45,85,0.10)]">

            {/* CARD HEADING */}

            <div className="mb-8 text-center">

              <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                Login to Your Account
              </h2>

              <p className="mt-2 text-sm text-[#60718a]">
                Enter your credentials to continue.
              </p>

            </div>

            {/* LOGIN FORM */}

            <form
              onSubmit={handleLogin}
              className="space-y-5"
              aria-busy={loading}
            >

              {/* ERROR MESSAGE */}

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#b91c1c]"
                >
                  {error}
                </div>
              )}

              {/* USERNAME */}

              <label className={labelClass}>
                Username *

                <input
                  ref={usernameRef}
                  name="username"
                  type="text"
                  required
                  autoComplete="username"
                  maxLength={120}
                  placeholder="Enter your username"
                  className={inputClass}
                />
              </label>

              {/* PASSWORD */}

              <label className={labelClass}>
                Password *

                <span className="relative block">

                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className={`${inputClass} pr-14`}
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword((current) => !current)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-pressed={showPassword}
                    title={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    className="absolute right-3 top-[calc(50%+0.25rem)] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#60718a] transition hover:bg-[#eaf3ff] hover:text-[#086df2]"
                  >
                    <EyeIcon visible={showPassword} />
                  </button>

                </span>
              </label>

              {/* COMPANY CODE */}

              <label className={labelClass}>
                Company Code

                <input
                  ref={companyRef}
                  name="company"
                  type="text"
                  maxLength={120}
                  placeholder="Enter your company code"
                  className={inputClass}
                />

                <span className="mt-1 block text-xs font-normal text-[#73829a]">
                  Enter your company code if your account requires one.
                </span>
              </label>

              {/* REMEMBER ME / FORGOT PASSWORD */}

              <div className="flex flex-wrap items-center justify-between gap-3">

                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#40516b]">

                  <input
                    ref={rememberRef}
                    name="rememberMe"
                    type="checkbox"
                    className="h-4 w-4 accent-[#086df2]"
                  />

                  Remember Me
                </label>

                <Link
                  href="/forgot-password"
                  className="text-sm font-bold text-[#086df2] hover:underline"
                >
                  Forgot Password?
                </Link>

              </div>

              {/* LOGIN BUTTON */}

              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center rounded-lg bg-[#086df2] px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0058cb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Signing In..." : "Login"}
              </button>

            </form>

            {/* SIGNUP LINK */}

            <div className="mt-7 border-t border-[#e1eaf5] pt-6 text-center">

              <p className="text-sm text-[#52627b]">
                Don&apos;t have an account?
              </p>

              <Link
                href="/signup"
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border-2 border-[#086df2] bg-white px-5 py-3 text-sm font-bold text-[#086df2] transition hover:bg-[#edf5ff]"
              >
                Create an Account
              </Link>

            </div>

          </section>

        </div>

      </main>

      {/* SHARED FOOTER */}

      <PublicFooter />

    </div>
  );
}