import Link from "next/link";
import Image from "next/image";
import LogoutButton from "./LogoutButton";

interface MasterLayoutProps {
  children: React.ReactNode;
}

export default function MasterLayout({ children }: MasterLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-200 shadow-sm sticky top-0 z-50 py-4 sm:py-5">
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

          <div className="flex items-center gap-6">
            <Link href="/master" className="hover:text-blue-600">
              Dashboard
            </Link>
            <Link href="/master/companies" className="hover:text-blue-600">
              Companies
            </Link>
            <Link href="/master/users" className="hover:text-blue-600">
              Users
            </Link>
            <Link href="/master/templates" className="hover:text-blue-600">
              Templates
            </Link>
            <Link href="/master/settings" className="hover:text-blue-600">
              Settings
            </Link>

            {/* Client-side logout button */}
            <LogoutButton />
          </div>
        </div>
      </nav>

      <main className="flex-1">{children}</main>
    </div>
  );
}
