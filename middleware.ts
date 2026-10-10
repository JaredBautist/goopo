import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PROTECTED_PREFIXES = ["/mi-cuenta", "/mis-pronosticos", "/billetera", "/notificaciones"];
const ADMIN_PREFIXES = ["/admin"];
const SESSION_COOKIE = "goopo_session";

/**
 * Secreto de verificación en Edge. Debe coincidir con el de firma.
 * Si no hay AUTH_SECRET usamos el demo (misma lógica que src/lib/secret.ts).
 */
function getKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ?? "goopo-demo-secret-do-not-use-in-production-1234567890";
  return new TextEncoder().encode(secret);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;

  let role: string | null = null;
  let hasSession = false;
  if (token) {
    try {
      const { payload } = await jwtVerify(token, getKey(), { issuer: "goopo" });
      hasSession = true;
      role = typeof payload.role === "string" ? payload.role : null;
    } catch {
      hasSession = false;
    }
  }

  const needsSession = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const needsAdmin = ADMIN_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsAdmin) {
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/ingresar";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (needsSession && !hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/ingresar";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/mi-cuenta/:path*",
    "/mis-pronosticos/:path*",
    "/billetera/:path*",
    "/notificaciones/:path*",
    "/admin/:path*",
  ],
};
