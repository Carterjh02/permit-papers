import Link from "next/link";
import Image from "next/image";
import LogoutButton from "./LogoutButton";
import "./master.css";

interface MasterLayoutProps {
  children: React.ReactNode;
}

export default function MasterLayout({ children }: MasterLayoutProps) {
  return (
    <div
      className="master-root min-h-screen flex flex-col"
      data-theme="dark"
      data-font="inter"
      data-density="comfortable"
    >
      <nav className="bg-[var(--nav-bg)] border-b border-[var(--border-color)] shadow-sm sticky top-0 z-50 py-4 sm:py-5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/logos/logo-permitpapers-plain.png"
              alt="Permit Papers"
              width={320}
              height={85}
              className="h-20 w-auto sm:h-16"
              priority
            />
          </Link>

          <div className="flex items-center gap-6 text-[var(--text-color)]">
            <Link href="/master" className="hover:text-[var(--accent-color)]">Dashboard</Link>
            <Link href="/master/companies" className="hover:text-[var(--accent-color)]">Companies</Link>
            <Link href="/master/users" className="hover:text-[var(--accent-color)]">Users</Link>
            <Link href="/master/templates" className="hover:text-[var(--accent-color)]">Templates</Link>
            <Link href="/master/settings" className="hover:text-[var(--accent-color)]">Settings</Link>

            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="flex-1 bg-[var(--page-bg)] text-[var(--text-color)]">
        {children}
      </main>
    </div>
  );
}
