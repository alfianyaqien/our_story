/**
 * Environment validation.
 *
 * The failure mode this prevents: a production deploy that starts happily and
 * looks fine, while sessions are unsigned or letters are encrypted with a key
 * from the public repository. Both of those were real - SESSION_SECRET was
 * declared but unread, and ENCRYPTION_KEY had a hardcoded fallback - so the
 * app could be insecure without anything saying so.
 *
 * Called once from instrumentation.ts at startup. In production a missing or
 * too-short secret is fatal; in development it warns, so `npm run dev` still
 * works on a fresh clone.
 */

interface Requirement {
  name: string;
  minLength?: number;
  why: string;
}

const SECRETS: Requirement[] = [
  {
    name: 'SESSION_SECRET',
    minLength: 32,
    why: 'signs the session cookie; without it every session is rejected',
  },
  {
    name: 'ENCRYPTION_KEY',
    minLength: 32,
    why: 'encrypts love letters at rest; never change it once letters exist',
  },
];

const DB_VARS = ['DB_HOST', 'DB_USER', 'DB_NAME'];

export function validateEnv(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const problems: string[] = [];

  for (const { name, minLength = 1, why } of SECRETS) {
    const value = process.env[name];
    if (!value) {
      problems.push(`${name} is not set — ${why}`);
    } else if (value.length < minLength) {
      problems.push(
        `${name} is shorter than ${minLength} characters — ${why}`
      );
    } else if (/^(your-|change|default|secret|password)/i.test(value)) {
      // Catches the .env.example placeholders being shipped as-is.
      problems.push(`${name} still looks like a placeholder — ${why}`);
    }
  }

  for (const name of DB_VARS) {
    if (!process.env[name]) problems.push(`${name} is not set`);
  }

  if (isProduction && !process.env.NEXT_PUBLIC_APP_URL) {
    problems.push(
      'NEXT_PUBLIC_APP_URL is not set — verification and reset emails will ' +
        'contain broken links'
    );
  }

  if (isProduction && !process.env.UPLOAD_DIR) {
    // Not fatal, but the default lives inside the deploy tree, so a release
    // would take the photos with it.
    console.warn(
      '⚠️  UPLOAD_DIR is not set. Uploads will be written inside the ' +
        'application directory and lost on the next deploy. Point it at a ' +
        'persistent path.'
    );
  }

  if (problems.length === 0) return;

  const message =
    'Environment is not configured correctly:\n' +
    problems.map((p) => `  • ${p}`).join('\n') +
    '\n\nGenerate secrets with:  openssl rand -base64 48\n';

  if (isProduction) {
    // Refuse to serve rather than serve insecurely.
    throw new Error(message);
  }
  console.warn(`⚠️  ${message}`);
}
