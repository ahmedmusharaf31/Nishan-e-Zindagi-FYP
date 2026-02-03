import { create } from 'zustand';
import { Campaign, CampaignStatus, CampaignNote, CampaignStatusHistoryEntry } from '@/types';
import { db } from '@/lib/storage/indexed-db';
import { generateId } from '@/lib/utils';

interface CampaignState {
  campaigns: Campaign[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchCampaigns: () => Promise<void>;
  addCampaign: (campaign: Campaign) => Promise<void>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<void>;
  updateCampaignStatus: (id: string, status: CampaignStatus, note?: string, updatedBy?: string) => Promise<void>;
  assignCampaign: (id: string, rescuerId: string) => Promise<void>;
  addCampaignNote: (id: string, content: string, createdBy: string) => Promise<void>;
  deleteCampaign: (id: string) => Promise<void>;
  getCampaignById: (id: string) => Campaign | undefined;
  getCampaignsByStatus: (status: CampaignStatus) => Campaign[];
  getCampaignsByRescuer: (rescuerId: string) => Campaign[];
  getActiveCampaigns: () => Campaign[];
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

  assignCampaign: async (id: string, rescuerId: string) => {
    const campaign = get().getCampaignById(id);
    if (!campaign) {
      set({ error: 'Campaign not found' });
      return;
    }

    if (campaign.status !== 'initiated') {
      set({ error: 'Campaign can only be assigned when initiated' });
      return;
    }

    const historyEntry: CampaignStatusHistoryEntry = {
      status: 'assigned',
      timestamp: new Date().toISOString(),
      note: `Assigned to rescuer`,
    };

    await get().updateCampaign(id, {
      assignedRescuerId: rescuerId,
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
    return get().campaigns.filter(campaign => campaign.assignedRescuerId === rescuerId);
  },

  getActiveCampaigns: () => {
    const inactiveStatuses: CampaignStatus[] = ['resolved', 'cancelled'];
    return get().campaigns.filter(campaign => !inactiveStatuses.includes(campaign.status));
  },
}));

// Export with a more descriptive name
export const useCampaignStore = useStore;
