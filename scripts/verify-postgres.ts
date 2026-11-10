/**
 * Verifies the Neon/Drizzle code path against a real PostgreSQL engine without
 * needing a Neon account: boots an embedded Postgres (PGlite), applies the
 * generated migration, runs the seed, and drives DrizzleRepository through the
 * real scenario services.
 *
 *   npm run db:verify
 *
 * Useful in CI and before touching the schema. It does not replace a smoke test
 * against an actual Neon branch — Neon's serverless driver is not exercised
 * here — but it does prove the SQL, the schema and every query are correct.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import * as schema from '@/db/schema';
import { DrizzleRepository } from '@/db/repository/drizzle-repository';

let failures = 0;
const check = (label: string, cond: unknown, detail = '') => {
  if (!cond) failures++;
  console.log(`${cond ? '✓' : '✗ FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
};

const ROOT = process.cwd();

async function main() {
  console.log('=== booting embedded Postgres ===');
  const client = new PGlite();
  await client.waitReady;
  const db = drizzle(client, { schema });

  // Before the migration, this database is exactly what a deployment looks
  // like when DATABASE_URL is set and `db:migrate` was never run. The app has
  // to recognise that and say so, rather than forwarding PostgreSQL's
  // `relation "users" does not exist` to whoever is testing the deployment.
  console.log('\n=== an un-migrated database is recognised as such ===');
  const { isMissingSchemaError } = await import('@/lib/errors');
  let missingSchema: unknown = null;
  try {
    await new DrizzleRepository(db as never).findUserByEmail('nobody@example.com');
  } catch (error) {
    missingSchema = error;
  }
  check('a query against an empty database fails', missingSchema !== null);
  check('and is recognised as a missing schema', isMissingSchemaError(missingSchema));
  check('a genuine fault is not mistaken for one', !isMissingSchemaError(new Error('boom')));

  // The whole path, from the error PostgreSQL actually raised to the response
  // the browser actually receives.
  const { faultResponse } = await import('@/lib/api');
  const response = faultResponse(missingSchema, 'Sign-up failed. Please try again.');
  const body = (await response.json()) as { error: string; code?: string };
  check('the API answers 503, not a 400 that looks like bad input', response.status === 503);
  check('with a code the client can branch on', body.code === 'setup_required', body.code);
  check('and an instruction rather than a driver message', body.error.includes('db:migrate'));
  check(
    'the driver message is not forwarded to the browser',
    !body.error.includes('does not exist'),
    body.error,
  );

  console.log('\n=== applying generated migrations, in order ===');
  const dir = path.join(ROOT, 'drizzle');
  const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
  for (const file of files) {
    const sql = readFileSync(path.join(dir, file), 'utf8');
    for (const statement of sql.split('--> statement-breakpoint')) {
      const trimmed = statement.trim();
      if (trimmed) await client.exec(trimmed);
    }
  }
  const tables = await client.query<{ count: number }>(
    `select count(*)::int as count from information_schema.tables where table_schema='public'`,
  );
  check(
    `migrations applied (${files.join(', ')})`,
    tables.rows[0].count === 32,
    `${tables.rows[0].count} tables`,
  );

  const nullable = await client.query<{ is_nullable: string }>(
    `select is_nullable from information_schema.columns where table_name='projects' and column_name='product_id'`,
  );
  check('projects.product_id is NULLABLE', nullable.rows[0].is_nullable === 'YES');

  // Point the global repository at this database before services load it.
  const repo = new DrizzleRepository(db as never);
  (globalThis as { __xPassRepository?: unknown }).__xPassRepository = repo;

  // Migrated but not seeded is the other half-finished deployment: sign-up
  // works, so nothing looks wrong until a student presses "Start bootcamp".
  console.log('\n=== a migrated-but-unseeded database says what is missing ===');
  const { SetupRequiredError } = await import('@/lib/errors');
  let unseeded: unknown = null;
  try {
    await repo.createSession({
      userId: '00000000-0000-0000-0000-000000000000',
      departmentSlug: 'sales',
      projectKey: 'sales',
      scenarioKey: 'sales-quickmart',
      scenarioVersion: 1,
      deadlineHours: 24,
      initialStepKey: 'sales-training',
    });
  } catch (error) {
    unseeded = error;
  }
  check('starting a bootcamp fails before the seed', unseeded !== null);
  check('and says so as a setup problem', unseeded instanceof SetupRequiredError);
  const unseededResponse = faultResponse(unseeded, 'Could not start the bootcamp.');
  const unseededBody = (await unseededResponse.json()) as { error: string; code?: string };
  check('answered as 503 setup_required', unseededResponse.status === 503 && unseededBody.code === 'setup_required');
  check('naming the command that fixes it', unseededBody.error.includes('db:seed'), unseededBody.error);

  console.log('\n=== seeding scenario content ===');
  const { seed } = await import('@/db/seed/run');
  await seed(db as never);

  const counts = async (table: string) =>
    (await client.query<{ c: number }>(`select count(*)::int as c from ${table}`)).rows[0].c;
  check('5 departments seeded', (await counts('departments')) === 5);
  check('5 projects seeded', (await counts('projects')) === 5);
  // Expected counts come from the content registry, so authoring a scenario
  // makes this check stricter rather than wrong.
  const { listScenarios, listResources } = await import('@/content/registry');
  const { listPersonas } = await import('@/content/personas.server');
  const scenarios = listScenarios();
  const expected = {
    versions: scenarios.length,
    steps: scenarios.reduce((n, s) => n + s.steps.length, 0),
    tasks: scenarios.reduce((n, s) => n + s.steps.reduce((m, step) => m + step.tasks.length, 0), 0),
    resources: scenarios.reduce((n, s) => n + listResources(s.scenarioKey).length, 0),
    personas: scenarios.reduce((n, s) => n + listPersonas(s.scenarioKey).length, 0),
    facts: scenarios.reduce(
      (n, s) => n + listPersonas(s.scenarioKey).reduce((m, p) => m + p.facts.length, 0),
      0,
    ),
  };
  check(`${expected.versions} scenario versions seeded`, (await counts('scenario_versions')) === expected.versions, `${await counts('scenario_versions')}`);
  check(`${expected.steps} scenario steps seeded`, (await counts('scenario_steps')) === expected.steps, `${await counts('scenario_steps')}`);
  check(`${expected.tasks} tasks seeded`, (await counts('tasks')) === expected.tasks, `${await counts('tasks')}`);
  check(`${expected.resources} resources seeded (keys unique across scenarios)`, (await counts('resources')) === expected.resources, `${await counts('resources')}`);
  check(`${expected.personas} personas seeded`, (await counts('ai_personas')) === expected.personas, `${await counts('ai_personas')}`);
  check(`${expected.facts} persona facts seeded`, (await counts('persona_facts')) === expected.facts, `${await counts('persona_facts')}`);
  check('step_resources linked', (await counts('step_resources')) > 0);

  const nullProduct = await client.query<{ c: number }>(
    `select count(*)::int as c from projects where product_id is null`,
  );
  check('PM and Strategy projects stored with NULL product_id', nullProduct.rows[0].c === 2, `${nullProduct.rows[0].c}`);

  console.log('\n=== seed is idempotent ===');
  await seed(db as never);
  check(`re-seed keeps ${expected.steps} steps (no duplicates)`, (await counts('scenario_steps')) === expected.steps, `${await counts('scenario_steps')}`);
  check(`re-seed keeps ${expected.resources} resources`, (await counts('resources')) === expected.resources, `${await counts('resources')}`);
  check('re-seed keeps 5 departments', (await counts('departments')) === 5);

  console.log('\n=== exercising DrizzleRepository through the real services ===');
  const user = await repo.createUser({ email: 'pg@example.com', displayName: 'PG Student' });
  check('createUser creates', Boolean(user?.id));
  if (!user) throw new Error('createUser returned null on a fresh email');
  check('findUserByEmail round-trips', (await repo.findUserByEmail('pg@example.com'))?.id === user.id);
  // A taken address comes back as null rather than a second account or an
  // overwritten name — the sign-up form depends on being able to tell.
  const duplicate = await repo.createUser({
    email: 'PG@Example.com',
    displayName: 'Someone Else',
  });
  check('createUser refuses an email that already has an account', duplicate === null);
  check('the existing account is untouched', (await repo.getUser(user.id))?.displayName === 'PG Student');
  check('and there is still only one of it', (await counts('users')) === 1);

  check('a new account has no password yet', (await repo.getCredential(user.id)) === null);
  const firstSet = new Date('2026-01-01T00:00:00.123Z').toISOString();
  await repo.setPasswordHash(user.id, 'hash-one', firstSet);
  const credential = await repo.getCredential(user.id);
  check('setPasswordHash stores the hash', credential?.passwordHash === 'hash-one');
  check('and the moment it was set, to the millisecond', credential?.updatedAt === firstSet);
  await repo.setPasswordHash(user.id, 'hash-two', new Date().toISOString());
  check('changing the password replaces it', (await repo.getCredential(user.id))?.passwordHash === 'hash-two');
  check('one credential row per account', (await counts('user_credentials')) === 1);
  check(
    'updateDisplayName renames',
    (await repo.updateDisplayName(user.id, 'PG Renamed'))?.displayName === 'PG Renamed',
  );
  await repo.updateDisplayName(user.id, 'PG Student');

  await repo.savePreSurvey(user.id, { interest_sales: 5 });
  check('pre-survey upsert', (await repo.getPreSurvey(user.id))?.answers.interest_sales === 5);
  await repo.savePreSurvey(user.id, { interest_sales: 3 });
  check('pre-survey re-upsert overwrites', (await repo.getPreSurvey(user.id))?.answers.interest_sales === 3);

  await repo.saveDepartmentSelection(user.id, ['sales', 'strategy']);
  check('department selection upsert', (await repo.getDepartmentSelection(user.id))?.departmentSlugs.length === 2);
  check('a pre-2+1 selection is not confirmed', !(await repo.getDepartmentSelection(user.id))?.confirmedAt);

  // The 2+1 plan: confirmed once, over the earlier selection, never twice.
  const confirmedPlan = await repo.confirmDepartmentPlan(user.id, {
    userChosenSlugs: ['sales', 'human-resources'],
    aiRecommendedSlug: 'strategy',
    recommendationVersion: 'recommendation-v1',
    recommendation: { note: 'verify-postgres' },
  });
  check(
    'department plan confirms',
    !!confirmedPlan?.confirmedAt &&
      confirmedPlan.departmentSlugs.join() === 'sales,human-resources,strategy' &&
      confirmedPlan.aiRecommendedSlug === 'strategy',
  );
  const secondPlan = await repo.confirmDepartmentPlan(user.id, {
    userChosenSlugs: ['marketing', 'strategy'],
    aiRecommendedSlug: 'sales',
    recommendationVersion: 'recommendation-v1',
    recommendation: {},
  });
  const afterSecond = await repo.getDepartmentSelection(user.id);
  check(
    'a confirmed plan is not replaced',
    secondPlan === null && afterSecond?.departmentSlugs.join() === 'sales,human-resources,strategy',
  );

  // The post-survey: drafts until submitted, submitted once, then frozen.
  const surveyInput = (b5: number) => ({
    surveyVersion: 'post-survey-v1.0',
    departmentSlugs: ['sales', 'human-resources', 'strategy'],
    departmentAnswers: { sales: { a1: 6 }, 'human-resources': { a1: 3 }, strategy: { a1: 5 } },
    comparisonAnswers: { b5 },
    experienceAnswers: { c1: 7 },
  });
  const draft = await repo.saveCareerPostSurveyDraft(user.id, surveyInput(2));
  check('post-survey draft saves', draft?.status === 'draft' && draft.submittedAt === null);
  const redraft = await repo.saveCareerPostSurveyDraft(user.id, surveyInput(3));
  check('post-survey draft updates', (redraft?.comparisonAnswers as { b5?: number }).b5 === 3);
  const submitted = await repo.submitCareerPostSurvey(user.id, surveyInput(4));
  check(
    'post-survey submits with its parts kept apart',
    submitted?.status === 'submitted' &&
      !!submitted.submittedAt &&
      (submitted.departmentAnswers as Record<string, { a1: number }>)['human-resources'].a1 === 3 &&
      (submitted.experienceAnswers as { c1: number }).c1 === 7,
  );
  const [again, laterDraft] = await Promise.all([
    repo.submitCareerPostSurvey(user.id, surveyInput(5)),
    repo.saveCareerPostSurveyDraft(user.id, surveyInput(6)),
  ]);
  const storedSurvey = await repo.getCareerPostSurvey(user.id);
  check(
    'a submitted post-survey cannot be resubmitted or redrafted',
    again === null && laterDraft === null && (storedSurvey?.comparisonAnswers as { b5: number }).b5 === 4,
  );

  const { startSession, loadSessionView } = await import(
    '@/services/scenario/session-service'
  );
  const { saveTaskAnswer } = await import('@/services/scenario/task-service');
  const { openConversation, sendStudentMessage, endConversation } =
    await import('@/services/ai/conversation-service');

  const session = await startSession(user.id, 'sales');
  check('session created against Postgres', Boolean(session.id));
  check('session joins back department/project/scenario keys',
    session.departmentSlug === 'sales' && session.projectKey === 'sales-quickmart-protein-drink' && session.scenarioKey === 'sales-quickmart',
    `${session.departmentSlug}/${session.projectKey}/${session.scenarioKey}`);
  check('startSession is idempotent per department', (await startSession(user.id, 'sales')).id === session.id);
  check('step_progress rows seeded', (await repo.listStepProgress(session.id)).length === 10);

  let view = await loadSessionView(session.id, user.id);
  check('session view builds from Postgres', view.steps.length === 10);
  check('first step unlocked, second locked',
    view.steps[0].unlocked && !view.steps[1].unlocked);

  await saveTaskAnswer({ session, taskKey: 'training-review', value: { acknowledged: true }, status: 'submitted' });
  view = await loadSessionView(session.id, user.id);
  check('training completes and unlocks onboarding', view.steps[1].unlocked);

  // Revision history must be preserved across versions.
  await saveTaskAnswer({ session, taskKey: 'product-strengths', value: { strengths: [{ strength: 'A', evidence: 'e', why_it_may_matter_to_quickmart: 'w' }] }, status: 'draft' });
  await saveTaskAnswer({ session, taskKey: 'product-strengths', value: { strengths: [{ strength: 'B', evidence: 'e', why_it_may_matter_to_quickmart: 'w' }] }, status: 'draft' });
  const answer = await repo.getAnswer(session.id, 'product-strengths');
  const revisions = await repo.listRevisions(session.id, 'product-strengths');
  check('answer version incremented', answer?.version === 2, `v${answer?.version}`);
  check('2 revisions preserved', revisions.length === 2, `${revisions.length}`);
  check('previous value preserved on the revision',
    (revisions[1].previousValue as { strengths: { strength: string }[] }).strengths[0].strength === 'A');
  await saveTaskAnswer({ session, taskKey: 'product-strengths', value: { strengths: [{ strength: 'B', evidence: 'e', why_it_may_matter_to_quickmart: 'w' }] }, status: 'draft' });
  check('unchanged save does NOT create a revision', (await repo.listRevisions(session.id, 'product-strengths')).length === 2);

  console.log('\n=== AI conversation against Postgres ===');
  await openConversation(session, 'bite-sales-manager', 'onboarding');
  const conv = await sendStudentMessage(session, 'bite-sales-manager', 'onboarding', 'What is our minimum wholesale price?');
  check('conversation messages persisted', conv.messages.length === 3, `${conv.messages.length}`);
  const ended = await endConversation(session, 'bite-sales-manager', 'onboarding');
  check('conversation ends', ended.status === 'ended');

  const buyerConv = await openConversation(session, 'quickmart-buyer', 'buyer-meeting');
  const asked = await sendStudentMessage(session, 'quickmart-buyer', 'buyer-meeting', 'What is the morning sales velocity in office area stores?');
  check('hidden fact disclosed and persisted', asked.discoveredFactCount === 1, `${asked.discoveredFactCount}`);
  const stored = await repo.getConversation(buyerConv.id);
  check('revealed_fact_ids written to Postgres', stored?.revealedFactIds.includes('morning_velocity'));

  console.log('\n=== second scenario (HR) on the same engine ===');
  const hrSession = await startSession(user.id, 'human-resources');
  check('HR session joins back its own keys',
    hrSession.scenarioKey === 'hr-cn-expansion' && hrSession.projectKey === 'hr-cn-expansion-talent',
    `${hrSession.projectKey}/${hrSession.scenarioKey}`);
  const hrView = await loadSessionView(hrSession.id, user.id);
  check('HR session view builds from Postgres', hrView.steps.length === 11, `${hrView.steps.length}`);
  const interview = await sendStudentMessage(hrSession, 'candidate-sato', 'candidate-interviews', 'What did you personally do in those distributor deals — who signed them?');
  check('a candidate interview discloses on its own ledger', interview.discoveredFactCount === 1, `${interview.discoveredFactCount}`);
  const otherCandidate = await openConversation(hrSession, 'candidate-lin', 'candidate-interviews');
  check('a second candidate in the same step has a separate transcript',
    otherCandidate.id !== interview.id && otherCandidate.discoveredFactCount === 0);

  console.log('\n=== submissions and events ===');
  const submission = await repo.createSubmission({
    sessionId: session.id, taskKey: 'final-proposal', title: 'QuickMart Final Sales Proposal', snapshot: { a: 1 },
  });
  check('submission snapshot stored', (await repo.listSubmissions(session.id))[0].id === submission.id);

  const events = await repo.listEvents({ sessionId: session.id, limit: 500 });
  check('behavior events written to Postgres', events.length > 5, `${events.length} events`);
  check('events ordered oldest-first', events.every((e, i) => i === 0 || events[i - 1].occurredAt <= e.occurredAt));
  check('event types include ai_fact_revealed', events.some((e) => e.eventType === 'ai_fact_revealed'));

  console.log('\n=== session listing / isolation ===');
  check('listSessionsForUser', (await repo.listSessionsForUser(user.id)).length === 2);
  const other = await repo.createUser({ email: 'other-pg@example.com', displayName: 'Other' });
  if (!other) throw new Error('createUser returned null on a fresh email');
  check('other user has no sessions', (await repo.listSessionsForUser(other.id)).length === 0);

  await client.close();
  console.log(`\n${failures === 0 ? '✅ POSTGRES PATH VERIFIED' : `❌ ${failures} CHECK(S) FAILED`}`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => { console.error(error); process.exit(1); });
