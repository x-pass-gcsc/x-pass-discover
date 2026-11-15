import 'server-only';

/**
 * A per-user cap on senpai questions, so one stuck tab or a curious student
 * holding Enter cannot run up the API bill.
 *
 * It lives in process memory: on a serverless deployment every instance keeps
 * its own count, so the real ceiling is a few times this. That is fine for a
 * cost guard; it is not an abuse control.
 */
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 30;

const hits = new Map<string, number[]>();

/** Records one question. Returns the seconds to wait if the user is over the cap. */
export function takeSenpaiQuota(userId: string, now = Date.now()): number | null {
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(userId, recent);
    return Math.ceil((recent[0] + WINDOW_MS - now) / 1000);
  }
  recent.push(now);
  hits.set(userId, recent);
  return null;
}
