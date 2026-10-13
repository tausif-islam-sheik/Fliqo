import { NextResponse, type NextRequest } from "next/server";

// Next 16: proxy.ts replaces middleware.ts.
// Guests (no refresh cookie) are sent to /login; authenticated users away from /login.
// Private pages carry X-Robots-Tag: noindex (search/checkout/account/admin).
const NOINDEX = ["/account", "/admin", "/login", "/signup", "/verify-email", "/2fa", "/flights/search", "/flights/booking", "/payment", "/mock-gateway"];

export default function proxy(req: NextRequest) {
  const rt = req.cookies.get("fliqo_rt")?.value;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/account") && !rt) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
  if ((pathname === "/login" || pathname === "/signup") && rt) {
    const url = req.nextUrl.clone();
    url.pathname = "/account";
    return NextResponse.redirect(url);
  }
  const res = NextResponse.next();
  if (NOINDEX.some((p) => pathname === p || pathname.startsWith(`${p}/`) || pathname.startsWith(p))) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*", "/login", "/signup", "/flights/:path*", "/payment/:path*", "/mock-gateway/:path*", "/verify-email", "/2fa"]
};
