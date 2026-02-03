"use client";

import { RoleGuard } from '@/components/auth';
import { StatsCard } from '@/components/dashboard';
import { DeviceGrid } from '@/components/devices';
import { useUserStore, useDeviceStore, useAlertStore, useCampaignStore } from '@/store';
import { Users, Radio, Bell, Megaphone } from 'lucide-react';

export default function AdminDashboardPage() {
  const { users } = useUserStore();
  const { devices } = useDeviceStore();
  const { getActiveAlerts } = useAlertStore();
  const { getActiveCampaigns } = useCampaignStore();

  const activeAlerts = getActiveAlerts();
  const activeCampaigns = getActiveCampaigns();
  const onlineDevices = devices.filter(d => d.status === 'online');

  return (
    <RoleGuard allowedRoles={['admin']} fallbackUrl="/rescuer">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System overview and device monitoring
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Users"
            value={users.length}
            description={`${users.filter(u => u.role === 'rescuer').length} rescuers`}
            icon={Users}
          />
          <StatsCard
            title="Devices"
            value={devices.length}
            description={`${onlineDevices.length} online`}
            icon={Radio}
          />
          <StatsCard
            title="Active Alerts"
            value={activeAlerts.length}
            description={`${activeAlerts.filter(a => a.severity === 'critical').length} critical`}
            icon={Bell}
          />
          <StatsCard
            title="Active Campaigns"
            value={activeCampaigns.length}
            description="Rescue operations in progress"
            icon={Megaphone}
          />
        </div>

        {/* Device Grid */}
        <DeviceGrid />
      </div>
    </RoleGuard>
  );
}
