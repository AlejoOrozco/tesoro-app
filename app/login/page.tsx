import { getAppConfig, getRecaptchaSiteKey } from "@/lib/app-config";
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
};

export default function LoginPage() {
  const { apiOriginUrl, wwwOriginUrl } = getAppConfig();
  return (
    <LoginForm
      apiOriginUrl={apiOriginUrl}
      wwwOriginUrl={wwwOriginUrl}
      recaptchaSiteKey={getRecaptchaSiteKey()}
    />
  );
}
