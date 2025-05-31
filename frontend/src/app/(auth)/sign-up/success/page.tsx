import Greeting from "@/components/Greeting";
import { Logo } from "@/components/Logo";
import { createUser } from "@/lib/api/users";
import { waitFor } from "@/lib/helper/waitFor";
import { auth } from "@clerk/nextjs/server";
import { Separator } from "@radix-ui/react-dropdown-menu";

export const dynamic = "force-dynamic";

export default async function SignUpSuccessPage() {
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "backend_template" });

  if (!userId || !token) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
          <Logo iconSize={50} fontSize="text-3xl"/>
          <Separator className="max-w-xs"/>
          <div className="flex gap-2 items-center justify-center">
              <p className="text-muted-foreground">Please log in again.</p>
          </div>
      </div>
    )
  }
  console.log("Creating user with token:", token);
  const user = await createUser(token).catch((error) => {
    console.error("Error creating user:", error);
    return null;
  });

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <Logo iconSize={50} fontSize="text-3xl" />
        <Separator className="max-w-xs" />
        <div className="flex gap-2 items-center justify-center">
          <p className="text-muted-foreground">
            Something went wrong, try to again.
          </p>
        </div>
      </div>
    );
  }

  const greetingName = user.username ?? `${user.firstName} ${user.lastName}`;
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
      <Logo iconSize={50} fontSize="text-3xl" />
      <Separator className="max-w-xs" />
      <Greeting welcomeMessage={`Welcome, ${greetingName}!`} delayMs={2000} />
    </div>
  );
}
