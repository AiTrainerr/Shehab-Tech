import type { Metadata, Viewport } from "next";
import { Tajawal } from "next/font/google";
import { cookies, headers } from "next/headers";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import NextTopLoader from "nextjs-toploader";
import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PushNotificationManager } from "@/components/push-notification-manager";
import { SplashScreen } from "@/components/splash-screen";
import { LanguageProvider } from "@/lib/i18n/context";
import { Locale } from "@/lib/i18n/types";
import { createClientServer } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

export const viewport: Viewport = {
  themeColor: "#4f46e5",
  width: "device-width",
  initialScale: 1,
};

const tajawal = Tajawal({
  subsets: ["latin", "arabic"],
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "SHEHAB TECH | AI Data Collection & Freelance Platform",
    template: "%s | SHEHAB TECH"
  },
  description: "Join SHEHAB TECH, the leading platform for AI data collection, voice recording, and annotation. Earn money as a freelancer by contributing to the future of AI.",
  manifest: "/manifest",
  keywords: ["AI data collection", "freelance arabic", "voice recording tasks", "data annotation", "work from home egypt", "shehab tech"],
  authors: [{ name: "SHEHAB TECH Team" }],
  creator: "SHEHAB TECH",
  openGraph: {
    type: "website",
    locale: "ar_AR",
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
  let locale: Locale = "ar"; // Default Arabic as requested
  
  try {
    const cookieStore = await cookies();
    const rawLocale = cookieStore.get("app_locale")?.value;
    if (rawLocale === "en" || rawLocale === "ar") {
      locale = rawLocale;
    } else {
      // Fallback: detect from browser Accept-Language header
      const headerList = await headers();
      const acceptLanguage = headerList.get("accept-language") || "";
      if (acceptLanguage.toLowerCase().startsWith("en")) {
        locale = "en";
      } else {
        locale = "ar"; // Default Arabic
      }
    }

    const cookieUserId = cookieStore.get("userId")?.value;

    if (cookieUserId) {
      currentUser = await prisma.user.findUnique({
        where: { id: cookieUserId },
        select: { 
          id: true, 
          role: true, 
          avatarUrl: true, 
          verificationStatus: true, 
          firstName: true, 
          lastName: true,
          canReviewQC: true,
          canApproveApplications: true
        }
      });
    }

    if (!currentUser) {
      const supabase = await createClientServer();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        currentUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { 
            id: true, 
            role: true, 
            avatarUrl: true, 
            verificationStatus: true, 
            firstName: true, 
            lastName: true,
            canReviewQC: true,
            canApproveApplications: true
          }
        });
      }
    }
  } catch (e) {
    console.error("Layout auth error:", e);
  }

  const dir = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body className={`${tajawal.variable} font-sans min-h-screen flex flex-col antialiased bg-background text-foreground transition-colors duration-200`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LanguageProvider initialLocale={locale}>
            <Suspense fallback={null}>
              <NextTopLoader
                color="#4f46e5"
                initialPosition={0.08}
                crawlSpeed={200}
                height={3}
                crawl={true}
                showSpinner={false}
                easing="ease"
                speed={200}
                shadow="0 0 8px #4f46e5"
                zIndex={1600}
                showAtBottom={false}
              />
            </Suspense>
            <SplashScreen />
            <Navbar user={currentUser} />
            <main className="flex-grow pt-20">
              {children}
            </main>
            <Footer />
            <PWAInstallPrompt />
            <PushNotificationManager />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
