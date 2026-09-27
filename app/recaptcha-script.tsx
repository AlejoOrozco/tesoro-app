"use client";

import { recaptchaScriptUrl } from "@/lib/recaptcha";
import Script from "next/script";

interface RecaptchaScriptProps {
  readonly siteKey: string;
}

export function RecaptchaScript({ siteKey }: RecaptchaScriptProps) {
  return <Script src={recaptchaScriptUrl(siteKey)} strategy="afterInteractive" />;
}
