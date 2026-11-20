"use client";

import { RecaptchaScript } from "@/app/recaptcha-script";
import { LoginFiberBackground } from "@/components/ghost-fibers/login-fiber-background";
import { login } from "@/lib/auth-api";
import { setCsrfToken } from "@/lib/csrf-token";
import { CAPTCHA_VISITOR_MESSAGE, executeRecaptcha } from "@/lib/recaptcha";
import { destinationAfterLogin } from "@/lib/roles";
import logo from "../../DiamondGoldNoBackground.png";
import Image from "next/image";
import Link from "next/link";
import { type FormEvent, useId, useState } from "react";
import styles from "./login.module.css";

interface LoginFormProps {
  readonly apiOriginUrl: string;
  readonly wwwOriginUrl: string;
  readonly recaptchaSiteKey: string;
  readonly returnPath: string | null;
}

type LoginPhase = "idle" | "pending" | "success";

const SUCCESS_BEAT_MS = 300;

function pause(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, durationMs);
  });
}

function LoginMark({ phase }: { readonly phase: LoginPhase }) {
  if (phase === "pending") return <span className={styles.spinner} />;
  if (phase === "success") {
    return (
      <svg className={styles.check} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 12.5 9.5 17 19 7" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return "Iniciar sesión";
}

function phaseLabel(phase: LoginPhase): string {
  if (phase === "pending") return "Entrando";
  if (phase === "success") return "Listo";
  return "Iniciar sesión";
}

export function LoginForm({ apiOriginUrl, wwwOriginUrl, recaptchaSiteKey, returnPath }: LoginFormProps) {
  const emailId = useId();
  const passwordId = useId();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [phase, setPhase] = useState<LoginPhase>("idle");

  async function handleLogin(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    setErrorMessage(null);
    setPhase("pending");
    const recaptchaToken = await executeRecaptcha(recaptchaSiteKey, "login");
    if (!recaptchaToken) {
      setErrorMessage(CAPTCHA_VISITOR_MESSAGE);
      setPhase("idle");
      return;
    }
    const result = await login(apiOriginUrl, { email, password, recaptchaToken });
    if (!result.ok) {
      setErrorMessage(result.message);
      setPhase("idle");
      return;
    }
    setCsrfToken(result.session.csrfToken);
    setPhase("success");
    await pause(SUCCESS_BEAT_MS);
    window.location.assign(destinationAfterLogin(result.session.role, wwwOriginUrl, returnPath));
  }

  return (
    <main className={styles.screen}>
      <div className={styles.backdrop} aria-hidden="true">
        <LoginFiberBackground />
      </div>
      <section className={styles.card}>
        <Image className={styles.logo} src={logo} alt="Tesoro" priority />
        <div className={styles.heading}>
          <h1 className={styles.title}>Iniciar sesión</h1>
          <p className={styles.subtitle}>Entra con tu correo y contraseña.</p>
        </div>
        <RecaptchaScript siteKey={recaptchaSiteKey} />
        <form onSubmit={handleLogin}>
          <div className={styles.fields}>
            <div className={styles.field}>
              <label htmlFor={emailId}>Correo electrónico</label>
              <input id={emailId} name="email" type="email" autoComplete="email" placeholder="ana@correo.com" autoFocus required />
            </div>
            <div className={styles.field}>
              <label htmlFor={passwordId}>Contraseña</label>
              <input
                id={passwordId}
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="Mínimo 8 caracteres"
                maxLength={200}
                required
              />
            </div>
            {errorMessage ? <p className={styles.alert} role="alert">{errorMessage}</p> : null}
          </div>
          <button
            className={styles.submit}
            type="submit"
            disabled={phase !== "idle"}
            aria-busy={phase === "pending"}
            aria-label={phaseLabel(phase)}
          >
            <LoginMark phase={phase} />
          </button>
        </form>
        <div className={styles.links}>
          <Link href="/register">Crear cuenta</Link>
          <Link href="/cart">Carrito</Link>
          <a href={wwwOriginUrl}>Volver al sitio</a>
        </div>
      </section>
    </main>
  );
}
