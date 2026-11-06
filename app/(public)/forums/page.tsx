"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

// ============================================================
// ICON COMPONENT
// ============================================================

type IconName =
  | "search"
  | "book"
  | "play"
  | "question"
  | "mail"
  | "file"
  | "briefcase"
  | "settings"
  | "pencil"
  | "arrow"
  | "headset"
  | "close";

function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m16 16 4 4" />
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

    question: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9a2.5 2.5 0 1 1 4.5 1.5c-1 1-2 1.5-2 3" />
        <path d="M12 17h.01" />
      </>
    ),

    mail: (
      <>
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m2 6 10 7 10-7" />
      </>
    ),

    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),

    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </>
    ),

    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),

    pencil: (
      <>
        <path d="m16.5 3.5 4 4L9 19l-5 1 1-5L16.5 3.5z" />
        <path d="M12 20h9" />
      </>
    ),

    arrow: (
      <path d="M4 12h16m-7-7 7 7-7 7" />
    ),

    headset: (
      <>
        <path d="M3 13v-2a9 9 0 0 1 18 0v2" />
        <rect x="2" y="12" width="4" height="7" rx="2" />
        <rect x="18" y="12" width="4" height="7" rx="2" />
        <path d="M20 19c0 2-3 3-6 3h-2" />
      </>
    ),

    close: (
      <path d="M5 5l14 14M19 5 5 19" />
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
// HELP ARTICLES
//
// Article content is stored here for now.
//
// Later, these can be moved into:
// - A database
// - Markdown files
// - A dedicated article management system
// ============================================================

type HelpArticle = {
  id: string;
  title: string;
  summary: string;
  content: string[];
};

const articles: HelpArticle[] = [
  {
    id: "create-account",
    title: "Creating an Account",
    summary: "Learn how to get started with PermitPapers.",
    content: [
      "To begin using PermitPapers, visit the sign-up page and choose the subscription plan that fits your business.",
      "After your account is configured, you can begin setting up your company information and exploring the dashboard.",
      "If you have questions during registration, contact our support team.",
    ],
  },

  {
    id: "company-setup",
    title: "Account and Company Setup",
    summary: "Prepare your company profile for permit generation.",
    content: [
      "Your company profile stores information that can be reused when preparing permit documents.",
      "Depending on your business, this may include your company name, contact details, address, and contractor information.",
      "Review the information carefully before generating documents to help prevent errors.",
    ],
  },

  {
    id: "dashboard",
    title: "Navigating the Dashboard",
    summary: "Understand where to find your jobs and company tools.",
    content: [
      "The PermitPapers dashboard provides access to the tools available to your account.",
      "Use the navigation to move between your jobs, company information, users, and other available settings.",
      "Some options may depend on your account permissions.",
    ],
  },

  {
    id: "permit-packets",
    title: "Understanding Permit Packets",
    summary: "Learn what a permit packet contains.",
    content: [
      "PermitPapers helps generate permit packets using job information, company details, and the selected document templates.",
      "Depending on the job and the available templates, a packet may include permit applications and other related documents.",
      "Review the completed forms before downloading them. Requirements vary by jurisdiction and permit type.",
    ],
  },

  {
    id: "auto-fill",
    title: "How Auto-Fill Works",
    summary: "Learn how information is transferred into permit forms.",
    content: [
      "PermitPapers uses the information associated with a job and its company profile to populate supported PDF document fields.",
      "This reduces the amount of information that must be entered repeatedly.",
      "Always review automatically populated fields for completeness and accuracy before submitting documents.",
    ],
  },

  {
    id: "review-documents",
    title: "Editing and Reviewing Forms",
    summary: "Review documents before downloading.",
    content: [
      "Before downloading a permit packet, review the completed documents and verify that the information is correct.",
      "Pay particular attention to property details, names, addresses, contractor information, and other required fields.",
      "If information is missing or incorrect, update the source information or document fields using the available editing tools.",
    ],
  },

  {
    id: "create-job",
    title: "How to Create a New Job",
    summary: "Start a new permit project.",
    content: [
      "Open the Jobs area of your PermitPapers dashboard and select the option to create a new job.",
      "Enter the customer and property information requested by the application.",
      "Once the necessary information is available, you can proceed with selecting and preparing the documents for the job.",
    ],
  },

  {
    id: "customer-info",
    title: "Customer Information",
    summary: "Understand the details used when preparing permits.",
    content: [
      "Customer and property details are important parts of the document-generation process.",
      "PermitPapers can use information such as the property address, owner name, and other job-specific details when filling supported documents.",
      "Confirm that the information belongs to the correct property before generating the packet.",
    ],
  },

  {
    id: "organize-jobs",
    title: "Organizing Your Projects",
    summary: "Keep your jobs and documents organized.",
    content: [
      "The Jobs section provides a central location for accessing the projects associated with your company.",
      "Use the available job details to identify the correct customer, property, and project.",
      "Keeping information up to date helps make future document preparation easier.",
    ],
  },

  {
    id: "company-profile",
    title: "Updating Company Information",
    summary: "Keep your company profile current.",
    content: [
      "Your company profile contains information used throughout PermitPapers.",
      "When company details change, update the appropriate fields in the Company area of your dashboard.",
      "Review the saved information before generating new documents. You can also watch the company information tutorial on our Demo page.",
    ],
  },

  {
    id: "user-access",
    title: "User Access and Permissions",
    summary: "Understand access to company tools.",
    content: [
      "PermitPapers provides user management functionality for company accounts.",
      "Available actions may depend on the permissions assigned to each user.",
      "If you cannot access a company feature, contact your company administrator or PermitPapers support for assistance.",
    ],
  },

  {
    id: "custom-documents",
    title: "Company-Specific Documents",
    summary: "Learn about custom document availability.",
    content: [
      "Company-specific documents allow additional document templates to be prepared for a business's workflow.",
      "This feature is available with eligible subscription plans, and a one-time setup fee may apply.",
      "Contact PermitPapers for details about setting up your company's specific documents.",
    ],
  },

  {
    id: "login-cookies",
    title: "Login Issues and Browser Cookies",
    summary: "Troubleshoot common login problems.",
    content: [
      "If you are repeatedly redirected to the login page, one possible cause is that your browser is blocking the session cookies used to maintain your login.",
      "Check whether cookies are enabled for PermitPapers.com. You can also temporarily disable browser extensions that interfere with cookies and try signing in again.",
      "If you are using a company-managed computer, your IT department may need to review the browser's cookie settings.",
      "If the problem continues, contact PermitPapers support and include the error message or behavior you are experiencing.",
    ],
  },

  {
    id: "form-loading",
    title: "Forms or Data Not Loading",
    summary: "Troubleshoot documents that fail to load.",
    content: [
      "If a document or job fails to load, first check your internet connection and refresh the page.",
      "Verify that the required job information has been entered and that you are accessing the correct job.",
      "If the issue continues, contact support with the document name, job type, and any error message displayed.",
      "Avoid including passwords or other sensitive information in support messages.",
    ],
  },

  {
    id: "security",
    title: "Document Security and Storage",
    summary: "Learn about document access and security questions.",
    content: [
      "PermitPapers stores and processes information needed for permit document preparation.",
      "Users should only access or share information they are authorized to work with.",
      "For questions about data storage, security controls, or document handling, contact PermitPapers support for current information.",
    ],
  },
];

// ============================================================
// HELP CATEGORIES
// ============================================================

type HelpCategory = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  articleIds: string[];
  comingSoon?: boolean;
};

const categories: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    description: "Set up your account and learn the basics.",
    icon: "file",
    articleIds: [
      "create-account",
      "company-setup",
      "dashboard",
    ],
  },

  {
    id: "permit-forms",
    title: "Permit Forms",
    description: "Auto-fill and manage permit documents.",
    icon: "file",
    articleIds: [
      "auto-fill",
      "permit-packets",
      "review-documents",
    ],
  },

  {
    id: "drawing-tool",
    title: "Drawing Tool",
    description: "Create simple floor plans and sketches.",
    icon: "pencil",
    articleIds: [],
    comingSoon: true,
  },

  {
    id: "jobs",
    title: "Jobs & Customers",
    description: "Manage jobs, customers, and project details.",
    icon: "briefcase",
    articleIds: [
      "create-job",
      "customer-info",
      "organize-jobs",
    ],
  },

  {
    id: "account",
    title: "Account & Settings",
    description: "Update your company information and preferences.",
    icon: "settings",
    articleIds: [
      "company-profile",
      "user-access",
      "custom-documents",
    ],
  },

  {
    id: "troubleshooting",
    title: "Troubleshooting",
    description: "Common issues and quick fixes.",
    icon: "question",
    articleIds: [
      "login-cookies",
      "form-loading",
      "security",
    ],
  },
];

const popularArticleIds = [
  "create-job",
  "auto-fill",
  "custom-documents",
  "login-cookies",
  "user-access",
];

// ============================================================
// HELPER
// ============================================================

function getArticle(id: string) {
  return articles.find((article) => article.id === id);
}

// ============================================================
// HELP CENTER PAGE
// ============================================================

export default function ForumsPage() {
  const [search, setSearch] = useState("");

  const [activeArticle, setActiveArticle] =
    useState<HelpArticle | null>(null);

  const dialogRef = useRef<HTMLDialogElement>(null);

  const normalizedSearch = search.trim().toLowerCase();

  const searchResults = normalizedSearch
    ? articles.filter((article) => {
        const searchableText = [
          article.title,
          article.summary,
          ...article.content,
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      })
    : [];

  const openArticle = (id: string) => {
    const article = getArticle(id);

    if (!article) return;

    setActiveArticle(article);
    dialogRef.current?.showModal();
  };

  const closeArticle = () => {
    dialogRef.current?.close();
  };

  return (
    <>
      {/* ======================================================
          FULL-WIDTH LAYOUT OVERRIDE
         ====================================================== */}

      <style>{`
        .public-shell:has(.pp-help-page) {
          display: block;
          background: #ffffff;
          overflow-x: clip;
        }

        .public-content:has(.pp-help-page) {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0;
          border-radius: 0;
          box-shadow: none;
        }
      `}</style>

      <div className="pp-help-page w-full bg-white text-[#0a1737]">

        {/* ====================================================
            HERO
           ==================================================== */}

        <section className="relative isolate flex min-h-[clamp(23rem,30vw,33rem)] items-center overflow-hidden bg-[#061a31]">

          <Image
            src="/images/forums/hero.png"
            alt="Construction project and permit management workspace"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[65%_center]"
          />

          <div className="absolute inset-0 bg-gradient-to-r from-[#03152b]/95 via-[#03152b]/80 to-[#03152b]/20 lg:via-[#03152b]/55" />

          <div className="relative mx-auto w-[94vw] max-w-[96rem] py-[clamp(3rem,5vw,5rem)]">

            <div className="max-w-[48rem]">

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/90 sm:text-sm">
                Help Center & Forums
              </p>

              <h1 className="text-[clamp(2.7rem,4.8vw,5rem)] font-extrabold leading-[1.04] tracking-tight text-white">

                Get Help &

                <span className="block text-[#139dff]">
                  Find Answers
                </span>

              </h1>

              <p className="mt-5 max-w-[36rem] text-base leading-relaxed text-white/95 sm:text-lg">
                Find answers to common questions, learn how to
                use PermitPapers, and get support from our team.
              </p>

              {/* HERO SEARCH */}

              <div className="relative mt-7 max-w-[39rem]">

                <Icon
                  name="search"
                  className="pointer-events-none absolute left-4 top-1/2 h-6 w-6 -translate-y-1/2 text-[#415574]"
                />

                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Search help articles, guides, or topics..."
                  aria-label="Search help articles"
                  className="min-h-14 w-full rounded-xl border border-[#d5e6f8] bg-white py-4 pl-13 pr-5 text-base text-[#0a1737] shadow-lg outline-none transition placeholder:text-[#73819a] focus:border-[#086df2] focus:ring-2 focus:ring-[#086df2]/20"
                  style={{ paddingLeft: "3.5rem" }}
                />

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            QUICK ACCESS
           ==================================================== */}

        <section className="border-b border-[#dfebf9] bg-gradient-to-b from-white to-[#f3f9ff]">

          <div className="mx-auto grid w-[94vw] max-w-[96rem] grid-cols-1 gap-y-6 py-[clamp(1.5rem,3vw,2.5rem)] sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">

            {/* BROWSE GUIDES */}

            <a
              href="#help-topics"
              className="flex items-start gap-4 rounded-lg lg:pr-5"
            >

              <Icon
                name="book"
                className="h-10 w-10 shrink-0 text-[#086df2]"
              />

              <div>

                <h2 className="text-sm font-extrabold sm:text-base">
                  Browse Guides
                </h2>

                <p className="mt-1 text-sm leading-snug text-[#35445c]">
                  Step-by-step instructions and tutorials.
                </p>

              </div>

            </a>

            {/* WATCH VIDEOS */}

            <Link
              href="/demo"
              className="flex items-start gap-4 rounded-lg lg:border-l lg:border-[#cbdcf1] lg:px-5"
            >

              <Icon
                name="play"
                className="h-10 w-10 shrink-0 text-[#086df2]"
              />

              <div>

                <h2 className="text-sm font-extrabold sm:text-base">
                  Watch Videos
                </h2>

                <p className="mt-1 text-sm leading-snug text-[#35445c]">
                  Video walkthroughs and feature overviews.
                </p>

              </div>

            </Link>

            {/* TROUBLESHOOTING */}

            <a
              href="#help-topics"
              onClick={() => setSearch("login")}
              className="flex items-start gap-4 rounded-lg lg:border-l lg:border-[#cbdcf1] lg:px-5"
            >

              <Icon
                name="question"
                className="h-10 w-10 shrink-0 text-[#086df2]"
              />

              <div>

                <h2 className="text-sm font-extrabold sm:text-base">
                  Troubleshooting
                </h2>

                <p className="mt-1 text-sm leading-snug text-[#35445c]">
                  Find solutions to common problems.
                </p>

              </div>

            </a>

            {/* CONTACT SUPPORT */}

            <Link
              href="/contact"
              className="flex items-start gap-4 rounded-lg lg:border-l lg:border-[#cbdcf1] lg:px-5"
            >

              <Icon
                name="mail"
                className="h-10 w-10 shrink-0 text-[#086df2]"
              />

              <div>

                <h2 className="text-sm font-extrabold sm:text-base">
                  Contact Support
                </h2>

                <p className="mt-1 text-sm leading-snug text-[#35445c]">
                  Still need help? Reach out to our team.
                </p>

              </div>

            </Link>

          </div>

        </section>

        {/* ====================================================
            HELP TOPICS
           ==================================================== */}

        <section
          id="help-topics"
          className="scroll-mt-24 py-[clamp(3rem,5vw,5.5rem)]"
        >

          <div className="mx-auto w-[94vw] max-w-[96rem]">

            {/* SECTION HEADING */}

            <div className="mb-8">

              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">

                Help{" "}

                <span className="text-[#086df2]">
                  Topics
                </span>

              </h2>

              <p className="mt-2 text-base text-[#40516b]">
                Explore guides and articles organized by topic.
              </p>

            </div>

            {/* ==============================================
                SEARCH RESULTS
               ============================================== */}

            {normalizedSearch ? (

              <div>

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">

                  <h3 className="text-xl font-extrabold">
                    Search Results ({searchResults.length})
                  </h3>

                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="rounded-lg border border-[#086df2] px-4 py-2 text-sm font-bold text-[#086df2] transition hover:bg-[#edf5ff]"
                  >
                    Clear Search
                  </button>

                </div>

                {searchResults.length > 0 ? (

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                    {searchResults.map((article) => (

                      <button
                        key={article.id}
                        type="button"
                        onClick={() =>
                          openArticle(article.id)
                        }
                        className="flex items-start gap-4 rounded-xl border border-[#d9e6f7] bg-white p-5 text-left shadow-sm transition hover:border-[#086df2] hover:shadow-md"
                      >

                        <Icon
                          name="file"
                          className="h-8 w-8 shrink-0 text-[#086df2]"
                        />

                        <span>

                          <span className="block text-base font-extrabold">
                            {article.title}
                          </span>

                          <span className="mt-1 block text-sm leading-relaxed text-[#40516b]">
                            {article.summary}
                          </span>

                        </span>

                      </button>

                    ))}

                  </div>

                ) : (

                  <div className="rounded-xl border border-[#d9e6f7] bg-[#f5f9ff] p-8 text-center">

                    <p className="font-bold">
                      No matching articles found.
                    </p>

                    <p className="mt-2 text-sm text-[#40516b]">
                      Try another keyword or contact support.
                    </p>

                    <Link
                      href="/contact"
                      className="mt-5 inline-flex rounded-lg bg-[#086df2] px-5 py-3 text-sm font-bold text-white"
                    >
                      Contact Support
                    </Link>

                  </div>

                )}

              </div>

            ) : (

              /* ============================================
                  DEFAULT CATEGORY GRID
                 ============================================ */

              <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[3fr_1.05fr]">

                {/* ==========================================
                    CATEGORY CARDS
                   ========================================== */}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

                  {categories.map((category) => (

                    <article
                      key={category.id}
                      className="flex min-w-0 flex-col rounded-xl border border-[#d8e6f7] bg-white p-5 shadow-[0_5px_18px_rgba(13,53,100,0.07)]"
                    >

                      {/* CATEGORY HEADER */}

                      <div className="flex items-start gap-3">

                        <Icon
                          name={category.icon}
                          className="h-10 w-10 shrink-0 text-[#086df2]"
                        />

                        <div className="min-w-0">

                          <div className="flex flex-wrap items-center gap-2">

                            <h3 className="text-base font-extrabold">
                              {category.title}
                            </h3>

                            {category.comingSoon && (

                              <span className="rounded-full bg-[#e3f0ff] px-2.5 py-1 text-[0.65rem] font-bold text-[#086df2]">
                                Coming Soon
                              </span>

                            )}

                          </div>

                          <p className="mt-1 text-sm leading-snug text-[#40516b]">
                            {category.description}
                          </p>

                        </div>

                      </div>

                      {/* CATEGORY ARTICLES */}

                      <div className="mt-5 flex-1 border-t border-[#d6e2f1] pt-2">

                        {category.articleIds.length > 0 ? (

                          category.articleIds.map((id) => {
                            const article = getArticle(id);

                            if (!article) return null;

                            return (
                              <button
                                key={id}
                                type="button"
                                onClick={() =>
                                  openArticle(id)
                                }
                                className="flex w-full items-center justify-between gap-3 border-b border-[#e3ebf5] py-3 text-left text-sm text-[#23364e] transition hover:text-[#086df2]"
                              >

                                <span>
                                  {article.title}
                                </span>

                                <span
                                  aria-hidden="true"
                                  className="text-lg"
                                >
                                  ›
                                </span>

                              </button>
                            );
                          })

                        ) : (

                          <p className="py-4 text-sm leading-relaxed text-[#63738c]">
                            Guides and tutorials for this feature
                            will be available when the drawing
                            tool launches.
                          </p>

                        )}

                      </div>

                      {/* CATEGORY FOOTER */}

                      <div className="mt-4">

                        {category.comingSoon ? (

                          <span className="text-xs font-bold text-[#7590ad]">
                            Guides Coming Soon
                          </span>

                        ) : (

                          <span className="text-xs font-bold text-[#086df2]">
                            {category.articleIds.length} Articles Available
                          </span>

                        )}

                      </div>

                    </article>

                  ))}

                </div>

                {/* ==========================================
                    POPULAR ARTICLES SIDEBAR
                   ========================================== */}

                <aside className="overflow-hidden rounded-xl border border-[#d4e3f6] bg-white shadow-[0_6px_20px_rgba(13,53,100,0.08)]">

                  <div className="bg-gradient-to-r from-[#d7eaff] to-[#ecf6ff] px-5 py-4">

                    <h3 className="flex items-center gap-2 text-lg font-extrabold">
                      <span aria-hidden="true">🔥</span>
                      Popular Articles
                    </h3>

                  </div>

                  <div className="px-4 py-2">

                    {popularArticleIds.map((id) => {
                      const article = getArticle(id);

                      if (!article) return null;

                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() =>
                            openArticle(id)
                          }
                          className="flex w-full items-center gap-3 border-b border-[#e3ebf5] px-1 py-3 text-left transition hover:text-[#086df2]"
                        >

                          <Icon
                            name="file"
                            className="h-5 w-5 shrink-0 text-[#086df2]"
                          />

                          <span className="flex-1 text-sm">
                            {article.title}
                          </span>

                          <span
                            className="text-lg"
                            aria-hidden="true"
                          >
                            ›
                          </span>

                        </button>
                      );
                    })}

                  </div>

                  {/* WATCH DEMO CARD */}

                  <div className="m-4 rounded-xl bg-gradient-to-br from-[#d9ebff] to-[#c9e2ff] p-5">

                    <Icon
                      name="play"
                      className="h-11 w-11 text-[#086df2]"
                    />

                    <h4 className="mt-3 text-lg font-extrabold">
                      New to PermitPapers?
                    </h4>

                    <p className="mt-2 text-sm leading-relaxed text-[#40516b]">
                      Watch the full product walkthrough
                      to see how PermitPapers works.
                    </p>

                    <Link
                      href="/demo"
                      className="mt-4 flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-[#086df2] bg-white px-4 py-2 text-sm font-bold text-[#086df2] transition hover:bg-[#edf5ff]"
                    >
                      Watch Demo

                      <Icon
                        name="arrow"
                        className="h-4 w-4"
                      />

                    </Link>

                  </div>

                </aside>

              </div>

            )}

          </div>

        </section>

        {/* ====================================================
            STILL NEED HELP
           ==================================================== */}

        <section className="bg-white pb-[clamp(3rem,5vw,5rem)]">

          <div className="mx-auto w-[94vw] max-w-[96rem]">

            <div className="flex flex-col gap-6 rounded-2xl bg-gradient-to-r from-[#d6eaff] to-[#eaf5ff] p-[clamp(1.5rem,3vw,3rem)] lg:flex-row lg:items-center lg:justify-between">

              <div className="flex items-center gap-5">

                <Icon
                  name="headset"
                  className="h-14 w-14 shrink-0 text-[#086df2]"
                />

                <div>

                  <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                    Still Need Help?
                  </h2>

                  <p className="mt-1 text-base text-[#40516b]">
                    Our support team is here to assist you.
                  </p>

                </div>

              </div>

              <div className="flex flex-wrap gap-3">

                <Link
                  href="/contact"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#086df2] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0058cb]"
                >
                  Contact Support
                </Link>

                <a
                  href="mailto:admin@permitpapers.com"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-[#086df2] bg-white px-6 py-3 text-sm font-bold text-[#086df2] transition hover:bg-[#edf5ff]"
                >
                  Email Us
                </a>

              </div>

            </div>

          </div>

        </section>

        {/* ====================================================
            ARTICLE DIALOG

            Clicking an article opens the full content.
           ==================================================== */}

        <dialog
          ref={dialogRef}
          onClose={() => setActiveArticle(null)}
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              closeArticle();
            }
          }}
          aria-labelledby="help-article-title"
          className="w-[min(92vw,44rem)] max-w-none rounded-2xl border border-[#d5e5f8] bg-white p-0 text-[#0a1737] shadow-2xl backdrop:bg-[#061a31]/70"
        >

          {activeArticle && (

            <div>

              {/* DIALOG HEADER */}

              <div className="flex items-start justify-between gap-5 border-b border-[#e1eaf5] bg-[#f4f9ff] px-6 py-5">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wider text-[#086df2]">
                    Help Article
                  </p>

                  <h2
                    id="help-article-title"
                    className="mt-1 text-xl font-extrabold sm:text-2xl"
                  >
                    {activeArticle.title}
                  </h2>

                </div>

                <button
                  type="button"
                  onClick={closeArticle}
                  aria-label="Close article"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#d4e2f1] bg-white text-[#23364e] transition hover:bg-[#e9f3ff]"
                >
                  <Icon
                    name="close"
                    className="h-5 w-5"
                  />
                </button>

              </div>

              {/* ARTICLE CONTENT */}

              <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-6">

                {activeArticle.content.map(
                  (paragraph, index) => (

                    <p
                      key={index}
                      className="text-base leading-relaxed text-[#35445c]"
                    >
                      {paragraph}
                    </p>

                  )
                )}

              </div>

              {/* DIALOG FOOTER */}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e1eaf5] px-6 py-4">

                <p className="text-sm text-[#63738c]">
                  Need additional assistance?
                </p>

                <Link
                  href="/contact"
                  onClick={closeArticle}
                  className="inline-flex rounded-lg bg-[#086df2] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Contact Support
                </Link>

              </div>

            </div>

          )}

        </dialog>

        {/* Shared footer is rendered by the public layout. */}

      </div>
    </>
  );
}