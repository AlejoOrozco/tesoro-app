import { getAppConfig, getRecaptchaSiteKey } from "@/lib/app-config";
import { readReturnPath } from "@/lib/return-path";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

interface LoginPageProps {
  readonly searchParams: Promise<{ readonly next?: string | string[] }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextValue = Array.isArray(params.next) ? params.next[0] : params.next;
  const { apiOriginUrl, wwwOriginUrl } = getAppConfig();
  return (
    <LoginForm
      apiOriginUrl={apiOriginUrl}
      wwwOriginUrl={wwwOriginUrl}
      recaptchaSiteKey={getRecaptchaSiteKey()}
      returnPath={readReturnPath(nextValue)}
    />
  );
}
