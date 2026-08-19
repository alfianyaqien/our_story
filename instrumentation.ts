import { validateEnv } from '@/lib/env';

/**
 * Next calls this once when the server process starts. Validating here means a
 * misconfigured production deploy fails at boot with a readable message,
 * instead of serving traffic with unsigned sessions or a public encryption key.
 */
export function register() {
  validateEnv();
}
