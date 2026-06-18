import type { Metadata } from "next";
import { Tajawal } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { createClientServer } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

const tajawal = Tajawal({
  subsets: ["latin", "arabic"],
  weight: ["300", "400", "500", "700", "800", "900"],
  variable: "--font-tajawal",
});

export const metadata: Metadata = {
  title: {
    default: "SHEHAB TECH | AI Data Collection & Freelance Platform",
    template: "%s | SHEHAB TECH"
  },
  description: "Join SHEHAB TECH, the leading platform for AI data collection, voice recording, and annotation. Earn money as a freelancer by contributing to the future of AI.",
  keywords: ["AI data collection", "freelance arabic", "voice recording tasks", "data annotation", "work from home egypt", "shehab tech"],
  authors: [{ name: "SHEHAB TECH Team" }],
  creator: "SHEHAB TECH",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://shehab-tech.com",
    title: "SHEHAB TECH | AI Data Collection & Freelance",
    description: "Earn money through AI training tasks. Join thousands of freelancers at SHEHAB TECH.",
    siteName: "SHEHAB TECH",
  },
  twitter: {
    card: "summary_large_image",
    title: "SHEHAB TECH | AI Data Collection",
    description: "Start your freelance career in AI data collection today.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let currentUser: any = null;
  
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, avatarUrl: true, verificationStatus: true, firstName: true, lastName: true }
      });
      currentUser = dbUser;
    }
  } catch (e) {
    console.error("Layout auth error:", e);
  }

  return (
    <html lang="en" suppressHydrationWarning dir="ltr">
      <body className={`${tajawal.variable} font-sans min-h-screen flex flex-col antialiased bg-background text-foreground transition-colors duration-300`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar user={currentUser} />
          <main className="flex-grow pt-16">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
