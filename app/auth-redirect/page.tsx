"use client";

// Prevent ALL SSR and ALL prerendering
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const runtime = "edge";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AuthRedirectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    if (session.user.role === "master") {
      router.replace("/master");
      return;
    }

    router.replace("/dashboard");
  }, [session, status, router]);

  return null;
}
