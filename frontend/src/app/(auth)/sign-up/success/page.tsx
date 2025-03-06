"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/api/users";

export default function SignUpSuccessPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  
  useEffect(() => {(async () => {
        const retrievedToken = await getToken( {template: "backend_template"});
        setToken(retrievedToken);
    })();
  }, [getToken]);

  useEffect(() => {
    const createUserAndRedirect = async () => {
      if (token) {
        await createUser(token);
        router.push("/dashboard");
      }
    };
    createUserAndRedirect();
  }, [token]);

  return (
    <div className="flex flex-col items-center mt-20">
      <h2 className="text-xl">Finishing up your account...</h2>
      <p className="text-sm">Please wait.</p>
    </div>
  );
}
