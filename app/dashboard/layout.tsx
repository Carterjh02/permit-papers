import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAV BAR */}
      <nav className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-900">
            Permit Papers
          </Link>

          <div className="flex items-center gap-6">
            {/* MASTER NAV */}
            {user.role === "master" && (
              <>
                <Link href="/master" className="hover:text-blue-600">
                  Dashboard
                </Link>
                <Link href="/master/companies" className="hover:text-blue-600">
                  Companies
                </Link>
                <Link href="/master/users" className="hover:text-blue-600">
                  Users
                </Link>
                <Link href="/master/settings" className="hover:text-blue-600">
                  Settings
                </Link>
              </>
            )}

            {/* ADMIN NAV */}
            {user.role === "admin" && (
              <>
                <Link href="/dashboard" className="hover:text-blue-600">
                  Dashboard
                </Link>
                <Link href="/dashboard/company" className="hover:text-blue-600">
                  Company
                </Link>
                <Link href="/dashboard/users" className="hover:text-blue-600">
                  Users
                </Link>
              </>
            )}

            {/* USER NAV */}
            {user.role === "user" && (
              <>
                <Link href="/dashboard" className="hover:text-blue-600">
                  Dashboard
                </Link>
              </>
            )}

            <form action="/api/auth/signout" method="POST">
              <button className="btn btn-secondary">Logout</button>
            </form>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
