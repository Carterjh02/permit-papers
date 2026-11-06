import Link from "next/link";

// ============================================================
// FOOTER NAVIGATION
// ============================================================

const footerGroups = [
  {
    title: "Products",
    links: [
      { label: "Permit Forms", href: "/#features" },
      { label: "Drawing Tool", href: "/#features" },
      { label: "How It Works", href: "/#how-it-works" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Watch Demo", href: "/demo" },
      { label: "Tutorial Videos", href: "/demo" },
      { label: "Help Center", href: "/forums" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Home", href: "/" },
      { label: "Get Started", href: "/signup" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/forums" },
      { label: "Contact Support", href: "/contact" },
      { label: "Login", href: "/login" },
    ],
  },
];

// ============================================================
// FOOTER BRAND
// ============================================================

function FooterBrand() {
  return (
    <Link
      href="/"
      aria-label="PermitPapers.com homepage"
      className="inline-flex items-center gap-3"
    >
      {/* Logo mark */}
      <span
        className="
          relative
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          overflow-hidden
          rounded-lg
          bg-gradient-to-br
          from-[#159cff]
          to-[#0055c8]
          shadow-sm
        "
      >
        <span
          className="
            text-[2.1rem]
            font-black
            italic
            leading-none
            tracking-tight
            text-white
          "
        >
          P
        </span>
      </span>

      {/* Brand text */}
      <span className="min-w-0">
        <span className="block whitespace-nowrap text-[clamp(1rem,1.5vw,1.3rem)] font-extrabold tracking-tight text-white">
          Permit
          <span className="text-[#168dff]">Papers</span>
          <span className="text-sm">.com</span>
        </span>

        <span className="mt-0.5 block text-[0.55rem] font-semibold uppercase tracking-[0.19em] text-[#b9c9df]">
          Building Permits Made Easy
        </span>
      </span>
    </Link>
  );
}

// ============================================================
// SHARED PUBLIC FOOTER
// ============================================================

export default function PublicFooter() {
  return (
    <footer className="w-full shrink-0 bg-[#061a31] text-white">

      <div className="mx-auto w-[94vw] max-w-[96rem]">

        {/* ==================================================
            MAIN FOOTER
           ================================================== */}

        <div
          className="
            grid
            grid-cols-2
            gap-x-6
            gap-y-8
            py-[clamp(1.75rem,3vw,2.75rem)]
            sm:grid-cols-3
            xl:grid-cols-[1.7fr_repeat(4,minmax(0,1fr))_1.25fr]
            xl:gap-6
          "
        >

          {/* BRAND */}
          <div className="col-span-2 sm:col-span-3 xl:col-span-1">
            <FooterBrand />
          </div>

          {/* NAVIGATION COLUMNS */}
          {footerGroups.map((group) => (
            <div
              key={group.title}
              className="min-w-0"
            >
              <h2
                className="mb-3 text-sm font-bold text-white"
                style={{ color: "#ffffff" }}
              >
                {group.title}
              </h2>

              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="
                        text-sm
                        leading-relaxed
                        text-[#b9c9df]
                        transition-colors
                        hover:text-[#51adff]
                      "
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* CONTACT */}
          <div
            className="
              col-span-2
              sm:col-span-3
              xl:col-span-1
              xl:border-l
              xl:border-white/15
              xl:pl-6
            "
          >
            <h2
              className="text-sm font-bold text-white"
              style={{ color: "#ffffff" }}
            >
              Have Questions?
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-[#b9c9df]">
              We&apos;re here to help simplify your permitting workflow.
            </p>

            <Link
              href="/contact"
              className="
                mt-4
                inline-flex
                min-h-10
                items-center
                justify-center
                rounded-lg
                bg-[#086df2]
                px-5
                py-2
                text-sm
                font-bold
                text-white
                transition-colors
                hover:bg-[#0058cb]
              "
            >
              Contact Us
            </Link>
          </div>

        </div>

        {/* ==================================================
            COPYRIGHT BAR
           ================================================== */}

        <div
          className="
            flex
            flex-col
            gap-2
            border-t
            border-white/15
            py-4
            text-xs
            text-[#94a9c3]
            sm:flex-row
            sm:items-center
            sm:justify-between
          "
        >
          <p>
            © {new Date().getFullYear()} PermitPapers.com.
            All rights reserved.
          </p>

          <p>
            Building Permits Made Easy
          </p>
        </div>

      </div>

    </footer>
  );
}