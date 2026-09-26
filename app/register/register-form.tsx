"use client";

import { register } from "@/lib/auth-api";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

interface RegisterFormProps {
  readonly apiOriginUrl: string;
  readonly wwwOriginUrl: string;
}

export function RegisterForm({ apiOriginUrl, wwwOriginUrl }: RegisterFormProps) {
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
    const result = await register(apiOriginUrl, { email, password });
    if (!result.ok) {
      setErrorMessage(result.message);
      setIsSubmitting(false);
      return;
    }
    router.push("/login");
  }

  return (
    <main>
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
