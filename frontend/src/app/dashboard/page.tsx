'use client';

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/sign-in");
    }
  }, [isSignedIn, router]);

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="text-center mt-10">
      <h1 className="text-3xl font-bold">Welcome, {user?.firstName ?? "User"}!</h1>
      <p className="mt-4 text-lg">This is your dashboard.</p>
    </div>
  );
}
