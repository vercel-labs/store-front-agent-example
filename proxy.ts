import { NextResponse, type NextRequest } from "next/server";

// Until DATABASE_URL exists, every page shows the setup instructions instead of
// trying to query a database that isn't there.
export function proxy(request: NextRequest) {
  if (!process.env.DATABASE_URL && request.nextUrl.pathname !== "/setup") {
    return NextResponse.rewrite(new URL("/setup", request.url));
  }
}

export const config = {
  matcher: ["/((?!_next|api|eve|favicon.ico|products/.*\\.svg).*)"],
};
