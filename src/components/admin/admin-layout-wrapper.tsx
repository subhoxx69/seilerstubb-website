'use client';

import { AdminNavbar } from '@/components/admin/admin-navbar';
import { AdminProtection } from '@/components/admin/admin-protection';

export function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProtection>
      <AdminNavbar>{children}</AdminNavbar>
    </AdminProtection>
  );
}
