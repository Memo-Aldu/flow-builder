import Greeting from "@/components/Greeting";
import { Logo } from "@/components/Logo";
import { Separator } from "@/components/ui/separator";
import { getUser } from "@/lib/api/users";
import { auth } from "@clerk/nextjs/server";

export default async function SignInSuccessPage() {
  const { userId, getToken } = await auth();
  const token = await getToken({ template: "backend_template" });

  if (!userId || !token) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <Logo iconSize={50} fontSize="text-3xl" />
        <Separator className="max-w-xs" />
        <div className="flex gap-2 items-center justify-center">
          <p className="text-muted-foreground">
            Something went wrong, try to login again.
          </p>
        </div>
      </div>
    );
  }

  const user = await getUser(token).catch((error) => {
    return null;
  });

  if (!user) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center gap-4">
        <Logo iconSize={50} fontSize="text-3xl" />
        <Separator className="max-w-xs" />
        <div className="flex gap-2 items-center justify-center">
          <p className="text-muted-foreground">
            Something went wrong, try to login again.
          </p>
        </div>
      </div>
    );
  }

  const greetingName = user.username ?? `${user.firstName} ${user.lastName}`;

  return (
    <>
      <Logo iconSize={50} fontSize="text-3xl" />
      <Separator className="max-w-xs" />
      <Greeting welcomeMessage={`Welcome back, ${greetingName}!`} delayMs={2000} />
    </>
  );
}
