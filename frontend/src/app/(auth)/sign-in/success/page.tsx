"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/api/users";

export default function SignInSuccessPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {(async () => {
        const retrievedToken = await getToken( {template: "backend_template"});
        setToken(retrievedToken);
    })();
  }, [getToken]);

  useEffect(() => {
    const getUserAndRedirect = async () => {
      if (!token) return;
      try {
        await getUser(token);
        router.push("/dashboard");
      } catch (error) {
        router.push("/sign-up");
      }
    }
    getUserAndRedirect();
  }, [token]);

  return (
    <div className="flex flex-col items-center mt-20">
      <h2 className="text-xl">Verifying your account</h2>
      <p className="text-sm">Please wait...</p>
    </div>
  );
}
