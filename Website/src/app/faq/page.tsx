'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white px-4 sm:px-6 lg:px-8 py-20">
      <div className="max-w-6xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-8">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
        </Link>
        
        <div className="text-center py-20">
          <h1 className="text-5xl font-bold text-slate-900 mb-4" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Häufig gestellte Fragen
          </h1>
          <p className="text-lg text-slate-600">FAQ wird in Kürze aktualisiert.</p>
        </div>
      </div>
    </div>
  );
}
