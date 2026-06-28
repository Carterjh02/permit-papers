import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login", // ✔ Correct login page
  },

  session: {
    strategy: "jwt",
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

        // 1. Find user
        const dbUser = await prisma.user.findUnique({
          where: { username },
        });

        if (!dbUser) return null;

        // 2. Validate password
        const valid = await bcrypt.compare(password, dbUser.passwordHash);
        if (!valid) return null;

        // Normalize role
        const role = dbUser.role.toLowerCase() as "user" | "admin" | "master";

        // 3. Master users do NOT need a company
        if (role === "master") {
          return {
            id: dbUser.id,
            username: dbUser.username,
            role,
            companyId: null,
            activeCompanyId: null,
          };
        }

        // 4. Non-master users MUST provide a company code
        if (!company || company.trim() === "") {
          throw new Error("Company code is required.");
        }

        // 5. Look up company by companyCode
        const companyRecord = await prisma.company.findFirst({
          where: {
            companyCode: { equals: company.trim(), mode: "insensitive" },
          },
        });

        if (!companyRecord) {
          throw new Error("Company not found.");
        }

        // 6. Ensure user belongs to that company
        if (dbUser.companyId !== companyRecord.id) {
          throw new Error("Incorrect company for this user.");
        }

        // 7. Success
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

    // ✔ FIX: Ensure NextAuth redirects to a valid route after login
    async redirect({ url, baseUrl }) {
      // If NextAuth tries to send user to /api/auth/signin or something invalid → send to dashboard
      if (url.startsWith("/")) return `${baseUrl}${url}`;

      // If NextAuth tries to redirect to an external URL → block it
      if (!url.startsWith(baseUrl)) return baseUrl;

      return url;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
