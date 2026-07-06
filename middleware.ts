import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    /**
     * If token exists → user is authenticated.
     * If token is missing → redirect to /login.
     */
    authorized: ({ token }) => {
      return !!token;
    },
  },
});

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/master/:path*",
  ],
};
