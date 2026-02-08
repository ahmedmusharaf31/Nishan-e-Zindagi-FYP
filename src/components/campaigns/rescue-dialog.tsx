'use client';

import { useState } from 'react';
import { NodeAssignment } from '@/types';
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
import { Loader2, MapPin, HeartPulse } from 'lucide-react';

interface RescueDialogProps {
  node: NodeAssignment | null;
  deviceName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (nodeId: string, survivorsFound: number) => Promise<void>;
}

export function RescueDialog({ node, deviceName, open, onOpenChange, onConfirm }: RescueDialogProps) {
  const [survivorsCount, setSurvivorsCount] = useState('0');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!node) return;
    setIsSubmitting(true);
    try {
      await onConfirm(node.nodeId, parseInt(survivorsCount, 10) || 0);
      onOpenChange(false);
      setSurvivorsCount('0');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-green-600" />
            Mark Node as Rescued
          </DialogTitle>
          <DialogDescription>
            Confirm rescue completion for this node
          </DialogDescription>
        </DialogHeader>

        {node && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{deviceName || node.deviceId}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-3 h-3" />
                {node.location.latitude.toFixed(4)}, {node.location.longitude.toFixed(4)}
              </p>
              <Badge variant="secondary" className="mt-2 text-xs">
                {node.status}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="survivors">Survivors Found</Label>
              <Input
                id="survivors"
                type="number"
                min="0"
                value={survivorsCount}
                onChange={e => setSurvivorsCount(e.target.value)}
                placeholder="Number of survivors"
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Confirm Rescue'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
