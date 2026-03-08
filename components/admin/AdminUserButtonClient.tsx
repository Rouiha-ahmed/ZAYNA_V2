"use client";

import { ClerkLoaded, SignedIn, UserButton } from "@clerk/nextjs";

export default function AdminUserButtonClient() {
  return (
    <ClerkLoaded>
      <SignedIn>
        <UserButton afterSignOutUrl="/" />
      </SignedIn>
    </ClerkLoaded>
  );
}
