"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/auth-provider';
import {
  LayoutDashboard,
  Users,
  MapPin,
  Bell,
  Megaphone,
  BarChart3,
  Shield,
  Radio,
  HeartPulse,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Array<'admin' | 'rescuer' | 'public'>;
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    roles: ['admin'],
  },
  {
    title: 'User Management',
    href: '/admin/users',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Map & Alerts',
    href: '/rescuer',
    icon: MapPin,
    roles: ['rescuer', 'admin'],
  },
  {
    title: 'Campaigns',
    href: '/rescuer/campaigns',
    icon: Megaphone,
    roles: ['rescuer', 'admin'],
  },
  {
    title: 'Mark Survivor Location',
    href: '/rescuer/mark-location',
    icon: HeartPulse,
    roles: ['rescuer', 'admin'],
  },
  {
    title: 'Public Alerts',
    href: '/public',
    icon: Bell,
    roles: ['public', 'admin', 'rescuer'],
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: BarChart3,
    roles: ['admin', 'rescuer', 'public'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const { userProfile } = useAuth();

  const filteredNavItems = navItems.filter(
    item => userProfile && item.roles.includes(userProfile.role)
  );

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-card border-r">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 py-4 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Shield className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-semibold text-sm">Nishan-e-Zindagi</h1>
          <p className="text-xs text-muted-foreground">Rescue Dashboard</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && item.href !== '/rescuer' && item.href !== '/public' && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Connection Status */}
      <div className="p-4 border-t">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Radio className="h-3 w-3" />
          <span>Demo Mode Active</span>
          <span className="ml-auto h-2 w-2 rounded-full bg-green-500" />
        </div>
      </div>
    </div>
  );
}
