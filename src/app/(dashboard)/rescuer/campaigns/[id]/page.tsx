'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth';
import { StatusTimeline, CampaignNotes, statusConfig, AssignDialog } from '@/components/campaigns';
import { NodeAssignmentCard } from '@/components/campaigns/node-assignment-card';
import { RescueDialog } from '@/components/campaigns/rescue-dialog';
import { ResolveCampaignDialog } from '@/components/campaigns/resolve-campaign-dialog';
import { DynamicMapView, DeviceMarkers } from '@/components/map';
import { useCampaignStore, useUserStore, useAlertStore, useDeviceStore } from '@/store';
import { useAuth } from '@/providers/auth-provider';
import { Campaign, CampaignStatus, NodeAssignment, Device } from '@/types';
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
  Users,
  Activity,
  ChevronRight,
  XCircle,
  MessageSquare,
  History,
  AlertTriangle,
  Radio,
  CheckCircle,
  HeartPulse,
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
  params: { id: string };
}

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = params;
  const router = useRouter();
  const { userProfile } = useAuth();
  const {
    campaigns,
    fetchCampaigns,
    getCampaignById,
    updateCampaignStatus,
    addCampaignNote,
    markNodeRescued,
    resolveCampaign,
  } = useCampaignStore();
  const { users, fetchUsers } = useUserStore();
  const { alerts, fetchAlerts } = useAlertStore();
  const { devices, fetchDevices } = useDeviceStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);

  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignNodeId, setAssignNodeId] = useState<string | undefined>();
  const [rescueDialogOpen, setRescueDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<NodeAssignment | null>(null);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);

  const isAdmin = userProfile?.role === 'admin';

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
  const rescuersList = campaign?.assignedRescuerIds?.map(rid =>
    users.find(u => u.id === rid)
  ).filter(Boolean) || [];

  const relatedAlert = campaign?.alertId
    ? alerts.find((a) => a.id === campaign.alertId)
    : null;

  const isAssignedToMe = campaign?.assignedRescuerIds?.includes(userProfile?.id || '') ||
    campaign?.assignedRescuerId === userProfile?.id;
  const isActive = campaign && !['resolved', 'cancelled'].includes(campaign.status);
  const canTakeAction = isAssignedToMe && isActive;
  const nextAction = campaign ? nextStatusMap[campaign.status] : null;

  const nodeCount = campaign?.nodeAssignments?.length || 0;
  const rescuedNodeCount = campaign?.nodeAssignments?.filter(n => n.status === 'rescued').length || 0;
  const allNodesRescued = nodeCount > 0 && rescuedNodeCount === nodeCount;

  const getDeviceName = (deviceId: string) => {
    return devices.find(d => d.id === deviceId)?.name || deviceId;
  };

  // Create map devices from node assignments
  const mapDevices: Device[] = (campaign?.nodeAssignments || []).map(node => {
    const device = devices.find(d => d.id === node.deviceId);
    return {
      id: node.deviceId || node.nodeId,
      name: device?.name || node.nodeId,
      status: node.status === 'rescued' ? 'online' : node.status === 'in_progress' ? 'warning' : 'critical',
      batteryLevel: device?.batteryLevel || 100,
      location: node.location,
      lastSeenAt: device?.lastSeenAt || campaign?.createdAt || '',
      createdAt: device?.createdAt || campaign?.createdAt || '',
    };
  });

  // Handle status change
  const handleStatusChange = async (newStatus: CampaignStatus) => {
    if (!campaign) return;
    try {
      await updateCampaignStatus(campaign.id, newStatus, undefined, userProfile?.displayName);
      toast({
        title: 'Status Updated',
        description: `Campaign status changed to ${newStatus.replace('_', ' ')}.`,
      });
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
      toast({ title: 'Note Added', description: 'Your note has been added.' });
      await fetchCampaigns();
    } catch {
      toast({ title: 'Error', description: 'Failed to add note.', variant: 'destructive' });
    }
  };

  // Handle assign rescuers to node
  const handleAssignNode = (node: NodeAssignment) => {
    setAssignNodeId(node.nodeId);
    setAssignDialogOpen(true);
  };

  // Handle mark rescued
  const handleMarkRescued = (node: NodeAssignment) => {
    setSelectedNode(node);
    setRescueDialogOpen(true);
  };

  const handleConfirmRescue = async (nodeId: string, survivorsFound: number) => {
    if (!campaign || !userProfile) return;
    await markNodeRescued(campaign.id, nodeId, userProfile.id, survivorsFound);
    toast({
      title: 'Node Rescued',
      description: `Node marked as rescued. ${survivorsFound} survivor(s) found.`,
    });
    await fetchCampaigns();
  };

  // Handle resolve campaign
  const handleResolveCampaign = async (note?: string) => {
    if (!campaign || !userProfile) return;
    await resolveCampaign(campaign.id, userProfile.displayName, note);
    toast({
      title: 'Campaign Resolved',
      description: 'Campaign has been successfully resolved.',
    });
    await fetchCampaigns();
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
                  {campaign.name || `Campaign #${campaign.id.slice(-6).toUpperCase()}`}
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
                  {nodeCount > 0 && (
                    <Badge variant="outline">
                      <Radio className="w-3 h-3 mr-1" />
                      {rescuedNodeCount}/{nodeCount} nodes
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {isActive && (isAdmin || allNodesRescued) && (
              <Button
                onClick={() => setResolveDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Resolve Campaign
              </Button>
            )}
            {canTakeAction && nextAction && nextAction.status !== 'resolved' && (
              <Button onClick={() => handleStatusChange(nextAction.status)}>
                <ChevronRight className="w-4 h-4 mr-1" />
                {nextAction.label}
              </Button>
            )}
            {isActive && (
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => handleStatusChange('cancelled')}
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column - Details, Nodes, and Map */}
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
                    <p className="text-sm text-muted-foreground">Assigned Rescuers</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Users className="w-4 h-4" />
                      {rescuersList.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {rescuersList.map(r => r && (
                            <Badge key={r.id} variant="secondary" className="text-xs">
                              {r.displayName}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-amber-600 text-sm">Unassigned</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Survivors Found</p>
                    <p className="font-medium flex items-center gap-1 text-green-600">
                      <HeartPulse className="w-4 h-4" />
                      {campaign.totalSurvivorsFound || 0}
                    </p>
                  </div>
                </div>

                {campaign.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Description</p>
                      <p className="text-sm">{campaign.description}</p>
                    </div>
                  </>
                )}

                {relatedAlert && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Primary Alert</p>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="font-medium">{relatedAlert.title}</p>
                        {relatedAlert.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {relatedAlert.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Node Assignments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="w-5 h-5" />
                    Node Assignments
                  </CardTitle>
                  <Badge variant="secondary">
                    {rescuedNodeCount}/{nodeCount} rescued
                  </Badge>
                </div>
                <CardDescription>
                  Manage individual node rescue operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(campaign.nodeAssignments?.length || 0) === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No nodes assigned</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaign.nodeAssignments.map(node => (
                      <NodeAssignmentCard
                        key={node.nodeId}
                        node={node}
                        deviceName={getDeviceName(node.deviceId)}
                        rescuers={users}
                        onAssignRescuers={isAdmin && isActive ? handleAssignNode : undefined}
                        onMarkRescued={isAdmin && isActive ? handleMarkRescued : undefined}
                        showActions={isActive ?? false}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Location Map */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Node Locations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DynamicMapView
                  center={[campaign.location.latitude, campaign.location.longitude]}
                  zoom={mapDevices.length > 1 ? 6 : 14}
                  className="h-[300px] w-full rounded-lg overflow-hidden"
                >
                  <DeviceMarkers
                    devices={mapDevices}
                    onDeviceClick={() => {}}
                  />
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

            {/* Rescuers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Rescuers
                  <Badge variant="secondary" className="ml-auto">
                    {rescuersList.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rescuersList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No rescuers assigned
                  </p>
                ) : (
                  <div className="space-y-2">
                    {rescuersList.map(rescuer => rescuer && (
                      <div key={rescuer.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{rescuer.displayName}</p>
                          <p className="text-xs text-muted-foreground">{rescuer.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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

      {/* Dialogs */}
      <AssignDialog
        campaign={campaign}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        nodeId={assignNodeId}
        onAssigned={() => {
          setAssignNodeId(undefined);
          fetchCampaigns();
        }}
      />
      <RescueDialog
        node={selectedNode}
        deviceName={selectedNode ? getDeviceName(selectedNode.deviceId) : undefined}
        open={rescueDialogOpen}
        onOpenChange={setRescueDialogOpen}
        onConfirm={handleConfirmRescue}
      />
      <ResolveCampaignDialog
        campaign={campaign}
        open={resolveDialogOpen}
        onOpenChange={setResolveDialogOpen}
        onConfirm={handleResolveCampaign}
      />
    </RoleGuard>
  );
}
