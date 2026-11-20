const SAFE_RETURN_PATH = /^\/(checkout|cart|account|orders)(\/[A-Za-z0-9-]+)*$/;

export function readReturnPath(value: string | null | undefined): string | null {
  if (!value || value.includes("..") || !SAFE_RETURN_PATH.test(value)) return null;
  return value;
}

export function loginPath(returnPath: string): string {
  return `/login?next=${encodeURIComponent(returnPath)}`;
}
