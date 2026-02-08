'use client';

import { useState, useEffect } from 'react';
import { Campaign } from '@/types';
import { useUserStore } from '@/store/user-store';
import { useCampaignStore } from '@/store/campaign-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, User as UserIcon, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AssignDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned?: () => void;
  nodeId?: string;
}

export function AssignDialog({ campaign, open, onOpenChange, onAssigned, nodeId }: AssignDialogProps) {
  const { fetchUsers, getUsersByRole } = useUserStore();
  const { assignCampaign, assignNodeToRescuers } = useCampaignStore();
  const { toast } = useToast();
  const [selectedRescuerIds, setSelectedRescuerIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, fetchUsers]);

  useEffect(() => {
    if (campaign && nodeId) {
      const node = campaign.nodeAssignments?.find(n => n.nodeId === nodeId);
      setSelectedRescuerIds(node?.assignedRescuerIds || []);
    } else {
      setSelectedRescuerIds(campaign?.assignedRescuerIds || []);
    }
  }, [campaign, nodeId]);

  const rescuers = getUsersByRole('rescuer').filter((u) => u.isActive);

  const toggleRescuer = (rescuerId: string) => {
    setSelectedRescuerIds(prev =>
      prev.includes(rescuerId) ? prev.filter(id => id !== rescuerId) : [...prev, rescuerId]
    );
  };

  const handleAssign = async () => {
    if (!campaign || selectedRescuerIds.length === 0) return;

    setIsSubmitting(true);
    try {
      if (nodeId) {
        await assignNodeToRescuers(campaign.id, nodeId, selectedRescuerIds);
        toast({
          title: 'Rescuers Assigned to Node',
          description: `${selectedRescuerIds.length} rescuer(s) assigned to node.`,
        });
      } else {
        await assignCampaign(campaign.id, selectedRescuerIds);
        toast({
          title: 'Campaign Assigned',
          description: `${selectedRescuerIds.length} rescuer(s) assigned to campaign.`,
        });
      }
      onOpenChange(false);
      onAssigned?.();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to assign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{nodeId ? 'Assign Rescuers to Node' : 'Assign Campaign'}</DialogTitle>
          <DialogDescription>
            {nodeId
              ? 'Select rescuers to assign to this node.'
              : 'Select rescuers to assign to this campaign.'}
          </DialogDescription>
        </DialogHeader>

        {campaign && (
          <div className="space-y-4">
            {/* Campaign Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  {campaign.name || `Campaign #${campaign.id.slice(-6).toUpperCase()}`}
                </span>
                <Badge variant="outline">
                  {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {campaign.location.latitude.toFixed(4)}, {campaign.location.longitude.toFixed(4)}
              </div>
            </div>

            {/* Rescuer Selection - Multi-select */}
            <ScrollArea className="h-[250px]">
              <div className="space-y-2 pr-4">
                {rescuers.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg text-center">
                    No active rescuers available
                  </div>
                ) : (
                  rescuers.map((rescuer) => {
                    const isSelected = selectedRescuerIds.includes(rescuer.id);
                    return (
                      <div
                        key={rescuer.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                        }`}
                        onClick={() => toggleRescuer(rescuer.id)}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox checked={isSelected} />
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{rescuer.displayName}</p>
                            <p className="text-xs text-muted-foreground">{rescuer.email}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={selectedRescuerIds.length === 0 || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              `Assign ${selectedRescuerIds.length} Rescuer${selectedRescuerIds.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
