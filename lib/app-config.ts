export interface AppConfig {
  readonly apiOriginUrl: string;
  readonly wwwOriginUrl: string;
}

function readOrigin(name: string, value: string | undefined): string {
  const origin = value?.trim().replace(/\/$/, "") ?? "";
  if (origin.length === 0) {
    throw new Error(`${name} must be set`);
  }
  return origin;
}

export function getAppConfig(): AppConfig {
  return {
    apiOriginUrl: readOrigin("API_ORIGIN_URL", process.env.API_ORIGIN_URL),
    wwwOriginUrl: readOrigin("WWW_ORIGIN_URL", process.env.WWW_ORIGIN_URL),
  };
}
