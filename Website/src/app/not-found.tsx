'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, Search, MapPin } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="bg-white p-8 sm:p-12 rounded-xl shadow-xl max-w-md mx-auto border border-gray-100">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 mb-6">
            <span className="text-amber-600 text-4xl font-bold">404</span>
          </div>
          
          <h1 className="font-serif text-3xl font-bold text-gray-900 mb-3">Page Not Found</h1>
          
          <div className="relative mx-auto mb-6 max-w-[240px] h-[120px]">
            <div className="absolute top-0 left-1/2 w-[80px] h-[80px] -translate-x-1/2 rounded-full bg-gray-100 flex items-center justify-center">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <div className="absolute bottom-0 w-full h-[50px] rounded-full bg-gray-100"></div>
            <div className="absolute bottom-3 left-[15%] w-1 h-[40px] bg-gray-200 rotate-[-25deg]"></div>
            <div className="absolute bottom-3 right-[15%] w-1 h-[40px] bg-gray-200 rotate-[25deg]"></div>
          </div>
          
          <p className="text-gray-600 mb-8">
            We couldn&apos;t find the page you&apos;re looking for. It might have been moved, 
            deleted, or perhaps it never existed.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/">
              <Button className="group flex items-center justify-center bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Return Home
              </Button>
            </Link>
            
            <Link href="/routes/user/contact">
              <Button variant="outline" className="group flex items-center justify-center border-amber-200 text-amber-800 hover:bg-amber-50 px-6 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                <MapPin className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform duration-300" />
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-8 text-gray-500 text-sm">
          Deutsche & Indische Küche • Seilerstubb Restaurant
        </div>
      </div>
    </div>
  );
}
