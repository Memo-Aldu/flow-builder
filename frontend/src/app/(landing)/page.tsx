"use client";

import { Logo } from "@/components/Logo";
import { ModeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useUnifiedAuth } from "@/contexts/AuthContext";
import { CreditsPackages } from "@/types/billing";
import {
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  ArrowRight,
  Bot,
  CheckCircle,
  Clock,
  Code2,
  CreditCard,
  ExternalLink,
  GithubIcon,
  Globe,
  Layers3,
  LayoutDashboard,
  MousePointer,
  Play,
  Repeat,
  Rocket,
  Settings,
  ShieldCheck,
  Star,
  Target,
  Zap
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function LandingPage() {
  const { user: clerkUser } = useUser();
  const { createGuestAccount, isLoading } = useUnifiedAuth();
  const router = useRouter();
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);

  const handleStartFreeTrial = () => {
    if (clerkUser) {
      router.push("/dashboard");
    } else {
      router.push("/sign-up");
    }
  };

  const handleTryAsGuest = async () => {
    try {
      setIsCreatingGuest(true);
      await createGuestAccount();
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to create guest account:", error);
      // Still redirect to dashboard - the auth context will handle the error
      router.push("/dashboard");
    } finally {
      setIsCreatingGuest(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
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
              <Link href="/sign-in">
                <Button size="sm">Sign in</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm" variant="secondary">
                  Create account
                </Button>
              </Link>
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

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 sm:py-32 lg:py-40">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-background to-cyan-50/30 dark:from-blue-950/20 dark:via-background dark:to-cyan-950/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_70%_80%,rgba(6,182,212,0.05),transparent_50%)]" />

        <div className="container relative z-10 text-center flex flex-col items-center gap-8">
          {/* Badge */}
          <Badge variant="secondary" className="px-4 py-2 text-sm font-medium bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800">
            <Rocket className="w-4 h-4 mr-2" />
            No-code automation platform
          </Badge>

          {/* Main Headline */}
          <h1 className="text-5xl/tight sm:text-7xl/tight font-extrabold max-w-5xl">
            Build Powerful{" "}
            <span className="bg-gradient-to-r from-blue-500 via-blue-600 to-cyan-500 bg-clip-text text-transparent">
              Web Scraping
            </span>{" "}
            Workflows
          </h1>

          {/* Subheadline */}
          <p className="max-w-2xl text-xl text-muted-foreground leading-relaxed">
            Create, automate, and scale your web scraping projects with ease. No coding required.
            Design complex workflows visually, schedule them, and pay only for what you use.
          </p>

          {/* Key Benefits */}
          <div className="flex flex-wrap justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No Coding Required</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-500" />
              <span>Visual Workflow Builder</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span>Schedule & Automate</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            {clerkUser ? (
              <Link href="/dashboard">
                <Button size="lg" className="px-8 py-6 text-lg font-semibold">
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Button
                  size="lg"
                  className="px-8 py-6 text-lg font-semibold"
                  onClick={handleStartFreeTrial}
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Free Trial
                </Button>

                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 text-lg font-semibold border-blue-300 text-blue-700 hover:bg-blue-50"
                  onClick={handleTryAsGuest}
                  disabled={isCreatingGuest}
                >
                  {isCreatingGuest ? (
                    <>
                      <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      Try as Guest
                    </>
                  )}
                </Button>
              </>
            )}
          </div>

          {/* Trust indicators */}
          <p className="text-sm text-muted-foreground mt-4">
            <CheckCircle className="w-4 h-4 inline mr-2 text-green-500" />
            Free 200 credits • Try as guest • No credit card required
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-muted/30 border-y">
        <div className="container space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">
              How <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">It Works</span>
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
              From idea to automation in minutes. Our visual workflow builder makes web scraping accessible to everyone.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {howItWorksSteps.map((step, index) => (
              <Card key={step.title} className="relative bg-background/60 backdrop-blur-sm border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4">
                    <step.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-500 text-white text-sm font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  <CardTitle className="text-xl font-bold">{step.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Link href="/sign-up">
              <Button size="lg" className="px-8 py-4">
                <ArrowRight className="w-5 h-5 mr-2" />
                Start Your First Workflow
              </Button>
              </Link>
          </div>
        </div>
      </section>

      {/* ---------------- Scraping Features ---------------- */}
      <section id="features" className="container py-20 flex flex-col gap-16">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-extrabold tracking-tight">
            Powerful <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Scraping Features</span>
          </h2>
          <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
            Everything you need to extract data from any website, handle complex scenarios, and scale your operations.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {scrapingFeatures.map((feature) => (
            <Card key={feature.title} className="group relative bg-gradient-to-br from-background to-muted/30 border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:shadow-xl hover:-translate-y-2">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ---------------- Core Features ---------------- */}
      <section className="py-20 bg-muted/30">
        <div className="container space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">
              Complete <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Workflow Management</span>
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
              From design to deployment, manage your entire automation lifecycle with enterprise-grade tools.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {coreFeatures.map((feature) => (
              <Card key={feature.title} className="bg-background/60 backdrop-blur-sm border-2 hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center gap-4 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 text-blue-600 dark:text-blue-400">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg font-bold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-blue-50/50 via-background to-cyan-50/50 dark:from-blue-950/20 dark:via-background dark:to-cyan-950/20">
        <div className="container space-y-16 text-center">
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold tracking-tight">
              Simple <span className="bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent">Pricing</span>
            </h2>
            <p className="max-w-2xl mx-auto text-xl text-muted-foreground">
              Pay only for what you use. No monthly subscriptions, no hidden fees. Start free and scale as you grow.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
            {CreditsPackages.map((pkg, index) => {
              const estRuns = Math.floor(pkg.credits / 30);
              const isPopular = index === 1;
              return (
                <Card
                  key={pkg.id}
                  className={`relative flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                    isPopular
                      ? "border-2 border-blue-500 shadow-xl scale-105"
                      : "border-2 hover:border-blue-200 dark:hover:border-blue-800"
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-1">
                        <Star className="w-4 h-4 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl font-bold">{pkg.name}</CardTitle>
                    <div className="text-5xl font-extrabold text-blue-600 dark:text-blue-400">
                      {pkg.credits.toLocaleString()}
                      <span className="block text-lg font-semibold text-muted-foreground mt-2">
                        credits
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="flex flex-1 flex-col gap-6">
                    <div className="space-y-2">
                      <div className="text-3xl font-bold">
                        {(pkg.price / 100).toLocaleString(undefined, {
                          style: "currency",
                          currency: "USD",
                        })}
                      </div>
                      <p className="text-muted-foreground">
                        ≈ {estRuns.toLocaleString()} workflow runs
                      </p>
                    </div>

                    <div className="space-y-3 text-left">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">No expiration</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">All features included</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm">24/7 support</span>
                      </div>
                    </div>

                    <Link href="/sign-up">
                      <Button
                        className={`mt-auto w-full py-6 text-lg font-semibold ${
                          isPopular
                            ? "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                            : ""
                        }`}
                      >
                        Get {pkg.name}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center space-y-4">
            <p className="text-muted-foreground">
              Need some help? <Link href="mailto:aldu.memo@gmail.com" className="text-blue-600 hover:underline">Contact us</Link>.
            </p>
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
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
            <Button size="icon" variant="ghost" asChild>
              <Link href="https://github.com/Memo-Aldu/flow-builder" target="_blank">
                <GithubIcon className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </footer>
    </main>
  );
}

// How It Works Steps
const howItWorksSteps = [
  {
    title: "Design Your Workflow",
    description: "Use our intuitive drag-and-drop interface to build complex automation workflows without writing a single line of code.",
    icon: MousePointer,
  },
  {
    title: "Configure & Test",
    description: "Set up your data extraction rules, add conditions, and test your workflow in real-time to ensure perfect results.",
    icon: Settings,
  },
  {
    title: "Schedule & Deploy",
    description: "Deploy your workflow to the cloud and schedule it to run automatically at your preferred intervals.",
    icon: Clock,
  },
  {
    title: "Monitor & Scale",
    description: "Track performance, monitor results, and scale your operations as your data needs grow.",
    icon: Target,
  },
] as const;

// Scraping Features
const scrapingFeatures = [
  {
    title: "Launch Browser",
    description: "Initiate a browser instance to begin the web scraping process, enabling interaction with web pages.",
    icon: Globe,
  },
  {
    title: "Page to HTML",
    description: "Extract the complete HTML content of the current page for detailed analysis and processing.",
    icon: Code2,
  },
  {
    title: "Extract Text from Element",
    description: "Retrieve the text content from a specified HTML element using a given CSS selector.",
    icon: Target,
  },
  {
    title: "Fill Input",
    description: "Automatically fill a specified input field with a desired value, emulating user input.",
    icon: Bot,
  },
  {
    title: "Click Element",
    description: "Simulate a click action on a specified HTML element, triggering any associated events or navigation.",
    icon: MousePointer,
  },
  {
    title: "Navigate to URL",
    description: "Navigate to a specified URL, loading the desired web page for scraping or interaction.",
    icon: Globe,
  },
] as const;

// Core Features
const coreFeatures = [
  {
    title: "Command Center Dashboard",
    description: "Track executions, credit spend and success rates at a glance with comprehensive analytics.",
    icon: LayoutDashboard,
  },
  {
    title: "Visual Workflow Designer",
    description: "Drag‑and‑drop nodes, connect them and test instantly with our intuitive interface.",
    icon: Zap,
  },
  {
    title: "Versioning & Rollback",
    description: "Iterate with confidence, compare versions and revert in one click for safe deployments.",
    icon: Repeat,
  },
  {
    title: "Execution History",
    description: "Inspect every run, logs and phase credits in real‑time with detailed monitoring.",
    icon: Layers3,
  },
  {
    title: "Secure Credential Vault",
    description: "Store API keys encrypted with enterprise-grade security. We never display them again.",
    icon: ShieldCheck,
  },
  {
    title: "Pay‑as‑you‑go Billing",
    description: "Buy credits with Stripe. No monthly lock‑in, pay only for what you use.",
    icon: CreditCard,
  },
] as const;