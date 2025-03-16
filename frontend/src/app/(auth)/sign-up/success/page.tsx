"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/api/users";

export default function SignUpSuccessPage() {
  const router = useRouter();
  const { getToken } = useAuth();

  useEffect(() => {
    const createUserAndRedirect = async () => {
      const token = await getToken( {template: "backend_template"});
      if (token) {
        await createUser(token);
        router.push("/dashboard");
      }
    };
    createUserAndRedirect();
  }, [getToken]);

  return (
    <div className="flex flex-col items-center mt-20">
      <h2 className="text-xl">Finishing up your account...</h2>
      <p className="text-sm">Please wait.</p>
    </div>
  );
}
