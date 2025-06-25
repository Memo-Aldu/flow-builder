import { AppProvider } from "@/components/providers/AppProvider";
import { Toaster } from "@/components/ui/sonner";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlowBuilder - Visual Workflow Automation Platform",
  description: "Create, manage, and automate your workflows with our powerful visual workflow builder. Build complex automation workflows with ease using our intuitive drag-and-drop interface.",
  keywords: ["workflow", "automation", "builder", "visual", "drag-and-drop", "business process", "no-code", "workflow management"],
  authors: [{ name: "Memo Al-dujaili" }],
  creator: "Memo Al-dujaili",
  publisher: "FlowBuilder",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://flow-builder.app",
    title: "FlowBuilder - Visual Workflow Automation Platform",
    description: "Create, manage, and automate your workflows with our powerful visual workflow builder. Build complex automation workflows with ease.",
    siteName: "FlowBuilder",
  },
  twitter: {
    card: "summary_large_image",
    title: "FlowBuilder - Visual Workflow Automation Platform",
    description: "Create, manage, and automate your workflows with our powerful visual workflow builder.",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      afterSignOutUrl={"/"}
      appearance={{
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm !shadow-none",
        },
      }}
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <AppProvider>
            <main>{children}</main>
            <Toaster richColors />
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  ); 
}
