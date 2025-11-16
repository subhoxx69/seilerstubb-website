'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { 
  Menu, X, Home, FileText, Calendar, Users, Settings, 
  LogOut, ChevronDown, ChevronRight, LayoutDashboard, Image as ImageIcon,
  Terminal, Smartphone, Mail, Bell, Zap, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminNavbar({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logOut } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navLinks = [
    { 
      label: 'Dashboard', 
      path: '/routes/admin', 
      icon: <LayoutDashboard className="w-5 h-5" /> 
    },
    { 
      label: 'Ankündigungen', 
      path: '/routes/admin/announcements', 
      icon: <Bell className="w-5 h-5" /> 
    },
    { 
      label: 'Live Reservationen', 
      path: '/routes/admin/live-reservations', 
      icon: <Zap className="w-5 h-5" /> 
    },
    { 
      label: 'Menu Management', 
      path: '/routes/admin/menu', 
      icon: <FileText className="w-5 h-5" /> 
    },
    { 
      label: 'Gallery Management', 
      path: '/routes/admin/gallery', 
      icon: <ImageIcon className="w-5 h-5" /> 
    },
    { 
      label: 'Reservations', 
      path: '/routes/admin/reservations', 
      icon: <Calendar className="w-5 h-5" /> 
    },
    { 
      label: 'Kontakt-Verwaltung', 
      path: '/routes/admin/contact', 
      icon: <Mail className="w-5 h-5" /> 
    },
    { 
      label: 'User Management', 
      path: '/routes/admin/users', 
      icon: <Users className="w-5 h-5" /> 
    },
    { 
      label: 'Öffnungszeiten Einstellungen', 
      path: '/routes/admin/opening-hours', 
      icon: <Settings className="w-5 h-5" /> 
    },
    { 
      label: 'Maintenance Mode', 
      path: '/routes/admin/maintenance', 
      icon: <AlertTriangle className="w-5 h-5 text-red-500" /> 
    },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar for desktop */}
      <aside 
        className={`bg-white fixed inset-y-0 z-10 transition-all duration-300 ease-in-out shadow-md 
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-20 translate-x-0'} 
          hidden md:flex md:flex-col`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b">
          <Link href="/" className="flex items-center">
            {sidebarOpen ? (
              <span className="font-serif text-lg font-bold ml-2 text-amber-800">
                Seilerstubb Admin
              </span>
            ) : (
              <span className="font-serif text-lg font-bold text-amber-800">S</span>
            )}
          </Link>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight 
              className={`w-5 h-5 text-gray-500 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>
        
        <div className="flex flex-col flex-grow overflow-y-auto">
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.path} href={link.path}>
                <div className={`flex items-center px-3 py-3 rounded-md cursor-pointer transition-colors ${
                  pathname === link.path 
                    ? 'bg-amber-50 text-amber-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}>
                  <div className="flex items-center">
                    {link.icon}
                    {sidebarOpen && <span className="ml-3">{link.label}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t">
            <div className={`flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center'}`}>
              {sidebarOpen && (
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-900">
                    {user?.displayName || user?.email}
                  </span>
                  <span className="text-xs text-gray-500">Administrator</span>
                </div>
              )}
              
              <button 
                onClick={handleLogout}
                className="p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-red-500"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-10 bg-white border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)} 
              className="p-2 rounded-md focus:outline-none"
            >
              {sidebarOpen ? (
                <X className="w-6 h-6 text-gray-700" />
              ) : (
                <Menu className="w-6 h-6 text-gray-700" />
              )}
            </button>
            <span className="font-serif text-lg font-bold ml-2 text-amber-800">Seilerstubb Admin</span>
          </div>
          
          <div className="flex items-center">
            <Link href="/" className="p-2 text-gray-500 rounded-md hover:bg-gray-100 mr-2">
              <Home className="w-5 h-5" />
            </Link>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-500 rounded-md hover:bg-gray-100 hover:text-red-500"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white">
            <div className="flex items-center justify-between h-16 px-4 border-b">
              <span className="font-serif text-lg font-bold text-amber-800">Seilerstubb Admin</span>
              <button onClick={() => setSidebarOpen(false)} className="p-2">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <div className="flex items-center pb-4 border-b">
                <div>
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <span className="text-amber-800 font-semibold">{user?.displayName?.[0] || user?.email?.[0] || 'A'}</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.displayName || user?.email}</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
            <nav className="px-4 py-2">
              {navLinks.map((link) => (
                <Link key={link.path} href={link.path}>
                  <div 
                    className={`flex items-center px-3 py-3 rounded-md cursor-pointer ${
                      pathname === link.path 
                        ? 'bg-amber-50 text-amber-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {link.icon}
                    <span className="ml-3">{link.label}</span>
                  </div>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className={`flex-1 ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'} transition-all duration-300`}>
        <div className="hidden md:block h-16"></div> {/* Spacer for desktop */}
        <div className="md:hidden h-16"></div> {/* Spacer for mobile */}
        
        <main className="p-5">
          {children}
        </main>
      </div>
    </div>
  );
}
