"use client";

import { RecaptchaScript } from "@/app/recaptcha-script";
import { login } from "@/lib/auth-api";
import { setCsrfToken } from "@/lib/csrf-token";
import { CAPTCHA_VISITOR_MESSAGE, executeRecaptcha } from "@/lib/recaptcha";
import Link from "next/link";
import { type FormEvent, useState } from "react";

interface LoginFormProps {
  readonly apiOriginUrl: string;
  readonly wwwOriginUrl: string;
  readonly recaptchaSiteKey: string;
}

export function LoginForm({ apiOriginUrl, wwwOriginUrl, recaptchaSiteKey }: LoginFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    setErrorMessage(null);
    setIsSubmitting(true);
    const recaptchaToken = await executeRecaptcha(recaptchaSiteKey, "login");
    if (!recaptchaToken) {
      setErrorMessage(CAPTCHA_VISITOR_MESSAGE);
      setIsSubmitting(false);
      return;
    }
    const result = await login(apiOriginUrl, { email, password, recaptchaToken });
    if (!result.ok) {
      setErrorMessage(result.message);
      setIsSubmitting(false);
      return;
    }
    setCsrfToken(result.session.csrfToken);
    window.location.assign(wwwOriginUrl);
  }

  return (
    <main>
      <RecaptchaScript siteKey={recaptchaSiteKey} />
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label htmlFor="email">Correo electrónico</label>
          <input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={200}
            required
          />
        </div>
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          Iniciar sesión
        </button>
      </form>
      <p>
        <Link href="/register">Crear cuenta</Link>
      </p>
      <p>
        <a href={wwwOriginUrl}>Volver al sitio</a>
      </p>
    </main>
  );
}
