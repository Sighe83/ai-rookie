require('dotenv').config();

// Centralized database URL resolver for Prisma and pg
// Rules:
// - If VERCEL_ENV === 'production' use POSTGRES_URL_PROD
// - Otherwise use POSTGRES_URL_DEV
// - Fallbacks to existing process.env.DATABASE_URL if specific vars are missing

const VERCEL_ENV = process.env.VERCEL_ENV;
const PROD = VERCEL_ENV === 'production';

const fromEnv = () => {
  const prodUrl = process.env.POSTGRES_URL_PROD;
  const devUrl = process.env.POSTGRES_URL_DEV;
  const generic = process.env.POSTGRES_URL; // Vercel default name
  const legacy = process.env.DATABASE_URL;

  // Prefer explicit URLs, fall back to legacy DATABASE_URL
  const selected = PROD ? (prodUrl || generic || legacy) : (devUrl || generic || legacy);

  if (!selected) {
    const reason = PROD ? 'POSTGRES_URL_PROD' : 'POSTGRES_URL_DEV';
    throw new Error(`Database URL not configured. Expected ${reason} or DATABASE_URL in environment.`);
  }

  return selected;
};

const DATABASE_URL = fromEnv();

// Ensure Prisma (schema.prisma) and any tools relying on env pick this up.
// Do not override if already set to the same value to avoid noisy diffs.
if (!process.env.DATABASE_URL || process.env.DATABASE_URL !== DATABASE_URL) {
  process.env.DATABASE_URL = DATABASE_URL;
}

module.exports = {
  DATABASE_URL,
  isProduction: PROD,
};