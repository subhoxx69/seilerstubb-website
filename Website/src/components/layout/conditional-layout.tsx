'use client';

import { usePathname } from 'next/navigation';

interface ConditionalLayoutProps {
  children: React.ReactNode;
  excludeRoutes?: string[];
}

export function ConditionalLayout({ children, excludeRoutes = [] }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Check if the current route should be excluded from padding
  const shouldExcludePadding = excludeRoutes.some(route => pathname.startsWith(route));

  return (
    <div className={`min-h-screen flex flex-col ${shouldExcludePadding ? '' : 'pt-20'}`}>
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
