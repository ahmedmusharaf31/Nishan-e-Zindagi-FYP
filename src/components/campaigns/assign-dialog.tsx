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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, User as UserIcon, MapPin } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface AssignDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAssigned?: () => void;
}

export function AssignDialog({ campaign, open, onOpenChange, onAssigned }: AssignDialogProps) {
  const { fetchUsers, getUsersByRole } = useUserStore();
  const { assignCampaign } = useCampaignStore();
  const { toast } = useToast();
  const [selectedRescuerId, setSelectedRescuerId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, fetchUsers]);

  // Reset selection when campaign changes
  useEffect(() => {
    setSelectedRescuerId('');
  }, [campaign]);

  // Get available rescuers
  const rescuers = getUsersByRole('rescuer').filter((u) => u.isActive);

  const handleAssign = async () => {
    if (!campaign || !selectedRescuerId) return;

    setIsSubmitting(true);
    try {
      await assignCampaign(campaign.id, selectedRescuerId);
      toast({
        title: 'Campaign Assigned',
        description: 'The campaign has been assigned to the selected rescuer.',
      });
      onOpenChange(false);
      onAssigned?.();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to assign campaign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedRescuer = rescuers.find((r) => r.id === selectedRescuerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Assign Campaign</DialogTitle>
          <DialogDescription>
            Select a rescuer to assign this campaign to.
          </DialogDescription>
        </DialogHeader>

        {campaign && (
          <div className="space-y-4">
            {/* Campaign Info */}
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">
                  Campaign #{campaign.id.slice(-6).toUpperCase()}
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

            {/* Rescuer Selection */}
            <div className="space-y-2">
              <Label htmlFor="rescuer">Select Rescuer</Label>
              {rescuers.length === 0 ? (
                <div className="text-sm text-muted-foreground p-3 bg-muted rounded-lg text-center">
                  No active rescuers available
                </div>
              ) : (
                <Select value={selectedRescuerId} onValueChange={setSelectedRescuerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a rescuer" />
                  </SelectTrigger>
                  <SelectContent>
                    {rescuers.map((rescuer) => (
                      <SelectItem key={rescuer.id} value={rescuer.id}>
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4" />
                          <span>{rescuer.displayName}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Selected Rescuer Info */}
            {selectedRescuer && (
              <div className="p-3 bg-primary/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{selectedRescuer.displayName}</p>
                    <p className="text-xs text-muted-foreground">{selectedRescuer.email}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedRescuerId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              'Assign Campaign'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
