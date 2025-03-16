"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/api/users";

export default function SignInSuccessPage() {
  const router = useRouter();
  const { getToken } = useAuth();


  useEffect(() => {
    const getUserAndRedirect = async () => {
      const token = await getToken( {template: "backend_template"});
      if (!token) return;
      try {
        await getUser(token);
        router.push("/dashboard");
      } catch (error) {
        router.push("/sign-up");
      }
    }
    getUserAndRedirect();
  }, [getToken]);

  return (
    <div className="flex flex-col items-center mt-20">
      <h2 className="text-xl">Verifying your account</h2>
      <p className="text-sm">Please wait...</p>
    </div>
  );
}
