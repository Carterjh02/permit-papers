import "./styles/home.css";
import "../globals.css";

import PublicNav from "./PublicNav";
import PublicFooter from "./PublicFooter";

// ============================================================
// SHARED PUBLIC LAYOUT
//
// Used by all public-facing pages:
//
// - Homepage
// - Demo
// - Help Center
// - Contact
// - Other public pages
//
// Navigation and footer are shared across all pages.
// ============================================================

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">

      {/* ======================================================
          FIXED NAVIGATION

          The navigation remains visible at the top of the
          viewport regardless of the user's scroll position.
         ====================================================== */}

      <header className="fixed inset-x-0 top-0 z-[100] w-full">

        <PublicNav />

      </header>

      {/* ======================================================
          NAVIGATION SPACER

          Fixed elements are removed from normal document flow.

          This spacer prevents the navigation bar from
          overlapping the top of the page content.

          Height matches the navigation's 4.75rem height.
         ====================================================== */}

      <div
        className="h-[4.75rem] shrink-0"
        aria-hidden="true"
      />

      {/* ======================================================
          PUBLIC PAGE CONTENT

          Existing public pages retain their content styling.

          Pages using our new full-width design can override
          the public-content container as they currently do.
         ====================================================== */}

      <div className="public-shell flex-1">

        <main className="public-content">

          {children}

        </main>

      </div>

      {/* ======================================================
          SHARED FOOTER

          Appears beneath every public-facing page.

          Keeping the footer outside the public-shell
          ensures that it always spans the full width
          of the browser window.
         ====================================================== */}

      <PublicFooter />

    </div>
  );
}