import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const role: string | undefined =
    user?.app_metadata?.role ?? user?.user_metadata?.role;

  // Protected route prefixes
  const isStudentRoute = pathname.startsWith("/student");
  const isConsultantRoute = pathname.startsWith("/consultant");
  const isAdminRoute = pathname.startsWith("/admin");
  const isProtected = isStudentRoute || isConsultantRoute || isAdminRoute;

  // Redirect unauthenticated users to login
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Role-based redirects
  if (isStudentRoute && user && role && role !== "student") {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
  }
  if (isConsultantRoute && user && role && role !== "consultant") {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
  }
  if (isAdminRoute && user && role && role !== "admin") {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
  }

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith("/auth") && user) {
    const dest = role ? `/${role}/dashboard` : "/student/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
