export const dynamic = 'force-dynamic';

import { AdminLayout } from '@/components/admin/admin-layout-wrapper';
import type { ReactNode } from 'react';

export default function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminLayout>{children}</AdminLayout>;
}
