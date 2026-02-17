import { create } from 'zustand';
import { Campaign, CampaignStatus, CampaignNote, CampaignStatusHistoryEntry, CampaignStats, NodeAssignment } from '@/types';
import { db } from '@/lib/storage/indexed-db';
import { generateId } from '@/lib/utils';
import { useAlertStore } from '@/store/alert-store';

interface CampaignState {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCampaigns: () => Promise<void>;
  addCampaign: (campaign: Campaign) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  updateCampaignStatus: (id: string, status: CampaignStatus, note?: string, updatedBy?: string) => Promise<void>;
  assignCampaign: (id: string, rescuerIds: string | string[]) => Promise<void>;
  addCampaignNote: (id: string, content: string, createdBy: string) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  getCampaignById: (id: string) => Campaign | undefined;
  getCampaignsByStatus: (status: CampaignStatus) => Campaign[];
  getCampaignsByRescuer: (rescuerId: string) => Campaign[];
  getActiveCampaigns: () => Campaign[];

  // New multi-node/multi-rescuer methods
  createCampaignFromAlerts: (name: string, alertIds: string[], rescuerIds?: string[], alertDeviceMap?: Record<string, { deviceId: string; location: { latitude: number; longitude: number } }>) => Promise<Campaign>;
  createCampaignFromDevices: (name: string, deviceIds: string[], rescuerIds?: string[], deviceMap?: Record<string, { location: { latitude: number; longitude: number } }>) => Promise<Campaign>;
  assignNodeToRescuers: (campaignId: string, nodeId: string, rescuerIds: string[]) => Promise<void>;
  markNodeRescued: (campaignId: string, nodeId: string, rescuedBy: string, survivorsFound?: number) => Promise<void>;
  resolveCampaign: (campaignId: string, resolvedBy: string, note?: string) => Promise<void>;
  getCampaignStats: () => CampaignStats;
  getCampaignsByDateRange: (startDate: Date, endDate: Date) => Campaign[];
}

// Valid status transitions
const STATUS_TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  initiated: ['assigned', 'cancelled'],
  assigned: ['accepted', 'cancelled'],
  accepted: ['en_route', 'cancelled'],
  en_route: ['on_scene', 'cancelled'],
  on_scene: ['in_progress', 'cancelled'],
  in_progress: ['resolved', 'cancelled'],
  resolved: [],
  cancelled: [],
};

export const useStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  isLoading: false,
  error: null,

  fetchCampaigns: async () => {
    set({ isLoading: true, error: null });
    try {
      const campaigns = await db.campaigns.toArray();
      // Sort by created date, newest first
      campaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      set({ campaigns, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCampaign: async (campaign: Campaign) => {
    try {
      await db.campaigns.add(campaign);
      set(state => ({ campaigns: [campaign, ...state.campaigns] }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateCampaign: async (id: string, updates: Partial<Campaign>) => {
    try {
      const updatedData = { ...updates, updatedAt: new Date().toISOString() };
      await db.campaigns.update(id, updatedData);
      set(state => ({
        campaigns: state.campaigns.map(campaign =>
          campaign.id === id ? { ...campaign, ...updatedData } : campaign
        ),
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateCampaignStatus: async (id: string, newStatus: CampaignStatus, note?: string, updatedBy?: string) => {
    const campaign = get().getCampaignById(id);
    if (!campaign) {
      set({ error: 'Campaign not found' });
      return;
    }

    // Validate status transition
    const allowedTransitions = STATUS_TRANSITIONS[campaign.status];
    if (!allowedTransitions.includes(newStatus)) {
      set({ error: `Invalid status transition from ${campaign.status} to ${newStatus}` });
      return;
    }

    const historyEntry: CampaignStatusHistoryEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note,
      updatedBy,
    };

    await get().updateCampaign(id, {
      status: newStatus,
      statusHistory: [...campaign.statusHistory, historyEntry],
    });
  },

  assignCampaign: async (id: string, rescuerIds: string | string[]) => {
    const campaign = get().getCampaignById(id);
    if (!campaign) {
      set({ error: 'Campaign not found' });
      return;
    }

    if (campaign.status !== 'initiated') {
      set({ error: 'Campaign can only be assigned when initiated' });
      return;
    }

    const ids = Array.isArray(rescuerIds) ? rescuerIds : [rescuerIds];

    const historyEntry: CampaignStatusHistoryEntry = {
      status: 'assigned',
      timestamp: new Date().toISOString(),
      note: `Assigned to ${ids.length} rescuer(s)`,
    };

    await get().updateCampaign(id, {
      assignedRescuerId: ids[0],
      assignedRescuerIds: ids,
      status: 'assigned',
      statusHistory: [...campaign.statusHistory, historyEntry],
    });
  },

  addCampaignNote: async (id: string, content: string, createdBy: string) => {
    const campaign = get().getCampaignById(id);
    if (!campaign) {
      set({ error: 'Campaign not found' });
      return;
    }

    const note: CampaignNote = {
      id: generateId(),
      content,
      createdAt: new Date().toISOString(),
      createdBy,
    };

    await get().updateCampaign(id, {
      notes: [...campaign.notes, note],
    });
  },

  deleteCampaign: async (id: string) => {
    try {
      await db.campaigns.delete(id);
      set(state => ({ campaigns: state.campaigns.filter(campaign => campaign.id !== id) }));
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  getCampaignById: (id: string) => {
    return get().campaigns.find(campaign => campaign.id === id);
  },

  getCampaignsByStatus: (status: CampaignStatus) => {
    return get().campaigns.filter(campaign => campaign.status === status);
  },

  getCampaignsByRescuer: (rescuerId: string) => {
    return get().campaigns.filter(campaign =>
      campaign.assignedRescuerIds?.includes(rescuerId) ||
      campaign.assignedRescuerId === rescuerId
    );
  },

  getActiveCampaigns: () => {
    const inactiveStatuses: CampaignStatus[] = ['resolved', 'cancelled'];
    return get().campaigns.filter(campaign => !inactiveStatuses.includes(campaign.status));
  },

  // New multi-node/multi-rescuer methods

  createCampaignFromAlerts: async (name, alertIds, rescuerIds = [], alertDeviceMap = {}) => {
    const nodeAssignments: NodeAssignment[] = alertIds.map((alertId, index) => {
      const info = alertDeviceMap[alertId];
      return {
        nodeId: `node-${generateId()}-${index}`,
        deviceId: info?.deviceId || '',
        alertId,
        assignedRescuerIds: [],
        location: info?.location || { latitude: 0, longitude: 0 },
        status: 'pending' as const,
      };
    });

    const firstLocation = nodeAssignments[0]?.location || { latitude: 0, longitude: 0 };

    const campaign: Campaign = {
      id: `campaign-${generateId()}`,
      name,
      alertId: alertIds[0],
      alertIds,
      assignedRescuerId: rescuerIds[0],
      assignedRescuerIds: rescuerIds,
      nodeAssignments,
      status: rescuerIds.length > 0 ? 'assigned' : 'initiated',
      location: firstLocation,
      statusHistory: [
        {
          status: 'initiated',
          timestamp: new Date().toISOString(),
          note: `Campaign created with ${alertIds.length} node(s)`,
        },
        ...(rescuerIds.length > 0
          ? [
              {
                status: 'assigned' as CampaignStatus,
                timestamp: new Date().toISOString(),
                note: `Assigned to ${rescuerIds.length} rescuer(s)`,
              },
            ]
          : []),
      ],
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await get().addCampaign(campaign);
    return campaign;
  },

  createCampaignFromDevices: async (name, deviceIds, rescuerIds = [], deviceMap = {}) => {
    const nodeAssignments: NodeAssignment[] = deviceIds.map((deviceId, index) => {
      const info = deviceMap[deviceId];
      return {
        nodeId: `node-${generateId()}-${index}`,
        deviceId,
        alertId: '',
        assignedRescuerIds: [],
        location: info?.location || { latitude: 0, longitude: 0 },
        status: 'pending' as const,
      };
    });

    const firstLocation = nodeAssignments[0]?.location || { latitude: 0, longitude: 0 };

    const campaign: Campaign = {
      id: `campaign-${generateId()}`,
      name,
      alertIds: [],
      assignedRescuerId: rescuerIds[0],
      assignedRescuerIds: rescuerIds,
      nodeAssignments,
      status: rescuerIds.length > 0 ? 'assigned' : 'initiated',
      location: firstLocation,
      statusHistory: [
        {
          status: 'initiated',
          timestamp: new Date().toISOString(),
          note: `Campaign created with ${deviceIds.length} device(s)`,
        },
        ...(rescuerIds.length > 0
          ? [
              {
                status: 'assigned' as CampaignStatus,
                timestamp: new Date().toISOString(),
                note: `Assigned to ${rescuerIds.length} rescuer(s)`,
              },
            ]
          : []),
      ],
      notes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await get().addCampaign(campaign);
    return campaign;
  },

  assignNodeToRescuers: async (campaignId, nodeId, rescuerIds) => {
    const campaign = get().getCampaignById(campaignId);
    if (!campaign) {
      set({ error: 'Campaign not found' });
      return;
    }

    const updatedNodes = campaign.nodeAssignments.map(node =>
      node.nodeId === nodeId
        ? { ...node, assignedRescuerIds: rescuerIds, status: 'assigned' as const }
        : node
    );

    // Merge new rescuerIds into campaign-level assignedRescuerIds
    const allRescuerIds = new Set(campaign.assignedRescuerIds || []);
    rescuerIds.forEach(id => allRescuerIds.add(id));

    await get().updateCampaign(campaignId, {
      nodeAssignments: updatedNodes,
      assignedRescuerIds: Array.from(allRescuerIds),
    });
  },

  markNodeRescued: async (campaignId, nodeId, rescuedBy, survivorsFound = 0) => {
    const campaign = get().getCampaignById(campaignId);
    if (!campaign) {
      set({ error: 'Campaign not found' });
      return;
    }

    const updatedNodes = campaign.nodeAssignments.map(node =>
      node.nodeId === nodeId
        ? {
            ...node,
            status: 'rescued' as const,
            rescuedAt: new Date().toISOString(),
            rescuedBy,
            survivorsFound,
          }
        : node
    );

    const totalSurvivors = updatedNodes.reduce(
      (sum, node) => sum + (node.survivorsFound || 0),
      0
    );

    await get().updateCampaign(campaignId, {
      nodeAssignments: updatedNodes,
      totalSurvivorsFound: totalSurvivors,
    });
  },

  resolveCampaign: async (campaignId, resolvedBy, note) => {
    const campaign = get().getCampaignById(campaignId);
    if (!campaign) {
      set({ error: 'Campaign not found' });
      return;
    }

    const totalSurvivors = campaign.nodeAssignments.reduce(
      (sum, node) => sum + (node.survivorsFound || 0),
      0
    );

    const historyEntry: CampaignStatusHistoryEntry = {
      status: 'resolved',
      timestamp: new Date().toISOString(),
      note: note || `Campaign resolved. ${totalSurvivors} survivors found.`,
      updatedBy: resolvedBy,
    };

    // Allow resolving from any active status
    await get().updateCampaign(campaignId, {
      status: 'resolved',
      resolvedAt: new Date().toISOString(),
      totalSurvivorsFound: totalSurvivors,
      statusHistory: [...campaign.statusHistory, historyEntry],
    });

    // Resolve all associated alerts
    const alertStore = useAlertStore.getState();
    for (const alertId of campaign.alertIds || []) {
      const alert = alertStore.getAlertById(alertId);
      if (alert && alert.status !== 'resolved') {
        await alertStore.resolveAlert(alertId);
      }
    }
    // Also resolve alerts linked through node assignments
    for (const node of campaign.nodeAssignments || []) {
      if (node.alertId) {
        const alert = alertStore.getAlertById(node.alertId);
        if (alert && alert.status !== 'resolved') {
          await alertStore.resolveAlert(node.alertId);
        }
      }
    }
  },

  getCampaignStats: () => {
    const campaigns = get().campaigns;
    const activeCampaigns = campaigns.filter(
      c => !['resolved', 'cancelled'].includes(c.status)
    );

    const deployedNodes = activeCampaigns.reduce(
      (sum, c) => sum + (c.nodeAssignments?.length || 0),
      0
    );

    const deployedRescuerSet = new Set<string>();
    activeCampaigns.forEach(c => {
      (c.assignedRescuerIds || []).forEach(id => deployedRescuerSet.add(id));
    });

    const totalSurvivorsFound = campaigns.reduce(
      (sum, c) => sum + (c.totalSurvivorsFound || 0),
      0
    );

    return {
      deployedNodes,
      deployedRescuers: deployedRescuerSet.size,
      activeCampaigns: activeCampaigns.length,
      totalSurvivorsFound,
      resolvedCampaigns: campaigns.filter(c => c.status === 'resolved').length,
      totalCampaigns: campaigns.length,
    };
  },

  getCampaignsByDateRange: (startDate, endDate) => {
    return get().campaigns.filter(campaign => {
      const created = new Date(campaign.createdAt);
      return created >= startDate && created <= endDate;
    });
  },
}));

// Export with a more descriptive name
export const useCampaignStore = useStore;
