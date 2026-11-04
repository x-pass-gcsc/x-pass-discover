import { redirect } from 'next/navigation';

/**
 * Departments are chosen at the reception desk inside the office now. This
 * address stays so old links and bookmarks still work: it opens the office
 * with the desk already open.
 */
export default function DepartmentsPage() {
  redirect('/office?select=1');
}
