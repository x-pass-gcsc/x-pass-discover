import { redirect } from 'next/navigation';

/** `/session/[id]` is the stable session URL; the work happens in the office. */
export default async function SessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/office?session=${encodeURIComponent(sessionId)}`);
}
