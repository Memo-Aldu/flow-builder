"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface GreetingScreenProps {
  welcomeMessage: string;
  delayMs?: number;
}
const Greeting = ({ welcomeMessage, delayMs = 2000 }: GreetingScreenProps) => {
    const router = useRouter();

    useEffect(() => {
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, delayMs);
  
      return () => clearTimeout(timer);
    }, [delayMs, router]);
  
    return (
      <div className="flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">{welcomeMessage}</p>
        <p className="text-sm">Redirecting to Dashboard shortly...</p>
      </div>
    );
  }

export default Greeting