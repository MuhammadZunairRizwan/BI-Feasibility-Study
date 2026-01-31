import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // For Firebase Auth, we handle authentication on the client side
  // This middleware just ensures the dashboard routes exist
  // The actual auth check happens in the page components
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
