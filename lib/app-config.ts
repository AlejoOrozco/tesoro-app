export interface AppConfig {
  readonly apiOriginUrl: string;
  readonly wwwOriginUrl: string;
}

function readRequired(name: string, value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  if (trimmed.length === 0) {
    throw new Error(`${name} must be set`);
  }
  return trimmed;
}

function readOrigin(name: string, value: string | undefined): string {
  return readRequired(name, value).replace(/\/$/, "");
}

export function getAppConfig(): AppConfig {
  return {
    apiOriginUrl: readOrigin(
      "NEXT_PUBLIC_API_ORIGIN_URL",
      process.env.NEXT_PUBLIC_API_ORIGIN_URL,
    ),
    wwwOriginUrl: readOrigin(
      "NEXT_PUBLIC_WWW_ORIGIN_URL",
      process.env.NEXT_PUBLIC_WWW_ORIGIN_URL,
    ),
  };
}

export function getRecaptchaSiteKey(): string {
  return readRequired(
    "NEXT_PUBLIC_RECAPTCHA_SITE_KEY",
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
  );
}
