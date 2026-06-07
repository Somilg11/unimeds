import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "patient" | "doctor" | "clinic_admin" | "super_admin";
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: "patient" | "doctor" | "clinic_admin" | "super_admin";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "patient" | "doctor" | "clinic_admin" | "super_admin";
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role || "patient";
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const userRole = (user as { role?: string }).role;
        token.role = (userRole === "patient" || userRole === "doctor" || userRole === "clinic_admin" || userRole === "super_admin")
          ? userRole
          : "patient";
      }
      return token;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
});
