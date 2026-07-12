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

  debug: true,

  events: {
    async signIn(message) {
      console.log("🟢 [event:signIn]", message);
    },
    async signOut(message) {
      console.log("🟠 [event:signOut]", message);
    },
    async session(message) {
      console.log("🔵 [event:session]", message);
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
        console.log("🟡 [authorize] incoming credentials:", credentials);
        if (!credentials) { 
          console.log("🔴 [authorize] credentials missing");
          return null;
        }

        const { username, password, company } = credentials;

        const dbUser = await prisma.user.findUnique({
          where: { username },
        });
        console.log("🟡 [authorize] dbUser:", dbUser);

        if (!dbUser) {
          console.log("🔴 [authorize] user not found");
          return null;
        }

        const valid = await bcrypt.compare(password, dbUser.passwordHash);
        console.log("🟡 [authorize] password valid:", valid);

        if (!valid) {
          console.log("🔴 [authorize] invalid password");
          return null;
        }

        const role = dbUser.role.toLowerCase() as "user" | "admin" | "master";
        console.log("🟡 [authorize] role:", role);

        if (role === "master") {
          const result = {
            id: dbUser.id,
            username: dbUser.username,
            role,
            companyId: null,
            activeCompanyId: null,
          };
          console.log("🟢 [authorize] master result:", result);
          return result;
        }

        if (!company || company.trim() === "") {
          console.log("🔴 [authorize] missing company code");
          throw new Error("Company code is required.");
        }

        const companyRecord = await prisma.company.findFirst({
          where: {
            companyCode: { equals: company.trim(), mode: "insensitive" },
          },
        });
        console.log("🟡 [authorize] companyRecord:", companyRecord);

        if (!companyRecord) {
          console.log("🔴 [authorize] company not found");
          throw new Error("Company not found.");
        }

        if (dbUser.companyId !== companyRecord.id) {
          console.log("🔴 [authorize] company mismatch:", {
            userCompanyId: dbUser.companyId,
            recordCompanyId: companyRecord.id,
          });
          throw new Error("Incorrect company for this user.");
        }

        const result = {
          id: dbUser.id,
          username: dbUser.username,
          role,
          companyId: dbUser.companyId,
          activeCompanyId: dbUser.companyId,
        };
        console.log("🟢 [authorize] success result:", result);

        return result;
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      console.log("🟣 [jwt] before:", { token, user });

      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role as "user" | "admin" | "master";
        token.companyId = user.companyId;
        token.activeCompanyId = user.activeCompanyId;
      }

      console.log("🟣 [jwt] after:", token);
      return token;
    },

    async session({ session, token }) {
      console.log("🟢 [session] before:", { session, token });

      session.user = {
        id: token.id as string,
        username: token.username as string,
        role: token.role as "user" | "admin" | "master",
        companyId: token.companyId as string | null,
        activeCompanyId: token.activeCompanyId as string | null,
      };

      console.log("🟢 [session] after:", session);
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (!url.startsWith(baseUrl)) return baseUrl;
      return url;
    },
  },
};
