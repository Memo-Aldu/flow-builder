'use client';

import { SignedIn, UserButton, useUser } from '@clerk/nextjs'
import Link from "next/link";

export default function Home() {
  const { isSignedIn } = useUser();

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Welcome to the Workflow App!</h1>
      {isSignedIn ? (
        <div>
          <h2>You are signed in!</h2>
        <Link href="/dashboard">
          <button>Go to your Dashboard</button>
        </Link>
        <SignedIn>
          <UserButton />
        </SignedIn>
        </div>
      ) : (
        <Link href="/sign-in">
          <button>Sign In</button>
        </Link>
      )}
    </div>
  );
}
