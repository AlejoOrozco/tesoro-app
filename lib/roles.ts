export const ADMINISTRATOR_ROLE = "Administrador";
export const CLIENT_ROLE = "Cliente";

export function isAdministrator(role: string): boolean {
  return role === ADMINISTRATOR_ROLE;
}

export function isClient(role: string): boolean {
  return role === CLIENT_ROLE;
}

export function destinationForRole(role: string, wwwOriginUrl: string): string {
  if (isAdministrator(role)) return "/admin";
  return wwwOriginUrl;
}

export function destinationAfterLogin(
  role: string,
  wwwOriginUrl: string,
  returnPath: string | null,
): string {
  if (isAdministrator(role)) return "/admin";
  if (returnPath) return returnPath;
  return wwwOriginUrl;
}
