import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

// ============================================================
// ICONS
// ============================================================

type IconName =
  | "file"
  | "pencil"
  | "layers"
  | "clock"
  | "shield"
  | "chart"
  | "users"
  | "check"
  | "arrow"
  | "play"
  | "briefcase";

function Icon({
  name,
  size = 24,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const drawings: Record<IconName, ReactNode> = {
    file: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <path d="M14 2v6h6M8 13h8M8 17h8" />
      </>
    ),

    pencil: (
      <>
        <path d="M12 20h9" />
        <path d="m16.5 3.5 4 4L9 19l-5 1 1-5L16.5 3.5z" />
        <path d="m14.5 5.5 4 4" />
      </>
    ),

    layers: (
      <>
        <path d="m12 2 9 5-9 5-9-5 9-5zM3 12l9 5 9-5M3 17l9 5 9-5" />
      </>
    ),

    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 6v6l4 2" />
      </>
    ),

    shield: (
      <>
        <path d="M12 22c5-2.5 8-6 8-11V5l-8-3-8 3v6c0 5 3 8.5 8 11z" />
        <path d="m8.5 12 2.5 2.5 5-5" />
      </>
    ),

    chart: (
      <>
        <rect x="3" y="14" width="4" height="7" rx=".5" />
        <rect x="10" y="9" width="4" height="12" rx=".5" />
        <rect x="17" y="3" width="4" height="18" rx=".5" />
      </>
    ),

    users: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2 21v-2a7 7 0 0 1 14 0v2H2z" />
        <path d="M17 5a3.5 3.5 0 0 1 0 7M18 15a6 6 0 0 1 4 6" />
      </>
    ),

    check: <path d="m5 12 4 4L19 6" />,

    arrow: <path d="M4 12h16m-7-7 7 7-7 7" />,

    play: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m10 8 6 4-6 4V8z" />
      </>
    ),

    briefcase: (
      <>
        <rect x="3" y="7" width="18" height="14" rx="2" />
        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {drawings[name]}
    </svg>
  );
}

// ============================================================
// HOMEPAGE DATA
// ============================================================

const benefits: {
  icon: IconName;
  title: string;
  description: string;
}[] = [
  {
    icon: "clock",
    title: "Save Time",
    description: "Finish permits in minutes, not hours.",
  },
  {
    icon: "shield",
    title: "Reduce Errors",
    description: "Accurate, consistent documents.",
  },
  {
    icon: "chart",
    title: "Get Jobs Moving",
    description: "Less paperwork. More time building.",
  },
  {
    icon: "users",
    title: "Built for Contractors",
    description: "A workflow designed for your business.",
  },
];

const steps = [
  {
    title: "Add Customer",
    image: "/images/homepage/add-customer.png",
    alt: "Property information form with customer details",
    description:
      "Enter customer information or add property details from a screenshot.",
    comingSoon: false,
  },
  {
    title: "Auto-Fill Forms",
    image: "/images/homepage/autofill-forms.png",
    alt: "Automatically completed permit application",
    description:
      "Generate permit forms filled with the information for your job.",
    comingSoon: false,
  },
  {
    title: "Create Drawings",
    image: "/images/homepage/floor-plan.png",
    alt: "Example of a simple architectural floor plan",
    description:
      "Create simple floor plans and sketches with our upcoming drawing tool.",
    comingSoon: true,
  },
  {
    title: "Download & Print",
    image: "/images/homepage/download-permits.png",
    alt: "Completed permit documents ready for download",
    description:
      "Review your documents, then save or print your permit packet.",
    comingSoon: false,
  },
];

const features: {
  icon: IconName;
  title: string;
  description: string;
  image: string;
  alt: string;
  comingSoon?: boolean;
}[] = [
  {
    icon: "file",
    title: "Permit Forms",
    description:
      "Automatically complete permit documents using your project information.",
    image: "/images/homepage/autofill-forms.png",
    alt: "Completed building permit application",
  },
  {
    icon: "pencil",
    title: "Drawing Tool",
    description:
      "Create clear floor plans and sketches without complicated software.",
    image: "/images/homepage/floor-plan.png",
    alt: "Simple architectural floor plan",
    comingSoon: true,
  },
  {
    icon: "briefcase",
    title: "Manage Jobs",
    description:
      "Keep customer details, jobs, and permit documents organized.",
    image: "/images/homepage/add-customer.png",
    alt: "Customer information and project details",
  },
];

const plans = [
  {
    name: "Lite",
    price: "$149",
    highlighted: false,
    perks: [
      "75 jobs per month",
      "Automated property search",
      "Auto-filled permit forms",
    ],
  },
  {
    name: "Pro",
    price: "$225",
    highlighted: true,
    perks: [
      "250 jobs per month",
      "Everything in Lite",
      "Company-specific documents*",
      "Drawing tool (coming soon)",
    ],
  },
  {
    name: "Enterprise",
    price: "$349",
    highlighted: false,
    perks: [
      "Unlimited jobs",
      "Everything in Pro",
      "Dedicated support",
      "40% off additional features",
    ],
  },
];

// ============================================================
// HOMEPAGE
// ============================================================

export default function HomePage() {
  return (
    <>
      {/* ======================================================
          FULL-WIDTH HOMEPAGE OVERRIDE

          The existing public layout limits content to 1100px.

          This override applies ONLY when the homepage exists
          inside that layout. Other public pages are unaffected.
         ====================================================== */}

      <style>{`
        .public-shell:has(.pp-homepage) {
          display: block;
          background: #ffffff;
          overflow-x: clip;
        }

        .public-content:has(.pp-homepage) {
          max-width: none;
          width: 100%;
          padding: 0;
          margin: 0;
          border-radius: 0;
          box-shadow: none;
        }

        html {
          scroll-behavior: smooth;
        }
      `}</style>

      <div className="pp-homepage w-full bg-white text-[#0a1737]">

        {/* ====================================================
            HERO
           ==================================================== */}

        <section className="relative isolate min-h-[clamp(32rem,43vw,43rem)] overflow-hidden bg-[#061a31]">

          {/* Background image */}
          <Image
            src="/images/homepage/hero-construction.png"
            alt="Contractor using PermitPapers on a laptop at a construction site"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[64%_center]"
          />

          {/* Dark overlay to improve text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#03152b]/95 via-[#03152b]/75 to-[#03152b]/20 lg:via-[#03152b]/45" />

          <div className="relative mx-auto flex min-h-[clamp(32rem,43vw,43rem)] w-[94vw] max-w-[96rem] items-center py-[clamp(3rem,5vw,5rem)]">

            <div className="w-full max-w-[43rem]">

              <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-white/90 sm:text-sm">
                Built for Contractors
              </p>

              <h1 className="text-[clamp(2.7rem,4.8vw,5.3rem)] font-extrabold leading-[1.02] tracking-tight text-white">
                <span className="block">
                  Building Permits
                </span>

                <span className="mt-1 block text-[#139dff]">
                  Made Easy
                </span>
              </h1>

              <p className="mt-5 max-w-[35rem] text-base leading-relaxed text-white/95 sm:text-lg">
                Auto-fill permit forms, manage your jobs, and get your
                documents ready in one place. Save time, reduce errors,
                and get back to building.
              </p>

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-3">

                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#0768ef] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#0058d5] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  Get Started
                  <Icon name="arrow" size={17} />
                </Link>

                <Link
                  href="/demo"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/90 bg-black/20 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <Icon name="play" size={19} />
                  Watch Demo
                </Link>

              </div>

              {/* Hero feature highlights */}
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-wide text-white sm:text-sm">

                <span className="flex items-center gap-2">
                  <Icon
                    name="file"
                    size={27}
                    className="text-[#139dff]"
                  />
                  Auto-Fill Forms
                </span>

                <span className="flex items-center gap-2">
                  <Icon
                    name="pencil"
                    size={27}
                    className="text-[#139dff]"
                  />
                  Drawings (Soon)
                </span>

                <span className="flex items-center gap-2">
                  <Icon
                    name="layers"
                    size={27}
                    className="text-[#139dff]"
                  />
                  Manage Jobs
                </span>

              </div>

            </div>
          </div>
        </section>

        {/* ====================================================
            BENEFITS
           ==================================================== */}

        <section
          aria-label="Benefits of PermitPapers"
          className="border-b border-[#e5eefb] bg-gradient-to-b from-white to-[#f5faff]"
        >

          <div className="mx-auto grid w-[94vw] max-w-[96rem] grid-cols-1 gap-x-5 gap-y-6 py-[clamp(1.5rem,3vw,2.5rem)] sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">

            {benefits.map((benefit, index) => (

              <div
                key={benefit.title}
                className={`flex items-start gap-4 lg:px-5 ${
                  index > 0
                    ? "lg:border-l lg:border-[#cddcf2]"
                    : ""
                }`}
              >

                <Icon
                  name={benefit.icon}
                  size={38}
                  className="shrink-0 text-[#086df2]"
                />

                <div>

                  <h2 className="text-sm font-extrabold leading-tight sm:text-base">
                    {benefit.title}
                  </h2>

                  <p className="mt-1 text-sm leading-snug text-[#35445c]">
                    {benefit.description}
                  </p>

                </div>

              </div>

            ))}

          </div>
        </section>

        {/* ====================================================
            HOW IT WORKS
           ==================================================== */}

        <section
          id="how-it-works"
          aria-labelledby="how-it-works-heading"
          className="scroll-mt-20 py-[clamp(3rem,5vw,5.5rem)]"
        >

          <div className="mx-auto w-[94vw] max-w-[96rem]">

            <h2
              id="how-it-works-heading"
              className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              How It Works
            </h2>

            <p className="mx-auto mt-2 max-w-2xl text-center text-base text-[#384861]">
              From property information to a completed permit packet
              in a few simple steps.
            </p>

            <div className="mt-10 grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-[clamp(1.25rem,2.2vw,3rem)]">

              {steps.map((step, index) => (

                <div
                  key={step.title}
                  className="relative min-w-0"
                >

                  {/* Step heading */}
                  <div className="mb-3 flex items-center gap-3">

                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#086df2] text-lg font-extrabold text-white">
                      {index + 1}
                    </span>

                    <h3 className="text-base font-extrabold sm:text-lg">
                      {step.title}
                    </h3>

                  </div>

                  {/* Step image */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-lg border border-[#d9e6f8] bg-[#f6faff] shadow-sm">

                    <Image
                      src={step.image}
                      alt={step.alt}
                      fill
                      sizes="(max-width: 640px) 94vw, (max-width: 1024px) 47vw, 23vw"
                      className="object-contain object-center"
                    />

                  </div>

                  {/* Arrow between desktop steps */}
                  {index < steps.length - 1 && (

                    <span
                      className="absolute -right-[1.8rem] top-[45%] hidden text-[#5395ee] lg:block"
                      aria-hidden="true"
                    >
                      <Icon name="arrow" size={19} />
                    </span>

                  )}

                  <p className="mt-3 text-sm leading-relaxed text-[#2e3b51]">
                    {step.description}
                  </p>

                  {step.comingSoon && (

                    <span className="mt-2 inline-block rounded-full bg-[#e8f3ff] px-2.5 py-1 text-xs font-bold text-[#085cbe]">
                      Coming Soon
                    </span>

                  )}

                </div>

              ))}

            </div>

          </div>
        </section>

        {/* ====================================================
            KEY FEATURES
           ==================================================== */}

        <section
          id="features"
          aria-labelledby="features-heading"
          className="scroll-mt-20 bg-gradient-to-b from-[#eef7ff] to-[#e5f1ff] py-[clamp(3rem,5vw,5rem)]"
        >

          <div className="mx-auto w-[94vw] max-w-[96rem]">

            <h2
              id="features-heading"
              className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              Key <span className="text-[#086df2]">Features</span>
            </h2>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">

{           features.map((feature) => (

              <article
                key={feature.title}
                id={
                  feature.title === "Permit Forms"
                    ? "permit-forms"
                    : feature.title === "Drawing Tool"
                    ? "drawing-tool"
                    : undefined
                }
                className="scroll-mt-24 flex min-w-0 items-center gap-4 overflow-hidden rounded-xl border border-[#d8e6fa] bg-white p-5 shadow-[0_6px_16px_rgba(16,54,100,.06)]"
              >

                  <Icon
                    name={feature.icon}
                    size={36}
                    className="shrink-0 text-[#086df2]"
                  />

                  <div className="min-w-0 flex-1">

                    <h3 className="text-base font-extrabold">
                      {feature.title}
                    </h3>

                    <p className="mt-1 text-sm leading-snug text-[#34445b]">
                      {feature.description}
                    </p>

                    {feature.comingSoon && (

                      <span className="mt-2 inline-block text-xs font-bold text-[#086df2]">
                        Coming Soon
                      </span>

                    )}

                  </div>

                  <div className="relative hidden aspect-[4/3] w-[30%] shrink-0 overflow-hidden rounded-md bg-[#f6faff] lg:block">

                    <Image
                      src={feature.image}
                      alt={feature.alt}
                      fill
                      sizes="20vw"
                      className="object-cover"
                    />

                  </div>

                </article>

              ))}

            </div>

          </div>
        </section>

        {/* ====================================================
            PRICING
           ==================================================== */}

        <section
          id="pricing"
          aria-labelledby="pricing-heading"
          className="relative isolate scroll-mt-20 overflow-hidden bg-gradient-to-b from-[#e0f0ff] via-[#eff8ff] to-[#deeeff] py-[clamp(3rem,5vw,5.5rem)]"
        >

          {/* Decorative construction image */}
          <div
            className="pointer-events-none absolute bottom-0 right-0 hidden h-[80%] w-[clamp(14rem,24vw,27rem)] opacity-30 lg:block"
            aria-hidden="true"
          >

            <Image
              src="/images/homepage/construction-framing.png"
              alt=""
              fill
              sizes="24vw"
              className="object-cover object-left"
            />

            <div className="absolute inset-0 bg-gradient-to-r from-[#e8f4ff] via-transparent to-transparent" />

          </div>

          <div className="relative mx-auto w-[94vw] max-w-[88rem]">

            <h2
              id="pricing-heading"
              className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl"
            >
              Simple, Transparent{" "}
              <span className="text-[#086df2]">Pricing</span>
            </h2>

            <p className="mt-2 text-center text-base text-[#34445d]">
              Choose the plan that fits your business.
            </p>

            <div className="mx-auto mt-10 grid w-full grid-cols-1 items-stretch gap-[clamp(1rem,2vw,2rem)] md:grid-cols-3">

              {plans.map((plan) => (

                <article
                  key={plan.name}
                  className={`relative flex flex-col rounded-xl bg-white p-6 shadow-[0_8px_24px_rgba(15,50,100,.09)] ${
                    plan.highlighted
                      ? "border-2 border-[#086df2]"
                      : "border border-[#d9e5f5]"
                  }`}
                >

                  {plan.highlighted && (

                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#086df2] px-5 py-1.5 text-xs font-extrabold uppercase tracking-wide text-white shadow-md">
                      Most Popular
                    </div>

                  )}

                  <h3 className="text-xl font-extrabold">
                    {plan.name}
                  </h3>

                  <div className="mt-1 flex items-baseline gap-1.5">

                    <strong className="text-[clamp(2rem,3vw,2.6rem)] font-extrabold leading-tight tracking-tight">
                      {plan.price}
                    </strong>

                    <span className="text-sm text-[#34445d]">
                      / month
                    </span>

                  </div>

                  <ul className="mt-5 flex-1 space-y-3 text-sm leading-snug text-[#203049]">

                    {plan.perks.map((perk) => (

                      <li
                        key={perk}
                        className="flex items-start gap-2.5"
                      >

                        <Icon
                          name="check"
                          size={19}
                          className="mt-0.5 shrink-0 text-[#13a34a]"
                        />

                        <span>{perk}</span>

                      </li>

                    ))}

                  </ul>

                  <Link
                    href="/signup"
                    className={`mt-7 inline-flex min-h-11 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#086df2] ${
                      plan.highlighted
                        ? "bg-[#086df2] text-white hover:bg-[#0058cb]"
                        : "border-2 border-[#086df2] bg-white text-[#075fd1] hover:bg-[#edf5ff]"
                    }`}
                  >
                    Get Started
                  </Link>

                </article>

              ))}

            </div>

            {/* Pricing disclaimer */}
            <p className="mx-auto mt-4 max-w-3xl text-center text-xs text-[#4a5b75]">
              * One-time setup fee applies to company-specific documents.
              All plans are billed monthly.
            </p>

            {/* Full comparison */}
            <div className="mt-5 text-center">

              <Link
                href="/signup"
                className="inline-flex items-center gap-2 border-b-2 border-[#086df2] pb-1 text-base font-bold text-[#086df2] transition hover:text-[#004cae]"
              >
                View Full Plan Comparison
                <Icon name="arrow" size={19} />
              </Link>

            </div>

          </div>

        </section>

        {/* Footer is rendered by the shared public layout. */}

      </div>
    </>
  );
}