'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth';
import { StatusTimeline, CampaignNotes, statusConfig } from '@/components/campaigns';
import { DynamicMapView, DeviceMarkers } from '@/components/map';
import { useCampaignStore, useUserStore, useAlertStore, useDeviceStore } from '@/store';
import { useAuth } from '@/providers/auth-provider';
import { Campaign, CampaignStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { formatDateTime } from '@/lib/utils';
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Activity,
  ChevronRight,
  XCircle,
  MessageSquare,
  History,
  AlertTriangle,
} from 'lucide-react';

// Valid status transitions for action buttons
const nextStatusMap: Partial<Record<CampaignStatus, { status: CampaignStatus; label: string }>> = {
  assigned: { status: 'accepted', label: 'Accept' },
  accepted: { status: 'en_route', label: 'Start Route' },
  en_route: { status: 'on_scene', label: 'Arrived' },
  on_scene: { status: 'in_progress', label: 'Start Work' },
  in_progress: { status: 'resolved', label: 'Resolve' },
};

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { userProfile } = useAuth();
  const {
    campaigns,
    fetchCampaigns,
    getCampaignById,
    updateCampaignStatus,
    addCampaignNote,
  } = useCampaignStore();
  const { users, fetchUsers } = useUserStore();
  const { alerts, fetchAlerts } = useAlertStore();
  const { devices, fetchDevices } = useDeviceStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCampaigns(), fetchUsers(), fetchAlerts(), fetchDevices()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchCampaigns, fetchUsers, fetchAlerts, fetchDevices]);

  // Get campaign when data loads
  useEffect(() => {
    if (!isLoading) {
      const found = getCampaignById(id);
      setCampaign(found || null);
    }
  }, [id, campaigns, isLoading, getCampaignById]);

  // Get related data
  const rescuer = campaign?.assignedRescuerId
    ? users.find((u) => u.id === campaign.assignedRescuerId)
    : null;

  const relatedAlert = campaign?.alertId
    ? alerts.find((a) => a.id === campaign.alertId)
    : null;

  const relatedDevice = relatedAlert?.deviceId
    ? devices.find((d) => d.id === relatedAlert.deviceId)
    : null;

  const isAssignedToMe = campaign?.assignedRescuerId === userProfile?.id;
  const isActive = campaign && !['resolved', 'cancelled'].includes(campaign.status);
  const canTakeAction = isAssignedToMe && isActive;
  const nextAction = campaign ? nextStatusMap[campaign.status] : null;

  // Handle status change
  const handleStatusChange = async (newStatus: CampaignStatus) => {
    if (!campaign) return;

    try {
      await updateCampaignStatus(campaign.id, newStatus, undefined, userProfile?.displayName);
      toast({
        title: 'Status Updated',
        description: `Campaign status changed to ${newStatus.replace('_', ' ')}.`,
      });
      // Refresh campaign data
      await fetchCampaigns();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update campaign status.',
        variant: 'destructive',
      });
    }
  };

  // Handle add note
  const handleAddNote = async (content: string) => {
    if (!campaign || !userProfile) return;

    try {
      await addCampaignNote(campaign.id, content, userProfile.displayName);
      toast({
        title: 'Note Added',
        description: 'Your note has been added to the campaign.',
      });
      await fetchCampaigns();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to add note.',
        variant: 'destructive',
      });
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <RoleGuard allowedRoles={['rescuer', 'admin']} fallbackUrl="/public">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading campaign...</p>
          </div>
        </div>
      </RoleGuard>
    );
  }

  // Not found state
  if (!campaign) {
    return (
      <RoleGuard allowedRoles={['rescuer', 'admin']} fallbackUrl="/public">
        <div className="flex items-center justify-center h-64">
          <Card className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="font-semibold text-lg mb-2">Campaign Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The campaign you&apos;re looking for doesn&apos;t exist.
            </p>
            <Button onClick={() => router.push('/rescuer/campaigns')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
          </Card>
        </div>
      </RoleGuard>
    );
  }

  const status = statusConfig[campaign.status];
  const StatusIcon = status.icon;

  return (
    <RoleGuard allowedRoles={['rescuer', 'admin']} fallbackUrl="/public">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              className="mb-2"
              onClick={() => router.push('/rescuer/campaigns')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaigns
            </Button>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${status.bgColor}`}>
                <StatusIcon className={`w-6 h-6 ${status.color}`} />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Campaign #{campaign.id.slice(-6).toUpperCase()}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={isActive ? 'default' : 'outline'} className={status.color}>
                    {isActive && (
                      <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse mr-1" />
                    )}
                    {status.label}
                  </Badge>
                  {isAssignedToMe && (
                    <Badge variant="secondary">Assigned to me</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {canTakeAction && nextAction && (
            <div className="flex items-center gap-2">
              <Button onClick={() => handleStatusChange(nextAction.status)}>
                <ChevronRight className="w-4 h-4 mr-1" />
                {nextAction.label}
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => handleStatusChange('cancelled')}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Details and Map */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Details */}
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDateTime(campaign.createdAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDateTime(campaign.updatedAt)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Rescuer</p>
                    <p className="font-medium flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {rescuer?.displayName || 'Unassigned'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {campaign.location.latitude.toFixed(4)}, {campaign.location.longitude.toFixed(4)}
                    </p>
                  </div>
                </div>

                {relatedAlert && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Related Alert</p>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium">{relatedAlert.title}</p>
                        {relatedAlert.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {relatedAlert.description}
                          </p>
                        )}
                        {relatedDevice && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Device: {relatedDevice.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Location Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicMapView
                  center={[campaign.location.latitude, campaign.location.longitude]}
                  zoom={14}
                  className="h-[300px] w-full rounded-lg overflow-hidden"
                >
                  {relatedDevice ? (
                    <DeviceMarkers
                      devices={[relatedDevice]}
                      onDeviceClick={() => {}}
                    />
                  ) : (
                    <DeviceMarkers
                      devices={[{
                        id: 'campaign-location',
                        name: `Campaign ${campaign.id.slice(-6).toUpperCase()}`,
                        status: 'warning',
                        batteryLevel: 100,
                        location: campaign.location,
                        lastSeenAt: campaign.createdAt,
                        createdAt: campaign.createdAt,
                      }]}
                      onDeviceClick={() => {}}
                    />
                  )}
                </DynamicMapView>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Timeline and Notes */}
          <div className="space-y-6">
            {/* Status Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusTimeline history={campaign.statusHistory} />
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Notes
                  {campaign.notes.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {campaign.notes.length}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Add notes to track important information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CampaignNotes
                  notes={campaign.notes}
                  onAddNote={handleAddNote}
                  maxHeight="250px"
                  readOnly={!isActive}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
