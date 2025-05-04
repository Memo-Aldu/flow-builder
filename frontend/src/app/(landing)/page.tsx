"use client";

import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  CreditCard,
  Github,
  Layers3,
  LayoutDashboard,
  Linkedin,
  Repeat,
  ShieldCheck,
  Zap
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import { ModeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditsPackages } from "@/types/billing";

export default function LandingPage() {
  const { isSignedIn } = useUser();
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ---------------- Header ---------------- */}
      <header className="w-full border-b sticky top-0 z-20 bg-background/70 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between">
          <Logo fontSize="text-xl" iconSize={18} />
          <nav className="flex items-center gap-4">
            {[
              { href: "#features", label: "Features" },
              { href: "#pricing", label: "Pricing" },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-medium hover:underline"
              >
                {label}
              </Link>
            ))}
            <ModeToggle />
            <SignedOut>
              <SignInButton mode="modal" forceRedirectUrl={"/dashboard"}>
                <Button size="sm">Sign in</Button>
              </SignInButton>
              <SignUpButton mode="modal" forceRedirectUrl={"/dashboard"}>
                <Button size="sm" variant="secondary">
                  Create account
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link href="/dashboard">
                <Button className="" size="sm">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </nav>
        </div>
      </header>

      <section className="relative overflow-hidden pb-24 sm:py-32">
        <div className="container relative z-10 text-center flex flex-col items-center gap-6">
          <h1 className="text-4xl/tight sm:text-6xl/tight font-extrabold max-w-3xl">
            Automate anything with{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              FlowBuilder
            </span>
          </h1>
          <p className="max-w-xl text-muted-foreground">
            Design complex browser automation and data‑extraction workflows visually,
            schedule them, version them, and pay only for the credits you use.
          </p>
          {isSignedIn ? (
            <Link href="/dashboard">
              <Button size="lg">Go to your dashboard</Button>
            </Link>
          ) : (
            <SignUpButton mode="modal">
              <Button size="lg">Get started for free</Button>
            </SignUpButton>
          )}
        </div>
      </section>
      {/* ---------------- Feature grid ---------------- */}
      <section id="features" className="container pb-20 flex flex-col gap-12">
        <h2 className="text-center text-3xl font-bold">Everything you need</h2>
        <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-2">
          {features.map((f) => (
            <Card key={f.title} className="bg-secondary/40 backdrop-blur-md">
              <CardHeader className="flex flex-row items-center gap-3 pb-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <f.icon className="h-5 w-5" />
                </div>
                <CardTitle className="leading-none text-base font-semibold">
                  {f.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <p className="text-sm text-muted-foreground">
                  {f.description}
                </p>
                <FeatureScreenshot src={f.img} alt={f.title} />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      <section id="pricing" className="py-20 bg-muted/40 border-y">
        <div className="container space-y-14 text-center">
          <header className="space-y-3">
            <h2 className="text-4xl font-extrabold tracking-tight">
              Simple, usage‑based pricing
            </h2>
            <p className="max-w-xl mx-auto text-muted-foreground">
              Buy credits when you need them. No subscriptions or seat‑based plans.
            </p>
          </header>
          <div className="grid gap-8 md:grid-cols-3">
            {CreditsPackages.map((p) => {
              const estRuns = Math.floor(p.credits / 30);
              return (
                <Card
                  key={p.id}
                  className="flex flex-col shadow-lg/10 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xl">{p.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-6">
                    <div className="text-primary text-6xl font-extrabold leading-none">
                      {p.credits.toLocaleString()}
                      <span className="block text-lg tracking-wide font-semibold text-muted-foreground">
                        credits
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {(p.price / 100).toLocaleString(undefined, {
                        style: "currency",
                        currency: "USD",
                      })}{" "}
                      • ≈ {estRuns.toLocaleString()} workflow runs
                    </p>
                    <SignUpButton mode="modal">
                      <Button className="mt-auto w-full">Buy {p.name}</Button>
                    </SignUpButton>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      {/* ---------------- Footer ---------------- */}
      <footer className="">
        <Separator />
        <div className="container py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          {/* left */}
          <Logo fontSize="text-xl" iconSize={18} />
          {/* center links */}
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/#features" className="hover:text-foreground transition">
              Features
            </Link>
            <Link href="/#pricing" className="hover:text-foreground transition">
              Pricing
            </Link>
            <Link href="mailto:aldu.memo@gmail.com" className="hover:text-foreground transition">
              Support
            </Link>
          </nav>
          {/* right socials */}
          <div className="flex gap-2">
            <Button size="icon" variant="ghost" asChild>
              <Link href="https://www.linkedin.com/in/memo-aldu/" target="_blank">
                <Linkedin className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="icon" variant="ghost" asChild>
              <Link href="https://github.com/Memo-Aldu/flow-builder" target="_blank">
                <Github className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </main>
  );
}

const features = [
  {
    title: "Command center dashboard",
    description: "Track executions, credit spend and success rates at a glance.",
    icon: LayoutDashboard,
    img: "/img/feature-dashboard.png",
  },
  {
    title: "Visual workflow designer",
    description: "Drag‑and‑drop nodes, connect them and test instantly.",
    icon: Zap,
    img: "/img/feature-editor.png",
  },
  {
    title: "Versioning & rollback",
    description: "Iterate with confidence compare versions and revert in one click.",
    icon: Repeat,
    img: "/img/feature-versions.png",
  },
  {
    title: "Execution history",
    description: "Inspect every run, logs and phase credits in real‑time.",
    icon: Layers3,
    img: "/img/feature-runs.png",
  },
  {
    title: "Secure credential vault",
    description: "Store API keys encrypted. We never display them again.",
    icon: ShieldCheck,
    img: "/img/feature-credentials.png",
  },
  {
    title: "Pay‑as‑you‑go billing",
    description: "Buy credits with Stripe. No monthly lock‑in.",
    icon: CreditCard,
    img: "/img/feature-billing.png",
  },
] as const;

const FeatureScreenshot = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <div className="relative w-full aspect-video rounded-md overflow-hidden border bg-slate-900 dark:bg-background ring-1 ring-border/20">
      <Image
        src={src}
        alt={alt}
        fill
        quality={90}
        sizes="(max-width: 768px) 100vw, 33vw"
        className="object-contain"
        priority
      />
    </div>
  );
}