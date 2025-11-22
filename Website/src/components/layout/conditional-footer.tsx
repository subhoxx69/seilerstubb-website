'use client';

import { usePathname } from 'next/navigation';
import Footer from '@/components/layout/footer';

interface ConditionalFooterProps {
  excludeRoutes?: string[];
}

export function ConditionalFooter({ excludeRoutes = [] }: ConditionalFooterProps) {
  const pathname = usePathname();
  
  // Check if the current route should exclude the footer
  const shouldExcludeFooter = excludeRoutes.some(route => pathname.startsWith(route));

  if (shouldExcludeFooter) {
    return null;
  }

  return <Footer />;
}
