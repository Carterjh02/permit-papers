import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 2, // 2 hours
  },

  jwt: {
    maxAge: 60 * 60 * 2,
  },

  // ⭐ CUSTOM COOKIE NAME — prevents NextAuth fallback cookies
  cookies: {
    sessionToken: {
      name: "__Secure-pp_session",
      options: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        domain: "www.permitpapers.com",
      },
    },
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        company: { label: "Company Code", type: "text" },
      },

      async authorize(credentials) {
        if (!credentials) return null;

        const { username, password, company } = credentials;

        const dbUser = await prisma.user.findUnique({
          where: { username },
        });

        if (!dbUser) return null;

        const valid = await bcrypt.compare(password, dbUser.passwordHash);
        if (!valid) return null;

        const role = dbUser.role.toLowerCase() as "user" | "admin" | "master";

        if (role === "master") {
          return {
            id: dbUser.id,
            username: dbUser.username,
            role,
            companyId: null,
            activeCompanyId: null,
          };
        }

        if (!company || company.trim() === "") {
          throw new Error("Company code is required.");
        }

        const companyRecord = await prisma.company.findFirst({
          where: {
            companyCode: { equals: company.trim(), mode: "insensitive" },
          },
        });

        if (!companyRecord) {
          throw new Error("Company not found.");
        }

        if (dbUser.companyId !== companyRecord.id) {
          throw new Error("Incorrect company for this user.");
        }

        return {
          id: dbUser.id,
          username: dbUser.username,
          role,
          companyId: dbUser.companyId,
          activeCompanyId: dbUser.companyId,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role as "user" | "admin" | "master";
        token.companyId = user.companyId;
        token.activeCompanyId = user.activeCompanyId;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        username: token.username as string,
        role: token.role as "user" | "admin" | "master",
        companyId: token.companyId as string | null,
        activeCompanyId: token.activeCompanyId as string | null,
      };
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (!url.startsWith(baseUrl)) return baseUrl;
      return url;
    },
  },
};
