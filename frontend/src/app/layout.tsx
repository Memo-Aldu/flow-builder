import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import App from "next/app";
import { AppProvider } from "@/components/providers/AppProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Workflow App",
  description: "An app to manage your workflow",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl={"/"} appearance={{
      elements: {
        formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm !shadow-none",
      }
    }}>
      <html lang="en">
        <body  className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
          <AppProvider>
            <main>{children}</main>
          </AppProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
