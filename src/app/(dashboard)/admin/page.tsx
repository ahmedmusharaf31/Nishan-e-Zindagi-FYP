"use client";

import { useState } from 'react';
import { RoleGuard } from '@/components/auth';
import { StatsCard } from '@/components/dashboard';
import { DeviceGrid } from '@/components/devices';
import { CreateCampaignDialog } from '@/components/campaigns';
import { useUserStore, useDeviceStore, useAlertStore, useCampaignStore } from '@/store';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { uploadDataToCloud } from '@/lib/firebase/cloud-sync';
import { Users, Radio, Bell, Megaphone, Plus, UploadCloud, Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const { users } = useUserStore();
  const { devices } = useDeviceStore();
  const { getActiveAlerts } = useAlertStore();
  const { getActiveCampaigns, fetchCampaigns } = useCampaignStore();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const activeAlerts = getActiveAlerts();
  const activeCampaigns = getActiveCampaigns();
  const onlineDevices = devices.filter(d => d.status === 'online');

  const handleUploadCloud = async () => {
    setIsUploading(true);
    try {
      const result = await uploadDataToCloud();
      toast({
        title: 'Data uploaded to cloud',
        description: `Synced ${result.users} users, ${result.devices} devices, ${result.alerts} alerts, ${result.campaigns} campaigns, ${result.sensorReadings} sensor readings.`,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <RoleGuard allowedRoles={['admin']} fallbackUrl="/rescuer">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              System overview and device monitoring
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleUploadCloud}
              disabled={isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UploadCloud className="w-4 h-4" />
              )}
              {isUploading ? 'Uploading...' : 'Upload to Cloud'}
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Start Campaign
            </Button>
          </div>
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

        {/* Create Campaign Dialog */}
        <CreateCampaignDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onCreated={() => fetchCampaigns()}
        />
      </div>
    </RoleGuard>
  );
}
