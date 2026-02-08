"use client";

import { useState, useEffect } from 'react';
import { AuthGuard } from '@/components/auth';
import { Sidebar, Header, MobileSidebar } from '@/components/layout';
import { WebSocketProvider } from '@/providers/websocket-provider';
import { useDeviceStore, useAlertStore, useCampaignStore, useUserStore } from '@/store';
import { seedDemoData } from '@/lib/storage/indexed-db';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Fetch initial data
  const fetchDevices = useDeviceStore(state => state.fetchDevices);
  const fetchAlerts = useAlertStore(state => state.fetchAlerts);
  const fetchCampaigns = useCampaignStore(state => state.fetchCampaigns);
  const fetchUsers = useUserStore(state => state.fetchUsers);

  useEffect(() => {
    // Seed demo data on first load, then fetch all data
    const initializeData = async () => {
      await seedDemoData();
      fetchDevices();
      fetchAlerts();
      fetchCampaigns();
      fetchUsers();
    };
    initializeData();
  }, [fetchDevices, fetchAlerts, fetchCampaigns, fetchUsers]);

  return (
    <AuthGuard>
      <WebSocketProvider autoConnect={true}>
        <div className="min-h-screen bg-background">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Mobile Sidebar */}
          <MobileSidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
          />

          {/* Main Content */}
          <div className="lg:pl-64">
            <Header onMenuClick={() => setIsMobileSidebarOpen(true)} />
            <main className="p-4 lg:p-6">{children}</main>
          </div>
        </div>
      </WebSocketProvider>
    </AuthGuard>
  );
}
