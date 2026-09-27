export const CAPTCHA_VISITOR_MESSAGE =
  "No pudimos verificar que eres una persona. Intenta de nuevo.";

export type RecaptchaAction = "login" | "register";

const CAPTCHA_API_MESSAGES = new Set(["Captcha verification failed", "Captcha token is required"]);

interface GrecaptchaClient {
  ready(callback: () => void): void;
  execute(siteKey: string, options: { readonly action: RecaptchaAction }): Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: GrecaptchaClient;
  }
}

export function recaptchaScriptUrl(siteKey: string): string {
  return `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
}

export function toVisitorAuthMessage(message: string | null, fallback: string): string {
  if (message && CAPTCHA_API_MESSAGES.has(message)) return CAPTCHA_VISITOR_MESSAGE;
  return message ?? fallback;
}

const SCRIPT_WAIT_MS = 8000;

function readGrecaptcha(): GrecaptchaClient | null {
  return window.grecaptcha ?? null;
}

function waitForClient(): Promise<GrecaptchaClient | null> {
  const existing = readGrecaptcha();
  if (existing) return Promise.resolve(existing);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const client = readGrecaptcha();
      if (client || Date.now() - startedAt >= SCRIPT_WAIT_MS) {
        window.clearInterval(timer);
        resolve(client);
      }
    }, 50);
  });
}

function waitUntilReady(client: GrecaptchaClient): Promise<void> {
  return new Promise((resolve) => {
    client.ready(resolve);
  });
}

export async function executeRecaptcha(
  siteKey: string,
  action: RecaptchaAction,
): Promise<string | null> {
  const client = await waitForClient();
  if (!client) return null;
  try {
    await waitUntilReady(client);
    const token = await client.execute(siteKey, { action });
    if (token.length === 0) return null;
    return token;
  } catch {
    return null;
  }
}
