"use client";

import type { FormEvent, ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

// ============================================================
// ICON COMPONENT
// ============================================================

type IconName =
  | "mail"
  | "message"
  | "book"
  | "play"
  | "arrow"
  | "shield";

function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 6 10 7 10-7" />
      </>
    ),

    message: (
      <>
        <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-5.5a9 9 0 0 1-.9-4A8.5 8.5 0 0 1 12.5 3H13a8 8 0 0 1 8 8v.5z" />
        <path d="M8 11h8M8 14h5" />
      </>
    ),

    book: (
      <>
        <path d="M12 6c-3-2-6-2-10-1v15c4-1 7-1 10 1" />
        <path d="M12 6c3-2 6-2 10-1v15c-4-1-7-1-10 1" />
        <path d="M12 6v15" />
      </>
    ),

    play: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="m10 7 6 5-6 5V7z" />
      </>
    ),

    arrow: (
      <path d="M4 12h16m-7-7 7 7-7 7" />
    ),

    shield: (
      <>
        <path d="M12 22c5-2.5 8-6 8-11V5l-8-3-8 3v6c0 5 3 8.5 8 11z" />
        <path d="m8.5 12 2.5 2.5 5-5" />
      </>
    ),
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {paths[name]}
    </svg>
  );
}

// ============================================================
// CONTACT FORM HANDLER
//
// Opens a pre-filled email in the visitor's email application.
// No information is submitted directly to our website.
// ============================================================

function handleContactSubmit(
  event: FormEvent<HTMLFormElement>
) {
  event.preventDefault();

  const data = new FormData(event.currentTarget);

  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const company = String(data.get("company") ?? "").trim();
  const topic = String(data.get("topic") ?? "").trim();
  const message = String(data.get("message") ?? "").trim();

  if (!name || !email || !topic || !message) {
    return;
  }

  const subject = `[PermitPapers Contact] ${topic}`;

  const body = [
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company || "Not provided"}`,
    `Topic: ${topic}`,
    "",
    "Message:",
    message,
  ].join("\n");

  const mailtoUrl =
    "mailto:admin@permitpapers.com" +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(body)}`;

  window.location.href = mailtoUrl;
}

// ============================================================
// CONTACT PAGE
// ============================================================

export default function ContactPage() {

  const inputClass = `
    mt-2
    w-full
    min-w-0
    rounded-lg
    border
    border-[#d4e2f3]
    bg-[#f9fbff]
    px-4
    py-3
    text-base
    text-[#0a1737]
    outline-none
    transition
    placeholder:text-[#8290a6]
    focus:border-[#086df2]
    focus:ring-2
    focus:ring-[#086df2]/15
  `;

  const labelClass = "block text-sm font-bold text-[#1e304b]";

  return (
    <>
      {/* ======================================================
          FULL-WIDTH PUBLIC PAGE OVERRIDE
         ====================================================== */}

      <style>{`
        .public-shell:has(.pp-contact-page) {
          display: block;
          background: #ffffff;
          overflow-x: clip;
        }

        .public-content:has(.pp-contact-page) {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0;
          border-radius: 0;
          box-shadow: none;
        }
      `}</style>

      <div className="pp-contact-page w-full bg-white text-[#0a1737]">

        {/* ====================================================
            HERO
           ==================================================== */}

        <section className="relative isolate flex min-h-[clamp(22rem,30vw,32rem)] items-center overflow-hidden bg-[#061a31]">

          <Image
            src="/images/contact/hero.png"
            alt="Contractor using PermitPapers at a construction site"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[65%_center]"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#03152b]/95 via-[#03152b]/80 to-[#03152b]/20 lg:via-[#03152b]/50" />

          <div className="relative mx-auto w-[94vw] max-w-[96rem] py-[clamp(3rem,5vw,5rem)]">

            <div className="max-w-[46rem]">

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/90 sm:text-sm">
                Contact & Support
              </p>

              <h1 className="text-[clamp(2.7rem,4.8vw,5rem)] font-extrabold leading-[1.04] tracking-tight text-white">

                We&apos;re Here to

                <span className="block text-[#139dff]">
                  Help
                </span>

              </h1>

              <p className="mt-5 max-w-[35rem] text-base leading-relaxed text-white/95 sm:text-lg">
                Have questions about PermitPapers, need help
                with your account, or want to learn more?
                Reach out to our team.
              </p>

              <a
                href="#contact-form"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#086df2] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0058cb]"
              >
                Send Us a Message

                <Icon
                  name="arrow"
                  className="h-5 w-5"
                />
              </a>

            </div>

          </div>

        </section>

        {/* ====================================================
            QUICK CONTACT OPTIONS
           ==================================================== */}

        <section className="border-b border-[#e0eaf7] bg-gradient-to-b from-white to-[#f4f9ff]">

          <div className="mx-auto grid w-[94vw] max-w-[96rem] grid-cols-1 gap-6 py-[clamp(1.5rem,3vw,2.5rem)] sm:grid-cols-3">

            {/* MESSAGE */}

            <a
              href="#contact-form"
              className="flex items-start gap-4"
            >
              <Icon
                name="message"
                className="h-10 w-10 shrink-0 text-[#086df2]"
              />

              <div>
                <h2 className="text-sm font-extrabold sm:text-base">
                  Send a Message
                </h2>

                <p className="mt-1 text-sm text-[#40516b]">
                  Tell us how we can help.
                </p>
              </div>
            </a>

            {/* HELP CENTER */}

            <Link
              href="/forums"
              className="flex items-start gap-4 sm:border-l sm:border-[#cbdcf1] sm:pl-6"
            >
              <Icon
                name="book"
                className="h-10 w-10 shrink-0 text-[#086df2]"
              />

              <div>
                <h2 className="text-sm font-extrabold sm:text-base">
                  Help Center
                </h2>

                <p className="mt-1 text-sm text-[#40516b]">
                  Find answers to common questions.
                </p>
              </div>
            </Link>

            {/* TUTORIALS */}

            <Link
              href="/demo"
              className="flex items-start gap-4 sm:border-l sm:border-[#cbdcf1] sm:pl-6"
            >
              <Icon
                name="play"
                className="h-10 w-10 shrink-0 text-[#086df2]"
              />

              <div>
                <h2 className="text-sm font-extrabold sm:text-base">
                  Watch Tutorials
                </h2>

                <p className="mt-1 text-sm text-[#40516b]">
                  Explore our product demonstrations.
                </p>
              </div>
            </Link>

          </div>

        </section>

        {/* ====================================================
            CONTACT FORM + SUPPORT INFORMATION
           ==================================================== */}

        <section
          id="contact-form"
          className="scroll-mt-24 py-[clamp(3rem,5vw,5.5rem)]"
        >

          <div className="mx-auto w-[94vw] max-w-[82rem]">

            {/* SECTION HEADING */}

            <div className="mb-10 text-center">

              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">

                Get in{" "}

                <span className="text-[#086df2]">
                  Touch
                </span>

              </h2>

              <p className="mt-2 text-base text-[#40516b]">
                Share your question or request with our team.
              </p>

            </div>

            <div className="grid grid-cols-1 items-start gap-[clamp(1.5rem,3vw,3rem)] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">

              {/* ==========================================
                  CONTACT FORM CARD
                 ========================================== */}

              <div className="min-w-0 rounded-2xl border border-[#dce8f7] bg-white p-[clamp(1.25rem,3vw,2.5rem)] shadow-[0_10px_30px_rgba(12,45,85,0.08)]">

                <div className="mb-7 flex items-center gap-3">

                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f3ff] text-[#086df2]">

                    <Icon
                      name="mail"
                      className="h-7 w-7"
                    />

                  </span>

                  <div>

                    <h3 className="text-xl font-extrabold">
                      Send Us a Message
                    </h3>

                    <p className="text-sm text-[#52627b]">
                      Fields marked * are required.
                    </p>

                  </div>

                </div>

                {/* FORM */}

                <form
                  onSubmit={handleContactSubmit}
                  className="space-y-5"
                >

                  {/* NAME + EMAIL */}

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                    <label className={labelClass}>
                      Full Name *

                      <input
                        name="name"
                        type="text"
                        required
                        maxLength={120}
                        autoComplete="name"
                        placeholder="Your full name"
                        className={inputClass}
                      />
                    </label>

                    <label className={labelClass}>
                      Email Address *

                      <input
                        name="email"
                        type="email"
                        required
                        maxLength={254}
                        autoComplete="email"
                        placeholder="you@example.com"
                        className={inputClass}
                      />
                    </label>

                  </div>

                  {/* COMPANY */}

                  <label className={labelClass}>
                    Company Name

                    <input
                      name="company"
                      type="text"
                      maxLength={150}
                      autoComplete="organization"
                      placeholder="Your company (optional)"
                      className={inputClass}
                    />
                  </label>

                  {/* TOPIC */}

                  <label className={labelClass}>
                    How Can We Help? *

                    <select
                      name="topic"
                      required
                      defaultValue=""
                      className={inputClass}
                    >
                      <option value="" disabled>
                        Select a topic
                      </option>

                      <option value="General Question">
                        General Question
                      </option>

                      <option value="Account or Login Support">
                        Account or Login Support
                      </option>

                      <option value="Permit Forms or Documents">
                        Permit Forms or Documents
                      </option>

                      <option value="Subscription or Pricing">
                        Subscription or Pricing
                      </option>

                      <option value="Feature Request">
                        Feature Request
                      </option>

                      <option value="Report an Issue">
                        Report an Issue
                      </option>

                      <option value="Other">
                        Other
                      </option>
                    </select>
                  </label>

                  {/* MESSAGE */}

                  <label className={labelClass}>
                    Message *

                    <textarea
                      name="message"
                      required
                      maxLength={3000}
                      rows={6}
                      placeholder="Tell us a little about what you need help with..."
                      className={`${inputClass} resize-y`}
                    />
                  </label>

                  <p className="text-xs leading-relaxed text-[#63738c]">
                    Please do not include passwords, payment
                    information, or sensitive customer records.
                  </p>

                  {/* SUBMIT */}

                  <button
                    type="submit"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#086df2] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0058cb] sm:w-auto"
                  >
                    Open Email Draft

                    <Icon
                      name="arrow"
                      className="h-5 w-5"
                    />
                  </button>

                  <p className="text-xs leading-relaxed text-[#63738c]">
                    This opens your email application with
                    your message prepared. Review and send
                    it from there. Messages are not submitted
                    directly through the website yet.
                  </p>

                </form>

              </div>

              {/* ==========================================
                  SUPPORT SIDEBAR
                 ========================================== */}

              <aside className="min-w-0 space-y-5">

                {/* EMAIL CARD */}

                <div className="rounded-2xl border border-[#d7e6f8] bg-gradient-to-br from-[#eaf5ff] to-[#dcecff] p-6">

                  <Icon
                    name="mail"
                    className="h-11 w-11 text-[#086df2]"
                  />

                  <h3 className="mt-4 text-xl font-extrabold">
                    Email Support
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[#40516b]">
                    Prefer to reach out directly?
                    You can contact our team by email.
                  </p>

                  <a
                    href="mailto:admin@permitpapers.com"
                    className="mt-4 inline-block break-all text-sm font-bold text-[#086df2] hover:underline sm:text-base"
                  >
                    admin@permitpapers.com
                  </a>

                </div>

                {/* HELP CENTER CARD */}

                <div className="rounded-2xl border border-[#dce8f7] bg-white p-6 shadow-[0_6px_20px_rgba(12,45,85,0.06)]">

                  <Icon
                    name="book"
                    className="h-10 w-10 text-[#086df2]"
                  />

                  <h3 className="mt-3 text-lg font-extrabold">
                    Looking for Answers?
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[#40516b]">
                    Browse help articles covering account
                    setup, document preparation, and
                    common troubleshooting questions.
                  </p>

                  <Link
                    href="/forums"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#086df2] hover:underline"
                  >
                    Visit Help Center

                    <Icon
                      name="arrow"
                      className="h-4 w-4"
                    />
                  </Link>

                </div>

                {/* DEMO CARD */}

                <div className="rounded-2xl border border-[#dce8f7] bg-white p-6 shadow-[0_6px_20px_rgba(12,45,85,0.06)]">

                  <Icon
                    name="play"
                    className="h-10 w-10 text-[#086df2]"
                  />

                  <h3 className="mt-3 text-lg font-extrabold">
                    New to PermitPapers?
                  </h3>

                  <p className="mt-2 text-sm leading-relaxed text-[#40516b]">
                    Watch our product walkthrough to
                    see how PermitPapers simplifies
                    permit document preparation.
                  </p>

                  <Link
                    href="/demo"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#086df2] hover:underline"
                  >
                    Watch Product Demo

                    <Icon
                      name="arrow"
                      className="h-4 w-4"
                    />
                  </Link>

                </div>

              </aside>

            </div>

          </div>

        </section>

        {/* ====================================================
            BOTTOM CALL TO ACTION
           ==================================================== */}

        <section className="bg-gradient-to-b from-[#edf7ff] to-[#dcecff] py-[clamp(2.5rem,4vw,4rem)]">

          <div className="mx-auto flex w-[94vw] max-w-[82rem] flex-col items-start justify-between gap-6 rounded-2xl border border-[#c7dff9] bg-white/75 p-[clamp(1.5rem,3vw,2.5rem)] sm:flex-row sm:items-center">

            <div className="flex items-start gap-4">

              <Icon
                name="shield"
                className="h-12 w-12 shrink-0 text-[#086df2]"
              />

              <div>

                <h2 className="text-xl font-extrabold sm:text-2xl">
                  Ready to Get Started?
                </h2>

                <p className="mt-1 text-sm leading-relaxed text-[#40516b] sm:text-base">
                  Discover how PermitPapers can fit into
                  your business workflow.
                </p>

              </div>

            </div>

            <Link
              href="/signup"
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#086df2] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0058cb]"
            >
              Get Started

              <Icon
                name="arrow"
                className="h-5 w-5"
              />
            </Link>

          </div>

        </section>

        {/* Shared footer is rendered by the public layout. */}

      </div>
    </>
  );
}