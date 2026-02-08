'use client';

import { useState } from 'react';
import { Campaign } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Users, Radio } from 'lucide-react';

interface ResolveCampaignDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (note?: string) => Promise<void>;
}

export function ResolveCampaignDialog({ campaign, open, onOpenChange, onConfirm }: ResolveCampaignDialogProps) {
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!campaign) return null;

  const totalNodes = campaign.nodeAssignments?.length || 0;
  const rescuedNodes = campaign.nodeAssignments?.filter(n => n.status === 'rescued').length || 0;
  const totalSurvivors = campaign.nodeAssignments?.reduce((sum, n) => sum + (n.survivorsFound || 0), 0) || 0;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(note || undefined);
      onOpenChange(false);
      setNote('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Resolve Campaign
          </DialogTitle>
          <DialogDescription>
            Finalize and close this rescue campaign
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-medium">{campaign.name || `Campaign #${campaign.id.slice(-6).toUpperCase()}`}</h4>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 text-sm font-bold">
                  <Radio className="w-3 h-3" />
                  {rescuedNodes}/{totalNodes}
                </div>
                <p className="text-xs text-muted-foreground">Nodes Rescued</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-sm font-bold">
                  <Users className="w-3 h-3" />
                  {campaign.assignedRescuerIds?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">Rescuers</p>
              </div>
              <div>
                <div className="text-sm font-bold text-green-600">{totalSurvivors}</div>
                <p className="text-xs text-muted-foreground">Survivors Found</p>
              </div>
            </div>
          </div>

          {rescuedNodes < totalNodes && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Warning: Not all nodes have been rescued ({totalNodes - rescuedNodes} remaining).
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="resolve-note">Final Note (optional)</Label>
            <Input
              id="resolve-note"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Campaign outcome summary..."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">Duration: {getDuration(campaign.createdAt)}</Badge>
            <Badge variant="outline" className="text-green-600">{totalSurvivors} survivors</Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resolving...
              </>
            ) : (
              'Resolve Campaign'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDuration(startDate: string): string {
  const diff = Date.now() - new Date(startDate).getTime();
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return `${hours}h ${minutes}m`;
}
