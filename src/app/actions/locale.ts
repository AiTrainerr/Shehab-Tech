"use server"

import { cookies } from "next/headers";
import { Locale } from "@/lib/i18n/types";

export async function setLocaleAction(locale: Locale) {
  const cookieStore = await cookies();
  cookieStore.set("app_locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  });
  return { success: true, locale };
}
