/**
 * Loads `.env.local` into `process.env` for standalone scripts. Next.js loads
 * env files automatically at runtime, but plain `tsx` scripts do not — so this
 * module must be imported FIRST, before any module that reads env at load time
 * (e.g. the TMDB client or the Supabase admin client).
 */
import { existsSync } from 'node:fs';

const ENV_FILE = '.env.local';

// `process.loadEnvFile` lands in @types/node after some Node 20 releases; guard
// the access so this typechecks and no-ops on runtimes that predate it.
const proc = process as NodeJS.Process & { loadEnvFile?: (path?: string) => void };

if (existsSync(ENV_FILE) && typeof proc.loadEnvFile === 'function') {
  proc.loadEnvFile(ENV_FILE);
}
