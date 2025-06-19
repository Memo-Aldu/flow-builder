"use client";

import Greeting from "@/components/Greeting";
import { Logo } from "@/components/Logo";
import { useUnifiedAuth } from "@/contexts/AuthContext";
import { UnifiedUsersAPI } from "@/lib/api/unified-functions-client";
import { GuestSessionManager } from "@/lib/api/guest";
import { useAuth } from "@clerk/nextjs";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface User {
  id: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_guest?: boolean;
  credits?: number;
}

export function SignUpSuccessHandler() {
  const { userId, getToken } = useAuth();
  const { convertToUser, user: contextUser, isLoading: authLoading } = useUnifiedAuth();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSignUpSuccess = async () => {
      if (!userId) {
        setError("No user ID found. Please log in again.");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get Clerk token
        const token = await getToken({ template: "backend_template" });
        if (!token) {
          setError("No authentication token found. Please log in again.");
          setIsLoading(false);
          return;
        }

        // Check if there's a guest session to convert
        const guestSessionId = GuestSessionManager.getSessionId();
        
        if (guestSessionId && contextUser?.isGuest) {
          console.log("Converting guest user to regular user...");
          
          try {
            // Convert guest to regular user
            await convertToUser(token);
            
            // Fetch the converted user data
            const convertedUser = await UnifiedUsersAPI.client.getCurrent(token);
            setUser(convertedUser);
            
            console.log("Guest user converted successfully:", convertedUser);
          } catch (conversionError) {
            console.error("Failed to convert guest user:", conversionError);
            
            // If conversion fails, try creating a new user
            console.log("Fallback: Creating new user...");
            const newUser = await UnifiedUsersAPI.client.create(token);
            setUser(newUser);
          }
        } else {
          console.log("Creating new user...");
          
          // No guest session, create a new user
          const newUser = await UnifiedUsersAPI.client.create(token);
          setUser(newUser);
        }

        // Redirect to dashboard after a delay
        setTimeout(() => {
          router.push("/dashboard");
        }, 3000);

      } catch (err: any) {
        console.error("Error during sign-up success handling:", err);
        setError("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    handleSignUpSuccess();
  }, [userId, getToken, convertToUser, contextUser, router]);

  if (!userId) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <Logo iconSize={50} fontSize="text-3xl" />
        <Separator className="max-w-xs" />
        <div className="flex gap-2 items-center justify-center">
          <p className="text-muted-foreground">Please log in again.</p>
        </div>
      </div>
    );
  }

  if (isLoading || authLoading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <Logo iconSize={50} fontSize="text-3xl" />
        <Separator className="max-w-xs" />
        <div className="flex gap-2 items-center justify-center">
          <div className="w-6 h-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <Logo iconSize={50} fontSize="text-3xl" />
        <Separator className="max-w-xs" />
        <div className="flex gap-2 items-center justify-center">
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <Logo iconSize={50} fontSize="text-3xl" />
        <Separator className="max-w-xs" />
        <div className="flex gap-2 items-center justify-center">
          <p className="text-muted-foreground">Something went wrong, try again.</p>
        </div>
      </div>
    );
  }

  const greetingName = user.username ?? (`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'User');
  const wasGuestConverted = contextUser?.isGuest && !user.is_guest;
  
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
      <Logo iconSize={50} fontSize="text-3xl" />
      <Separator className="max-w-xs" />
      <Greeting 
        welcomeMessage={
          wasGuestConverted 
            ? `Welcome back, ${greetingName}! Your guest account has been upgraded.`
            : `Welcome, ${greetingName}!`
        } 
        delayMs={2000} 
      />
      {user.credits && (
        <p className="text-sm text-muted-foreground mt-2">
          You have {user.credits} credits to get started!
        </p>
      )}
    </div>
  );
}
