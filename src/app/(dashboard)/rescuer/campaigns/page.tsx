'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RoleGuard } from '@/components/auth';
import { CampaignCard, AssignDialog, CreateCampaignDialog } from '@/components/campaigns';
import { StatsCard } from '@/components/dashboard';
import { useCampaignStore, useUserStore } from '@/store';
import { useAuth } from '@/providers/auth-provider';
import { Campaign, CampaignStatus } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import {
  Megaphone,
  Search,
  RefreshCcw,
  Plus,
  Radio,
  Users,
  HeartPulse,
} from 'lucide-react';

type TabValue = 'all' | 'active' | 'mine' | 'unassigned' | 'resolved';

export default function CampaignsPage() {
  const router = useRouter();
  const { userProfile } = useAuth();
  const {
    campaigns,
    fetchCampaigns,
    updateCampaignStatus,
    getActiveCampaigns,
    getCampaignsByRescuer,
    getCampaignStats,
  } = useCampaignStore();
  const { users, fetchUsers } = useUserStore();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabValue>('all');
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const isAdmin = userProfile?.role === 'admin';
  const isRescuer = userProfile?.role === 'rescuer';

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchCampaigns(), fetchUsers()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchCampaigns, fetchUsers]);

  // Get rescuer name helper
  const getRescuerName = useCallback((rescuerId?: string) => {
    if (!rescuerId) return undefined;
    const rescuer = users.find((u) => u.id === rescuerId);
    return rescuer?.displayName;
  }, [users]);

  // Campaign stats
  const stats = getCampaignStats();

  // Filter campaigns based on tab and search
  const filteredCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Tab filtering
    switch (activeTab) {
      case 'active':
        filtered = getActiveCampaigns();
        break;
      case 'mine':
        filtered = getCampaignsByRescuer(userProfile?.id || '');
        break;
      case 'unassigned':
        filtered = campaigns.filter((c) => c.status === 'initiated');
        break;
      case 'resolved':
        filtered = campaigns.filter((c) => ['resolved', 'cancelled'].includes(c.status));
        break;
    }

    // Search filtering
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.id.toLowerCase().includes(query) ||
          c.name?.toLowerCase().includes(query) ||
          getRescuerName(c.assignedRescuerId)?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [campaigns, activeTab, searchQuery, userProfile?.id, getActiveCampaigns, getCampaignsByRescuer, getRescuerName]);

  // Handle status change
  const handleStatusChange = async (campaignId: string, newStatus: CampaignStatus) => {
    try {
      await updateCampaignStatus(campaignId, newStatus, undefined, userProfile?.displayName);
      toast({
        title: 'Status Updated',
        description: `Campaign status changed to ${newStatus.replace('_', ' ')}.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update campaign status.',
        variant: 'destructive',
      });
    }
  };

  // Handle assign click
  const handleAssignClick = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setAssignDialogOpen(true);
  };

  // Handle view details
  const handleViewDetails = (campaign: Campaign) => {
    router.push(`/rescuer/campaigns/${campaign.id}`);
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchCampaigns(), fetchUsers()]);
    setIsLoading(false);
  };

  // Tab counts
  const tabCounts = useMemo(() => ({
    all: campaigns.length,
    active: getActiveCampaigns().length,
    mine: getCampaignsByRescuer(userProfile?.id || '').length,
    unassigned: campaigns.filter((c) => c.status === 'initiated').length,
    resolved: campaigns.filter((c) => ['resolved', 'cancelled'].includes(c.status)).length,
  }), [campaigns, userProfile?.id, getActiveCampaigns, getCampaignsByRescuer]);

  return (
    <RoleGuard allowedRoles={['rescuer', 'admin']} fallbackUrl="/public">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Megaphone className="w-6 h-6" />
              Campaigns
            </h1>
            <p className="text-muted-foreground">
              Manage and track rescue campaigns
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create Campaign
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Deployed Nodes"
            value={stats.deployedNodes}
            description="Active campaign nodes"
            icon={Radio}
          />
          <StatsCard
            title="Deployed Rescuers"
            value={stats.deployedRescuers}
            description="In active campaigns"
            icon={Users}
          />
          <StatsCard
            title="Active Campaigns"
            value={stats.activeCampaigns}
            description={`${stats.totalCampaigns} total`}
            icon={Megaphone}
          />
          <StatsCard
            title="Survivors Found"
            value={stats.totalSurvivorsFound}
            description={`${stats.resolvedCampaigns} resolved campaigns`}
            icon={HeartPulse}
          />
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, ID, or rescuer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="relative">
              All
              <Badge variant="secondary" className="ml-2 text-xs">
                {tabCounts.all}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="active">
              Active
              <Badge variant="secondary" className="ml-2 text-xs">
                {tabCounts.active}
              </Badge>
            </TabsTrigger>
            {isRescuer && (
              <TabsTrigger value="mine">
                My Campaigns
                <Badge variant="secondary" className="ml-2 text-xs">
                  {tabCounts.mine}
                </Badge>
              </TabsTrigger>
            )}
            {isAdmin && (
              <TabsTrigger value="unassigned">
                Unassigned
                <Badge variant="secondary" className="ml-2 text-xs">
                  {tabCounts.unassigned}
                </Badge>
              </TabsTrigger>
            )}
            <TabsTrigger value="resolved">
              Resolved
              <Badge variant="secondary" className="ml-2 text-xs">
                {tabCounts.resolved}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <ScrollArea className="h-[calc(100vh-500px)]">
              {filteredCampaigns.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Megaphone className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="font-semibold mb-1">No campaigns found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery
                        ? 'Try adjusting your search query'
                        : 'There are no campaigns in this category'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3 pr-4">
                  {filteredCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign.id}
                      campaign={campaign}
                      rescuerName={getRescuerName(campaign.assignedRescuerId)}
                      onViewDetails={handleViewDetails}
                      onStatusChange={handleStatusChange}
                      onAssign={isAdmin ? handleAssignClick : undefined}
                      isAssignedToMe={
                        campaign.assignedRescuerIds?.includes(userProfile?.id || '') ||
                        campaign.assignedRescuerId === userProfile?.id
                      }
                      showActions={true}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Assign Dialog */}
        <AssignDialog
          campaign={selectedCampaign}
          open={assignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          onAssigned={() => {
            setSelectedCampaign(null);
            fetchCampaigns();
          }}
        />

        {/* Create Campaign Dialog */}
        {isAdmin && (
          <CreateCampaignDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onCreated={() => fetchCampaigns()}
          />
        )}
      </div>
    </RoleGuard>
  );
}
