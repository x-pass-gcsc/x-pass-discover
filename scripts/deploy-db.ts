/**
 * Brings a deployment's database up to date before the app is built.
 *
 *   npm run build   (runs this first)
 *
 * A deployment with DATABASE_URL set but never migrated has no tables, so
 * sign-up fails with "This deployment's database has no tables yet". Running
 * the migrations and the content seed as part of the Vercel build means every
 * deploy finds the database it expects — no one has to remember to run
 * `npm run db:setup` against production by hand.
 *
 * It only acts on Vercel builds (`VERCEL=1`), or when asked explicitly with
 * `X_PASS_MIGRATE_ON_BUILD=1`, so a local or CI `npm run build` never touches
 * a database a developer happens to have in their .env. Both steps are
 * idempotent: applied migrations are skipped, and the seed upserts.
 *
 * A failure fails the build, on purpose: a deploy that cannot reach or migrate
 * its database would only fail later, in front of a student.
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { migrate } from 'drizzle-orm/neon-http/migrator';
import * as schema from '@/db/schema';
import { seed } from '@/db/seed/run';

async function main() {
  const onVercel = process.env.VERCEL === '1';
  const asked = process.env.X_PASS_MIGRATE_ON_BUILD === '1';
  const url = process.env.DATABASE_URL?.trim();

  if (!onVercel && !asked) {
    console.log('· database setup skipped (not a Vercel build)');
    return;
  }
  if (!url) {
    console.log('· database setup skipped (DATABASE_URL is not set — the app runs in demo mode)');
    return;
  }

  const db = drizzle(neon(url), { schema });

  console.log('→ applying migrations');
  await migrate(db, { migrationsFolder: 'drizzle' });

  console.log('→ seeding content');
  await seed(db);

  console.log('✓ database ready');
}

main().catch((error) => {
  console.error('✗ database setup failed:', error);
  process.exit(1);
});
