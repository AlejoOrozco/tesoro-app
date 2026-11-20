"use client";

import { AuthCard } from "@/app/auth-card";
import { RecaptchaScript } from "@/app/recaptcha-script";
import { register } from "@/lib/auth-api";
import { CAPTCHA_VISITOR_MESSAGE, executeRecaptcha } from "@/lib/recaptcha";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useId, useState } from "react";

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
  const emailId = useId();
  const passwordId = useId();
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
    <AuthCard
      title="Crear cuenta"
      wwwOriginUrl={wwwOriginUrl}
      footer={<Link href="/login">Iniciar sesión</Link>}
    >
      <RecaptchaScript siteKey={recaptchaSiteKey} />
      <form className="stack" onSubmit={handleRegister}>
        <div className="float-field">
          <input id={emailId} name="email" type="email" autoComplete="email" placeholder=" " autoFocus required />
          <label htmlFor={emailId}>Correo electrónico</label>
        </div>
        <div className="float-field">
          <input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder=" "
            aria-describedby="password-rule"
            required
          />
          <label htmlFor={passwordId}>Contraseña</label>
        </div>
        <p className="field-note" id="password-rule">
          Al menos 8 caracteres, una mayúscula, una minúscula, un dígito y un símbolo.
        </p>
        {errorMessage ? <p className="alert" role="alert">{errorMessage}</p> : null}
        <button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting ? "Creando cuenta…" : "Crear cuenta"}
        </button>
      </form>
    </AuthCard>
  );
}
