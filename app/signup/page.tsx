"use client";

import {
  useState,
  type FormEvent,
} from "react";

import Link from "next/link";

import PublicNav from "../(public)/PublicNav";
import PublicFooter from "../(public)/PublicFooter";

// ============================================================
// TYPES
// ============================================================

type PlanId = "lite" | "pro" | "enterprise";

// ============================================================
// PLAN CONFIGURATION
// ============================================================

const plans = [
  {
    id: "lite" as PlanId,
    name: "Lite",
    price: 149,
    popular: false,
    description: "For smaller contracting businesses.",
    highlights: [
      "75 jobs per month",
      "5 user logins",
      "Property search and auto-fill",
    ],
  },
  {
    id: "pro" as PlanId,
    name: "Pro",
    price: 225,
    popular: true,
    description: "For growing contracting companies.",
    highlights: [
      "250 jobs per month",
      "10 user logins",
      "Company-specific documents",
      "Drawing tool (coming soon)",
    ],
  },
  {
    id: "enterprise" as PlanId,
    name: "Enterprise",
    price: 349,
    popular: false,
    description: "For high-volume contracting businesses.",
    highlights: [
      "Unlimited jobs and users",
      "Everything in Pro",
      "Dedicated support",
      "40% off additional features",
    ],
  },
];

// ============================================================
// COMPARISON TABLE DATA
// ============================================================

type ComparisonRow = {
  label: string;
  lite: string;
  pro: string;
  enterprise: string;
};

const comparisonRows: ComparisonRow[] = [
  {
    label: "Monthly Jobs",
    lite: "75",
    pro: "250",
    enterprise: "Unlimited",
  },
  {
    label: "User Logins",
    lite: "5",
    pro: "10",
    enterprise: "Unlimited",
  },
  {
    label: "Automated Property Search",
    lite: "Included",
    pro: "Included",
    enterprise: "Included",
  },
  {
    label: "Automatic Document Filling",
    lite: "Included",
    pro: "Included",
    enterprise: "Included",
  },
  {
    label: "Job Management",
    lite: "Included",
    pro: "Included",
    enterprise: "Included",
  },
  {
    label: "Company-Specific Documents",
    lite: "—",
    pro: "Included*",
    enterprise: "Included*",
  },
  {
    label: "Drawing Tool Access",
    lite: "—",
    pro: "Coming Soon",
    enterprise: "Coming Soon",
  },
  {
    label: "Dedicated Support",
    lite: "—",
    pro: "—",
    enterprise: "Included",
  },
  {
    label: "Additional Feature Discounts",
    lite: "—",
    pro: "—",
    enterprise: "40% Off",
  },
];

// ============================================================
// ICONS
// ============================================================

function CheckIcon() {
  return (
    <svg
      width="20"
      height="20"
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

// ============================================================
// COMPARISON CELL
// ============================================================

function ComparisonCell({ value }: { value: string }) {
  if (value === "Included") {
    return (
      <span className="inline-flex items-center justify-center gap-1 font-semibold text-[#159447]">
        <CheckIcon />
        <span className="sr-only">Included</span>
      </span>
    );
  }

  if (value === "—") {
    return (
      <span className="text-[#9aa9bd]" aria-label="Not included">
        —
      </span>
    );
  }

  if (value === "Coming Soon") {
    return (
      <span className="inline-block rounded-full bg-[#e4f0ff] px-2.5 py-1 text-xs font-bold text-[#086df2]">
        Coming Soon
      </span>
    );
  }

  return (
    <span className="font-semibold text-[#23364f]">
      {value}
    </span>
  );
}

// ============================================================
// SIGNUP PAGE
// ============================================================

export default function SignupPage() {
  const [selectedPlan, setSelectedPlan] =
    useState<PlanId>("pro");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  const selectedPlanInfo =
    plans.find((plan) => plan.id === selectedPlan) ??
    plans[1];

  // ==========================================================
  // SELECT PLAN
  // ==========================================================

  function choosePlan(planId: PlanId) {
    setSelectedPlan(planId);

    document.getElementById("signup-form")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  // ==========================================================
  // SIGNUP HANDLER
  //
  // Preserves the existing /api/signup request contract.
  //
  // IMPORTANT:
  // The selected plan is not submitted as a paid subscription
  // because the current backend billing contract is unverified.
  //
  // The server must eventually validate plans, prices,
  // subscriptions, and entitlements independently.
  // ==========================================================

  async function handleSignup(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setError("");

    const formData = new FormData(event.currentTarget);

    const companyName = String(
      formData.get("companyName") ?? ""
    ).trim();

    const username = String(
      formData.get("username") ?? ""
    ).trim();

    const email = String(
      formData.get("email") ?? ""
    ).trim().toLowerCase();

    const password = String(
      formData.get("password") ?? ""
    );

    const confirmPassword = String(
      formData.get("confirmPassword") ?? ""
    );

    // ========================================================
    // CLIENT-SIDE VALIDATION
    // ========================================================

    if (!companyName || !username || !email || !password) {
      setError("Please complete all required fields.");
      return;
    }

    if (companyName.length < 2) {
      setError(
        "Company name must contain at least 2 characters."
      );
      return;
    }

    if (username.length < 3) {
      setError(
        "Username must contain at least 3 characters."
      );
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // ========================================================
    // CREATE ACCOUNT
    // ========================================================

    setLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          companyName,
          username,
          email,
          password,
        }),
      });

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        setError(
          data.error ||
            "Unable to create your account. Please try again."
        );

        return;
      }

      // Account creation succeeded.
      // Do not claim payment or subscription activation.

      setCreated(true);
    } catch {
      setError(
        "A network error occurred. Please try again."
      );
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

  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <div className="flex min-h-screen flex-col bg-white text-[#0a1737]">

      {/* FIXED PUBLIC NAVIGATION */}

      <header className="fixed inset-x-0 top-0 z-[100]">
        <PublicNav />
      </header>

      <div
        className="h-[4.75rem] shrink-0"
        aria-hidden="true"
      />

      <main className="flex-1">

        {/* ====================================================
            INTRODUCTION
           ==================================================== */}

        <section className="relative overflow-hidden bg-gradient-to-br from-[#f8fbff] via-[#eaf4ff] to-[#d9eaff] py-[clamp(3rem,5vw,5rem)]">

          <div className="relative mx-auto w-[94vw] max-w-[96rem] text-center">

            <span className="inline-block rounded-full bg-[#dcecff] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-[#086df2]">
              Built for Contractors
            </span>

            <h1 className="mt-5 text-[clamp(2.5rem,4.2vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight">

              Choose Your

              <span className="text-[#086df2]">
                {" "}PermitPapers Plan
              </span>

            </h1>

            <p className="mx-auto mt-5 max-w-[42rem] text-base leading-relaxed text-[#40516b] sm:text-lg">
              Find the right tools for your business.
              Compare subscription plans, explore available
              features, and create your account.
            </p>

          </div>

        </section>

        {/* ====================================================
            PRICING CARDS
           ==================================================== */}

        <section className="bg-gradient-to-b from-[#edf7ff] to-white py-[clamp(3rem,5vw,5rem)]">

          <div className="mx-auto w-[94vw] max-w-[82rem]">

            <div className="mb-10 text-center">

              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">

                Simple, Transparent{" "}

                <span className="text-[#086df2]">
                  Pricing
                </span>

              </h2>

              <p className="mt-2 text-base text-[#40516b]">
                Choose the plan that fits your business.
              </p>

            </div>

            <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-3">

              {plans.map((plan) => {
                const selected =
                  selectedPlan === plan.id;

                return (
                  <article
                    key={plan.id}
                    className={`relative flex flex-col rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(12,45,85,0.08)] transition ${
                      selected
                        ? "border-2 border-[#086df2]"
                        : "border border-[#d9e6f7]"
                    }`}
                  >

                    {/* POPULAR BADGE */}

                    {plan.popular && (
                      <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#086df2] px-5 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white">
                        Most Popular
                      </span>
                    )}

                    {/* PLAN NAME */}

                    <h3 className="text-xl font-extrabold">
                      {plan.name}
                    </h3>

                    <p className="mt-1 text-sm text-[#60718a]">
                      {plan.description}
                    </p>

                    {/* PRICE */}

                    <div className="mt-5 flex items-baseline gap-2">

                      <strong className="text-[clamp(2rem,3vw,2.8rem)] font-extrabold tracking-tight">
                        ${plan.price}
                      </strong>

                      <span className="text-sm text-[#52627b]">
                        / month
                      </span>

                    </div>

                    {/* FEATURES */}

                    <ul className="mt-6 flex-1 space-y-4">

                      {plan.highlights.map((highlight) => (
                        <li
                          key={highlight}
                          className="flex items-start gap-3 text-sm text-[#2d4059]"
                        >

                          <span className="shrink-0 text-[#159447]">
                            <CheckIcon />
                          </span>

                          {highlight}

                        </li>
                      ))}

                    </ul>

                    {/* SELECT BUTTON */}

                    <button
                      type="button"
                      onClick={() =>
                        choosePlan(plan.id)
                      }
                      aria-pressed={selected}
                      className={`mt-8 inline-flex min-h-12 items-center justify-center rounded-lg px-5 py-3 text-sm font-bold transition ${
                        selected
                          ? "bg-[#086df2] text-white hover:bg-[#0058cb]"
                          : "border-2 border-[#086df2] bg-white text-[#086df2] hover:bg-[#edf5ff]"
                      }`}
                    >
                      {selected
                        ? "Selected Plan"
                        : `Select ${plan.name}`}
                    </button>

                  </article>
                );
              })}

            </div>

            <p className="mt-6 text-center text-xs text-[#60718a]">
              All prices are monthly. Feature availability
              and additional setup fees may apply.
            </p>

          </div>

        </section>

        {/* ====================================================
            FULL COMPARISON TABLE
           ==================================================== */}

        <section
          id="plan-comparison"
          className="scroll-mt-28 bg-[#f5faff] py-[clamp(3rem,5vw,5rem)]"
        >

          <div className="mx-auto w-[94vw] max-w-[82rem]">

            <div className="mb-9 text-center">

              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">

                Compare All{" "}

                <span className="text-[#086df2]">
                  Features
                </span>

              </h2>

              <p className="mt-2 text-base text-[#40516b]">
                See exactly what each subscription includes.
              </p>

            </div>

            {/* TABLE CONTAINER */}

            <div className="overflow-hidden rounded-2xl border border-[#d5e5f8] bg-white shadow-[0_10px_30px_rgba(12,45,85,0.06)]">

              <div className="overflow-x-auto">

                <table className="w-full min-w-[46rem] border-collapse text-sm">

                  <caption className="sr-only">
                    Comparison of Lite, Pro, and Enterprise
                    PermitPapers subscription plans.
                  </caption>

                  {/* TABLE HEADER */}

                  <thead className="bg-[#071d3b] text-white">

                    <tr>

                      <th
                        scope="col"
                        className="w-[34%] px-5 py-5 text-left text-base font-extrabold"
                      >
                        Features
                      </th>

                      {plans.map((plan) => (
                        <th
                          key={plan.id}
                          scope="col"
                          className={`px-4 py-5 text-center ${
                            selectedPlan === plan.id
                              ? "bg-[#086df2]"
                              : ""
                          }`}
                        >

                          <span className="block text-base font-extrabold">
                            {plan.name}
                          </span>

                          <span className="mt-1 block text-sm font-semibold">
                            ${plan.price}/mo
                          </span>

                        </th>
                      ))}

                    </tr>

                  </thead>

                  {/* TABLE BODY */}

                  <tbody>

                    {comparisonRows.map((row, index) => (
                      <tr
                        key={row.label}
                        className={
                          index % 2 === 0
                            ? "bg-white"
                            : "bg-[#f3f8ff]"
                        }
                      >

                        <th
                          scope="row"
                          className="border-b border-[#e1eaf5] px-5 py-4 text-left font-semibold text-[#20314c]"
                        >
                          {row.label}
                        </th>

                        <td className="border-b border-[#e1eaf5] px-4 py-4 text-center">
                          <ComparisonCell value={row.lite} />
                        </td>

                        <td className="border-b border-[#e1eaf5] px-4 py-4 text-center">
                          <ComparisonCell value={row.pro} />
                        </td>

                        <td className="border-b border-[#e1eaf5] px-4 py-4 text-center">
                          <ComparisonCell
                            value={row.enterprise}
                          />
                        </td>

                      </tr>
                    ))}

                  </tbody>

                  {/* TABLE FOOTER */}

                  <tfoot className="bg-white">

                    <tr>

                      <td className="px-5 py-5 font-bold text-[#20314c]">
                        Select Your Plan
                      </td>

                      {plans.map((plan) => (
                        <td
                          key={plan.id}
                          className="px-3 py-5 text-center"
                        >

                          <button
                            type="button"
                            onClick={() =>
                              choosePlan(plan.id)
                            }
                            aria-pressed={
                              selectedPlan === plan.id
                            }
                            className={`min-h-11 w-full rounded-lg px-3 py-2 text-xs font-bold transition ${
                              selectedPlan === plan.id
                                ? "bg-[#086df2] text-white"
                                : "border border-[#086df2] text-[#086df2] hover:bg-[#edf5ff]"
                            }`}
                          >
                            {selectedPlan === plan.id
                              ? "Selected"
                              : "Select Plan"}
                          </button>

                        </td>
                      ))}

                    </tr>

                  </tfoot>

                </table>

              </div>

            </div>

            <p className="mt-4 text-center text-xs leading-relaxed text-[#60718a]">
              * Company-specific documents require an additional
              one-time setup fee. Drawing Tool access is
              coming soon.
            </p>

          </div>

        </section>

        {/* ====================================================
            ADDITIONAL FEATURES
           ==================================================== */}

        <section className="bg-white py-[clamp(3rem,5vw,5rem)]">

          <div className="mx-auto w-[94vw] max-w-[82rem]">

            <h2 className="text-center text-3xl font-extrabold sm:text-4xl">
              Additional{" "}
              <span className="text-[#086df2]">
                Features
              </span>
            </h2>

            <div className="mt-9 grid grid-cols-1 gap-6 md:grid-cols-2">

              {/* COMPANY DOCUMENT SETUP */}

              <article className="rounded-2xl border border-[#dce8f7] bg-gradient-to-br from-[#f7fbff] to-[#eaf4ff] p-6">

                <h3 className="text-lg font-extrabold">
                  Company Document Setup
                </h3>

                <p className="mt-2 text-2xl font-extrabold text-[#086df2]">
                  $49.99
                  <span className="ml-2 text-sm font-medium text-[#52627b]">
                    One-Time Fee
                  </span>
                </p>

                <p className="mt-4 text-sm leading-relaxed text-[#40516b]">
                  Have your company-specific documents
                  configured to work with PermitPapers.
                  Available for eligible plans.
                </p>

              </article>

              {/* DRAWING TOOL */}

              <article className="rounded-2xl border border-[#dce8f7] bg-gradient-to-br from-[#f7fbff] to-[#eaf4ff] p-6">

                <div className="flex flex-wrap items-center gap-3">

                  <h3 className="text-lg font-extrabold">
                    Drawing Tool
                  </h3>

                  <span className="rounded-full bg-[#dcecff] px-3 py-1 text-xs font-bold text-[#086df2]">
                    Coming Soon
                  </span>

                </div>

                <p className="mt-2 text-2xl font-extrabold text-[#086df2]">
                  $49.99
                  <span className="ml-2 text-sm font-medium text-[#52627b]">
                    / month
                  </span>
                </p>

                <p className="mt-4 text-sm leading-relaxed text-[#40516b]">
                  Create simple drawings and floor plans
                  directly within PermitPapers when this
                  feature becomes available.
                </p>

              </article>

            </div>

          </div>

        </section>

        {/* ====================================================
            ACCOUNT CREATION FORM
           ==================================================== */}

        <section
          id="signup-form"
          className="scroll-mt-28 bg-gradient-to-br from-[#eaf4ff] to-[#dcecff] py-[clamp(3rem,5vw,5rem)]"
        >

          <div className="mx-auto w-[94vw] max-w-[44rem]">

            {/* SECTION HEADING */}

            <div className="mb-8 text-center">

              <h2 className="text-3xl font-extrabold sm:text-4xl">
                Create Your Account
              </h2>

              <p className="mt-2 text-base text-[#40516b]">
                Get started with PermitPapers.
              </p>

            </div>

            {/* FORM CARD */}

            <div className="rounded-2xl border border-[#dce8f7] bg-white p-[clamp(1.5rem,3vw,2.75rem)] shadow-[0_15px_45px_rgba(12,45,85,0.10)]">

              {/* SELECTED PLAN SUMMARY */}

              <div className="mb-7 rounded-xl border border-[#c9e2ff] bg-[#edf6ff] p-5">

                <p className="text-xs font-extrabold uppercase tracking-wide text-[#60718a]">
                  Your Selected Plan
                </p>

                <div className="mt-2 flex flex-wrap items-center justify-between gap-3">

                  <h3 className="text-xl font-extrabold text-[#0a1737]">
                    {selectedPlanInfo.name}
                  </h3>

                  <p className="text-lg font-extrabold text-[#086df2]">
                    ${selectedPlanInfo.price}
                    <span className="ml-1 text-sm font-medium text-[#52627b]">
                      / month
                    </span>
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("plan-comparison")
                      ?.scrollIntoView({
                        behavior: "smooth",
                      })
                  }
                  className="mt-3 text-sm font-bold text-[#086df2] hover:underline"
                >
                  Compare or Change Plan
                </button>

              </div>

              {/* ACCOUNT CREATION NOTICE */}

              <p className="mb-6 rounded-lg border border-[#d6e6f8] bg-[#f8fbff] p-3 text-xs leading-relaxed text-[#52627b]">
                Plan selection is for comparison at this stage.
                Billing is not connected, so creating an account
                will not charge you or activate a paid subscription.
              </p>

              {created ? (

                /* ============================================
                    ACCOUNT CREATED
                   ============================================ */

                <div
                  role="status"
                  className="py-6 text-center"
                >

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#dcf5e9] text-[#159447]">
                    <CheckIcon />
                  </div>

                  <h3 className="mt-5 text-2xl font-extrabold">
                    Account Created!
                  </h3>

                  <p className="mt-3 text-sm leading-relaxed text-[#52627b]">
                    Your account has been created successfully.
                    You can now sign in using your new credentials.
                  </p>

                  <p className="mt-3 text-xs leading-relaxed text-[#60718a]">
                    No payment has been processed and your
                    selected subscription has not been activated.
                  </p>

                  <Link
                    href="/login"
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#086df2] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0058cb]"
                  >
                    Continue to Login
                  </Link>

                </div>

              ) : (

                /* ============================================
                    SIGNUP FORM
                   ============================================ */

                <form
                  onSubmit={handleSignup}
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

                  {/* COMPANY NAME */}

                  <label className={labelClass}>
                    Company Name *

                    <input
                      name="companyName"
                      type="text"
                      required
                      minLength={2}
                      maxLength={150}
                      autoComplete="organization"
                      placeholder="Enter your company name"
                      className={inputClass}
                    />
                  </label>

                  {/* USERNAME */}

                  <label className={labelClass}>
                    Username *

                    <input
                      name="username"
                      type="text"
                      required
                      minLength={3}
                      maxLength={120}
                      autoComplete="username"
                      placeholder="Choose a username"
                      className={inputClass}
                    />
                  </label>

                  {/* EMAIL */}

                  <label className={labelClass}>
                    Email Address *

                    <input
                      name="email"
                      type="email"
                      required
                      maxLength={254}
                      autoComplete="email"
                      placeholder="you@company.com"
                      className={inputClass}
                    />
                  </label>

                  {/* PASSWORD */}

                  <label className={labelClass}>
                    Password *

                    <span className="relative block">

                      <input
                        name="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Create a password"
                        className={`${inputClass} pr-14`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (current) => !current
                          )
                        }
                        aria-label={
                          showPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        aria-pressed={showPassword}
                        className="absolute right-3 top-[calc(50%+0.25rem)] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#60718a] hover:bg-[#eaf3ff]"
                      >
                        <EyeIcon visible={showPassword} />
                      </button>

                    </span>

                    <span className="mt-1 block text-xs font-normal text-[#73829a]">
                      Use at least 8 characters.
                    </span>
                  </label>

                  {/* CONFIRM PASSWORD */}

                  <label className={labelClass}>
                    Confirm Password *

                    <span className="relative block">

                      <input
                        name="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        required
                        autoComplete="new-password"
                        placeholder="Confirm your password"
                        className={`${inputClass} pr-14`}
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(
                            (current) => !current
                          )
                        }
                        aria-label={
                          showConfirmPassword
                            ? "Hide confirmation password"
                            : "Show confirmation password"
                        }
                        aria-pressed={showConfirmPassword}
                        className="absolute right-3 top-[calc(50%+0.25rem)] flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-[#60718a] hover:bg-[#eaf3ff]"
                      >
                        <EyeIcon
                          visible={showConfirmPassword}
                        />
                      </button>

                    </span>
                  </label>

                  {/* SUBMIT */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex min-h-12 w-full items-center justify-center rounded-lg bg-[#086df2] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0058cb] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading
                      ? "Creating Account..."
                      : "Create Account"}
                  </button>

                </form>

              )}

              {/* LOGIN LINK */}

              {!created && (
                <div className="mt-7 border-t border-[#e1eaf5] pt-6 text-center">

                  <p className="text-sm text-[#52627b]">
                    Already have an account?
                  </p>

                  <Link
                    href="/login"
                    className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg border-2 border-[#086df2] bg-white px-5 py-3 text-sm font-bold text-[#086df2] transition hover:bg-[#edf5ff]"
                  >
                    Login
                  </Link>

                </div>
              )}

            </div>

          </div>

        </section>

      </main>

      {/* SHARED FOOTER */}

      <PublicFooter />

    </div>
  );
}