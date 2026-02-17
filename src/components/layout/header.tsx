"use client";

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Bell, LogOut, Menu, User, AlertTriangle, Info, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAlertStore } from '@/store/alert-store';
import { cn } from '@/lib/utils';
import { Alert } from '@/types';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { userProfile, signOut } = useAuth();
  const { getActiveAlerts, alerts, acknowledgeAlert } = useAlertStore();

  const activeAlerts = getActiveAlerts();
  // Show recent alerts (up to 10, newest first)
  const recentAlerts = alerts.slice(0, 10);

  // Route to the appropriate alerts page based on user role
  const getAlertsRoute = useCallback(() => {
    const role = userProfile?.role;
    if (role === 'admin' || role === 'rescuer') {
      return '/dashboard/alerts';
    }
    return '/public';
  }, [userProfile?.role]);

  // Handle clicking a specific notification - acknowledge it and navigate
  const handleNotificationClick = useCallback(async (alert: Alert) => {
    if (alert.status === 'active') {
      await acknowledgeAlert(alert.id, userProfile?.displayName || 'unknown');
    }
    router.push(getAlertsRoute());
  }, [acknowledgeAlert, userProfile?.displayName, router, getAlertsRoute]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSeverityIcon = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return <ShieldAlert className="h-4 w-4 text-red-500 shrink-0" />;
      case 'high':
        return <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />;
      case 'medium':
        return <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'default';
      case 'rescuer':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-background border-b">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Page Title - can be customized per page */}
        <div className="flex-1 lg:ml-0">
          <h2 className="text-lg font-semibold hidden sm:block">Dashboard</h2>
        </div>

        {/* Right Side Actions */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                    {activeAlerts.length > 9 ? '9+' : activeAlerts.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel className="flex items-center justify-between">
                <span>Notifications</span>
                {activeAlerts.length > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {activeAlerts.length} active
                  </Badge>
                )}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {recentAlerts.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No notifications
                </div>
              ) : (
                recentAlerts.map((alert) => (
                  <DropdownMenuItem
                    key={alert.id}
                    className="flex items-start gap-3 py-3 cursor-pointer"
                    onClick={() => handleNotificationClick(alert)}
                  >
                    {getSeverityIcon(alert.severity)}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm truncate",
                        alert.status === 'active' ? 'font-medium' : 'text-muted-foreground'
                      )}>
                        {alert.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatTimeAgo(alert.triggeredAt)}
                      </p>
                    </div>
                    {alert.status === 'active' && (
                      <span className="h-2 w-2 rounded-full bg-destructive shrink-0 mt-1.5" />
                    )}
                  </DropdownMenuItem>
                ))
              )}
              {alerts.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-center justify-center text-sm text-primary cursor-pointer"
                    onClick={() => router.push(getAlertsRoute())}
                  >
                    View all alerts
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {userProfile ? getInitials(userProfile.displayName) : 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{userProfile?.displayName}</p>
                  <p className="text-xs text-muted-foreground">{userProfile?.email}</p>
                  <Badge variant={getRoleBadgeVariant(userProfile?.role || '')} className="w-fit mt-1">
                    {userProfile?.role?.toUpperCase()}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
