import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "./api/auth/[...nextauth]/auth-options";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  // If session isn't ready yet, force login page
  if (!session?.user) {
    redirect("/login");
  }

  const role = session.user.role;

  if (role === "master") {
    redirect("/master");
  }

  // Admin + User → dashboard
  redirect("/dashboard");
}
