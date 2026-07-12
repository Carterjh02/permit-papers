"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import type { Session } from "next-auth";

// Extend the user type to include JWT fields that NextAuth merges in
type DebugUser = Session["user"] & {
  jti?: string;
  companyId?: string | null;
  activeCompanyId?: string | null;
};

interface ClientDebugProps {
  serverSession: Session | null;
}

export default function ClientDebug({ serverSession }: ClientDebugProps) {
  const { data: clientSession, status } = useSession();

  const clientUser = clientSession?.user as DebugUser | undefined;
  const serverUser = serverSession?.user as DebugUser | undefined;

  useEffect(() => {
    console.group("🔵 CLIENT DEBUG OUTPUT");

    console.log("🌐 Current URL:", window.location.href);

    console.log("🍪 Browser Cookies:", document.cookie);

    console.log("🟢 Client Session Status:", status);
    console.log("🟢 Client Session:", clientSession);

    console.log("🔵 Server Session (prop):", serverSession);

    console.log("👤 Client User:", clientUser);
    console.log("👤 Server User:", serverUser);

    console.log("🏢 Client companyId:", clientUser?.companyId);
    console.log("🏢 Server companyId:", serverUser?.companyId);

    console.log("🏢 Client activeCompanyId:", clientUser?.activeCompanyId);
    console.log("🏢 Server activeCompanyId:", serverUser?.activeCompanyId);

    console.log("🔐 Client JWT jti:", clientUser?.jti);
    console.log("🔐 Server JWT jti:", serverUser?.jti);

    console.log("🧭 Hydration Check — Client sees session:", clientSession);
    console.log("🧭 Hydration Check — Server sees session:", serverSession);

    
    console.groupEnd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientSession, status, serverSession]);

  return null;
}
