// Eventos de Plausible (sin cookies, no necesita banner). Solo funciona si está definido NEXT_PUBLIC_PLAUSIBLE_DOMAIN.

type Plausible = (event: string, options?: { props?: Record<string, string | number> }) => void;

export function track(event: string, props?: Record<string, string | number>) {
  if (typeof window === "undefined") return;
  (window as unknown as { plausible?: Plausible }).plausible?.(event, props ? { props } : undefined);
}
