const STORAGE_KEY = "tesoro-dashboard-sidebar";

const listeners = new Set<() => void>();

function readExpanded(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== "icons";
}

function notify(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeSidebar(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getSidebarExpanded(): boolean {
  return readExpanded();
}

export function getSidebarExpandedServer(): boolean {
  return true;
}

export function setSidebarExpanded(isExpanded: boolean): void {
  localStorage.setItem(STORAGE_KEY, isExpanded ? "full" : "icons");
  notify();
}
