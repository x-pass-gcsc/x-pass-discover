import { redirect } from 'next/navigation';

/**
 * The workspace is no longer a page of its own: it is the work window inside
 * the office. Old links land in the office with that window already open.
 */
export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  redirect(`/office?session=${encodeURIComponent(sessionId)}&work=1`);
}
