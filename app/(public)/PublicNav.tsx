"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

// ============================================================
// NAVIGATION TYPES
// ============================================================

type NavItem = {
  label: string;
  href: string;
};

type NavGroup = {
  title: string;
  links: NavItem[];
};

// ============================================================
// NAVIGATION DATA
//
// Home:
// Links to homepage sections and signup.
//
// Resources:
// Links to distinct sections of the Demo page.
//
// Support:
// Existing support destinations preserved.
// ============================================================

const homeLinks: NavItem[] = [
  {
    label: "How It Works",
    href: "/#how-it-works",
  },
  {
    label: "Permit Forms",
    href: "/#permit-forms",
  },
  {
    label: "Drawing Tool (Coming Soon)",
    href: "/#drawing-tool",
  },
  {
    label: "Pricing Plans",
    href: "/#pricing",
  },
];

const resourceLinks: NavItem[] = [
  {
    label: "Watch Demo",
    href: "/demo#demo-videos",
  },
  {
    label: "Explore Key Features",
    href: "/demo#demo-features",
  },
  {
    label: "Guided Demo Access (Coming Soon)",
    href: "/demo#guided-demo",
  },
];

const supportLinks: NavItem[] = [
  {
    label: "Contact Us",
    href: "/contact",
  },
  {
    label: "Help Center",
    href: "/forums",
  },
];

// ============================================================
// SHARED NAVIGATION GROUPS
//
// Used by both desktop and mobile navigation.
// ============================================================

const navGroups: NavGroup[] = [
  {
    title: "Home",
    links: homeLinks,
  },
  {
    title: "Resources",
    links: resourceLinks,
  },
  {
    title: "Support",
    links: supportLinks,
  },
];

// ============================================================
// ICONS
// ============================================================

function ChevronIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ) : (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

// ============================================================
// DESKTOP DROPDOWN
// ============================================================

type DropdownProps = {
  group: NavGroup;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: () => void;
};

function NavDropdown({
  group,
  isOpen,
  onToggle,
  onNavigate,
}: DropdownProps) {
  const dropdownId = `nav-${group.title.toLowerCase()}`;

  return (
    <div className="relative">

      {/* DROPDOWN BUTTON */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={dropdownId}
        className={`
          inline-flex
          min-h-11
          items-center
          gap-1.5
          whitespace-nowrap
          rounded-md
          px-2
          py-2
          text-sm
          font-semibold
          transition-colors
          ${
            isOpen
              ? "text-[#086df2]"
              : "text-[#10213e] hover:text-[#086df2]"
          }
        `}
      >
        {group.title}

        <span
          className={`
            transition-transform
            ${isOpen ? "rotate-180" : ""}
          `}
        >
          <ChevronIcon />
        </span>
      </button>

      {/* DROPDOWN CONTENT */}
      {isOpen && (
        <div
          id={dropdownId}
          className="
            absolute
            left-0
            top-full
            z-50
            mt-2
            w-72
            rounded-xl
            border
            border-[#dce7f7]
            bg-white
            p-2
            shadow-[0_12px_30px_rgba(6,28,60,0.15)]
          "
        >
          {group.links.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className="
                block
                rounded-lg
                px-4
                py-3
                text-sm
                font-medium
                text-[#23354f]
                transition
                hover:bg-[#edf5ff]
                hover:text-[#086df2]
              "
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}

    </div>
  );
}

// ============================================================
// PUBLIC NAVIGATION CONTENT
// ============================================================

function PublicNavContent() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const [openDropdown, setOpenDropdown] = useState<
    string | null
  >(null);

  const navRef = useRef<HTMLElement>(null);

  // ==========================================================
  // CLOSE MENUS WHEN CLICKING OUTSIDE NAVIGATION
  // ==========================================================

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        navRef.current &&
        !navRef.current.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
    };
  }, []);

  // ==========================================================
  // MENU HELPERS
  // ==========================================================

  const closeMenus = () => {
    setMobileOpen(false);
    setOpenDropdown(null);
  };

  const toggleDropdown = (name: string) => {
    setOpenDropdown((current) =>
      current === name ? null : name
    );
  };

  // ==========================================================
  // NAVIGATION RENDER
  // ==========================================================

  return (
    <nav
      ref={navRef}
      aria-label="Main navigation"
      onKeyDown={(event) => {
        if (event.key === "Escape") {
          closeMenus();
        }
      }}
      className="
        relative
        z-50
        w-full
        border-b
        border-[#e1e9f5]
        bg-gradient-to-b
        from-white
        to-[#f8fbff]
        shadow-[0_2px_12px_rgba(10,34,70,0.06)]
      "
    >

      {/* ====================================================
          NAVIGATION CONTAINER
         ==================================================== */}

      <div
        className="
          mx-auto
          flex
          min-h-[4.75rem]
          w-[94vw]
          max-w-[96rem]
          items-center
          justify-between
          gap-4
          py-2
        "
      >

        {/* ==================================================
            LOGO
           ================================================== */}

        <Link
          href="/"
          onClick={closeMenus}
          className="flex min-w-0 shrink-0 items-center"
          aria-label="PermitPapers.com Home"
        >
          <Image
            src="/logos/logo-permitpapers-plain.png"
            alt="PermitPapers.com"
            width={320}
            height={85}
            priority
            className="
              h-[3.5rem]
              w-auto
              max-w-[clamp(10rem,19vw,17rem)]
              object-contain
            "
          />
        </Link>

        {/* ==================================================
            DESKTOP NAVIGATION
           ================================================== */}

        <div className="hidden items-center gap-3 lg:flex xl:gap-6">

          {navGroups.map((group) => (
            <NavDropdown
              key={group.title}
              group={group}
              isOpen={openDropdown === group.title}
              onToggle={() =>
                toggleDropdown(group.title)
              }
              onNavigate={closeMenus}
            />
          ))}

        </div>

        {/* ==================================================
            DESKTOP ACTIONS
           ================================================== */}

        <div className="hidden items-center gap-3 lg:flex">

          {/* SEARCH / HELP CENTER */}
          <Link
            href="/forums"
            onClick={closeMenus}
            aria-label="Search help topics"
            title="Search help topics"
            className="
              inline-flex
              h-11
              w-11
              items-center
              justify-center
              rounded-lg
              text-[#10213e]
              transition
              hover:bg-[#eaf3ff]
              hover:text-[#086df2]
            "
          >
            <SearchIcon />
          </Link>

          {/* LOGIN */}
          <Link
            href="/login"
            onClick={closeMenus}
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              rounded-lg
              border
              border-[#086df2]
              bg-white
              px-5
              py-2
              text-sm
              font-bold
              text-[#086df2]
              transition
              hover:bg-[#edf5ff]
            "
          >
            Login
          </Link>

          {/* GET STARTED */}
          <Link
            href="/signup"
            onClick={closeMenus}
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              rounded-lg
              bg-[#086df2]
              px-5
              py-2
              text-sm
              font-bold
              text-white
              shadow-sm
              transition
              hover:bg-[#0058cb]
            "
          >
            Get Started
          </Link>

        </div>

        {/* ==================================================
            MOBILE NAVIGATION ACTIONS
           ================================================== */}

        <div className="flex items-center gap-2 lg:hidden">

          <Link
            href="/login"
            onClick={closeMenus}
            className="
              inline-flex
              min-h-11
              items-center
              justify-center
              rounded-lg
              border
              border-[#086df2]
              px-3
              py-2
              text-sm
              font-bold
              text-[#086df2]
            "
          >
            Login
          </Link>

          <button
            type="button"
            aria-label={
              mobileOpen ? "Close menu" : "Open menu"
            }
            aria-expanded={mobileOpen}
            aria-controls="public-mobile-menu"
            onClick={() =>
              setMobileOpen((current) => !current)
            }
            className="
              inline-flex
              h-11
              w-11
              items-center
              justify-center
              rounded-lg
              border
              border-[#d8e4f4]
              bg-white
              text-[#10213e]
              transition
              hover:bg-[#edf5ff]
            "
          >
            <MenuIcon open={mobileOpen} />
          </button>

        </div>

      </div>

      {/* ====================================================
          MOBILE NAVIGATION MENU
         ==================================================== */}

      {mobileOpen && (
        <div
          id="public-mobile-menu"
          className="
            absolute
            left-0
            right-0
            top-full
            max-h-[calc(100dvh-4.75rem)]
            overflow-y-auto
            overscroll-contain
            border-t
            border-[#e1e9f5]
            bg-white
            px-[3vw]
            pb-6
            pt-3
            shadow-xl
            lg:hidden
          "
        >

          <div className="mx-auto w-full max-w-[96rem] space-y-5">

            {/* MOBILE NAVIGATION GROUPS */}

            {navGroups.map((group) => (
              <div key={group.title}>

                <h2
                  className="
                    mb-2
                    px-4
                    text-xs
                    font-extrabold
                    uppercase
                    tracking-wider
                    text-[#70809b]
                  "
                >
                  {group.title}
                </h2>

                <div className="space-y-1">

                  {group.links.map((item) => (
                    <Link
                      key={`${group.title}-${item.label}`}
                      href={item.href}
                      onClick={closeMenus}
                      className="
                        block
                        rounded-lg
                        px-4
                        py-3
                        text-sm
                        font-medium
                        text-[#1d304b]
                        transition
                        hover:bg-[#edf5ff]
                      "
                    >
                      {item.label}
                    </Link>
                  ))}

                </div>

              </div>
            ))}

            {/* MOBILE GET STARTED */}

            <Link
              href="/signup"
              onClick={closeMenus}
              className="
                flex
                min-h-12
                items-center
                justify-center
                rounded-lg
                bg-[#086df2]
                px-5
                py-3
                text-sm
                font-bold
                text-white
              "
            >
              Get Started
            </Link>

          </div>

        </div>
      )}

    </nav>
  );
}

// ============================================================
// PUBLIC NAVIGATION WRAPPER
//
// Resets menu state automatically when the pathname changes.
// This avoids the React set-state-in-effect lint error.
// ============================================================

export default function PublicNav() {
  const pathname = usePathname();

  return <PublicNavContent key={pathname} />;
}