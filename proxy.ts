import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  // Clerk builds the base policy with the active Frontend API host. These
  // additions cover Zayna's remote images, CMI form navigation, and Clerk's
  // current bot/fraud protection hosts without forcing dynamic rendering.
  contentSecurityPolicy: {
    directives: {
      "base-uri": ["'self'"],
      "connect-src": [
        "https://clerk-telemetry.com",
        "https://*.clerk-telemetry.com",
        "https://img.clerk.com",
        "https://*.protect.clerk.com:*",
      ],
      "form-action": ["'self'", "https://payment.cmi.co.ma"],
      "frame-ancestors": ["'none'"],
      "frame-src": [
        "https://challenges.cloudflare.com",
        "https://*.protect.clerk.com",
      ],
      "img-src": [
        "'self'",
        "data:",
        "blob:",
        "https://img.clerk.com",
        "https://cdn.shopify.com",
        "https://*.cloudinary.com",
        "https://*.supabase.co",
        "https://*.amazonaws.com",
        "https://*.blob.vercel-storage.com",
      ],
      "object-src": ["'none'"],
      "script-src": [
        "https://challenges.cloudflare.com",
        "https://*.protect.clerk.com",
      ],
      "worker-src": ["'self'", "blob:"],
    },
  },
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
    // Always run for Clerk's optional Frontend API proxy routes.
    "/__clerk/(.*)",
  ],
};
