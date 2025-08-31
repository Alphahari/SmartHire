  import NextAuth, { type NextAuthOptions } from "next-auth";
  import GithubProvider from "next-auth/providers/github";
  import GoogleProvider from "next-auth/providers/google";
  import CredentialsProvider from "next-auth/providers/credentials";

  export const authOptions: NextAuthOptions = {
    providers: [
      GithubProvider({
        clientId: process.env.GITHUB_ID as string,
        clientSecret: process.env.GITHUB_SECRET as string,
      }),
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      }),
      CredentialsProvider({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        async authorize(credentials, req) {
          try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(credentials),
              credentials: 'include'
            });

            const data = await res.json();

            if (res.ok && data) {
              return data.user;
            }
            return null;
          } catch (error) {
            console.error("Authorization error:", error);
            return null;
          }
        }
      })
    ],
    pages: {
      signIn: '/login'
    },
    session: { strategy: "jwt" },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.role = user.role ?? "user";
          token.access_token = user.access_token;
        }
        return token;
      },
      async session({ session, token }) {
        if (token) {
          session.user.role = token.role;
        }
        return session;
      }
    }
  };

  const handler = NextAuth(authOptions);
  export { handler as GET, handler as POST };