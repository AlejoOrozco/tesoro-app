"use client";

import { RecaptchaScript } from "@/app/recaptcha-script";
import { register } from "@/lib/auth-api";
import { CAPTCHA_VISITOR_MESSAGE, executeRecaptcha } from "@/lib/recaptcha";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

interface RegisterFormProps {
  readonly apiOriginUrl: string;
  readonly wwwOriginUrl: string;
  readonly recaptchaSiteKey: string;
}

export function RegisterForm({
  apiOriginUrl,
  wwwOriginUrl,
  recaptchaSiteKey,
}: RegisterFormProps) {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleRegister(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    setErrorMessage(null);
    setIsSubmitting(true);
    const recaptchaToken = await executeRecaptcha(recaptchaSiteKey, "register");
    if (!recaptchaToken) {
      setErrorMessage(CAPTCHA_VISITOR_MESSAGE);
      setIsSubmitting(false);
      return;
    }
    const result = await register(apiOriginUrl, { email, password, recaptchaToken });
    if (!result.ok) {
      setErrorMessage(result.message);
      setIsSubmitting(false);
      return;
    }
    router.push("/login");
  }

  return (
    <main>
      <RecaptchaScript siteKey={recaptchaSiteKey} />
      <h1>Crear cuenta</h1>
      <form onSubmit={handleRegister}>
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
            autoComplete="new-password"
            aria-describedby="password-rule"
            required
          />
          <p id="password-rule">
            La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un
            dígito y un símbolo.
          </p>
        </div>
        {errorMessage ? <p role="alert">{errorMessage}</p> : null}
        <button type="submit" disabled={isSubmitting}>
          Crear cuenta
        </button>
      </form>
      <p>
        <Link href="/login">Iniciar sesión</Link>
      </p>
      <p>
        <a href={wwwOriginUrl}>Volver al sitio</a>
      </p>
    </main>
  );
}
