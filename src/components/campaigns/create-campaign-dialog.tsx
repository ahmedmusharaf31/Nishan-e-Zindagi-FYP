'use client';

import { useState, useEffect } from 'react';
import { useAlertStore, useDeviceStore, useUserStore, useCampaignStore } from '@/store';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
  Loader2,
  ChevronRight,
  ChevronLeft,
  MapPin,
  User as UserIcon,
  Radio,
  CheckCircle,
} from 'lucide-react';

interface CreateCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
  preselectedAlertIds?: string[];
}

const EMPTY_ARRAY: string[] = [];

export function CreateCampaignDialog({
  open,
  onOpenChange,
  onCreated,
  preselectedAlertIds = EMPTY_ARRAY,
}: CreateCampaignDialogProps) {
  const { alerts, fetchAlerts } = useAlertStore();
  const { devices, fetchDevices } = useDeviceStore();
  const { fetchUsers, getUsersByRole } = useUserStore();
  const { createCampaignFromAlerts } = useCampaignStore();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [selectedAlertIds, setSelectedAlertIds] = useState<string[]>(preselectedAlertIds);
  const [selectedRescuerIds, setSelectedRescuerIds] = useState<string[]>([]);
  const [campaignName, setCampaignName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAlerts();
      fetchDevices();
      fetchUsers();
      setStep(1);
      setSelectedAlertIds(preselectedAlertIds);
      setSelectedRescuerIds([]);
      setCampaignName('');
    }
  }, [open, fetchAlerts, fetchDevices, fetchUsers, preselectedAlertIds]);

  const activeAlerts = alerts.filter(a => a.status === 'active' || a.status === 'acknowledged');
  const rescuers = getUsersByRole('rescuer').filter(u => u.isActive);

  const getDeviceForAlert = (alertDeviceId: string) => {
    return devices.find(d => d.id === alertDeviceId);
  };

  const toggleAlert = (alertId: string) => {
    setSelectedAlertIds(prev =>
      prev.includes(alertId) ? prev.filter(id => id !== alertId) : [...prev, alertId]
    );
  };

  const toggleRescuer = (rescuerId: string) => {
    setSelectedRescuerIds(prev =>
      prev.includes(rescuerId) ? prev.filter(id => id !== rescuerId) : [...prev, rescuerId]
    );
  };

  const handleCreate = async () => {
    if (!campaignName.trim() || selectedAlertIds.length === 0) return;

    setIsSubmitting(true);
    try {
      // Build alert-device map
      const alertDeviceMap: Record<string, { deviceId: string; location: { latitude: number; longitude: number } }> = {};
      selectedAlertIds.forEach(alertId => {
        const alert = alerts.find(a => a.id === alertId);
        if (alert) {
          const device = getDeviceForAlert(alert.deviceId);
          if (device) {
            alertDeviceMap[alertId] = {
              deviceId: device.id,
              location: device.location,
            };
          }
        }
      });

      await createCampaignFromAlerts(campaignName, selectedAlertIds, selectedRescuerIds, alertDeviceMap);

      toast({
        title: 'Campaign Created',
        description: `Campaign "${campaignName}" created with ${selectedAlertIds.length} node(s) and ${selectedRescuerIds.length} rescuer(s).`,
      });
      onOpenChange(false);
      onCreated?.();
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create campaign. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Create Rescue Campaign</DialogTitle>
          <DialogDescription>
            {step === 1 && 'Step 1: Select nodes/alerts to include in this campaign'}
            {step === 2 && 'Step 2: Assign rescuers to the campaign'}
            {step === 3 && 'Step 3: Review and confirm campaign details'}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 py-2">
          {[1, 2, 3].map(s => (
            <div
              key={s}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? 'bg-primary text-primary-foreground'
                  : s < step
                  ? 'bg-green-500 text-white'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {s < step ? <CheckCircle className="w-4 h-4" /> : s}
            </div>
          ))}
        </div>

        {/* Step 1: Select Nodes/Alerts */}
        {step === 1 && (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active alerts available</p>
                </div>
              ) : (
                activeAlerts.map(alert => {
                  const device = getDeviceForAlert(alert.deviceId);
                  const isSelected = selectedAlertIds.includes(alert.id);
                  return (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? 'border-primary bg-primary/5' : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleAlert(alert.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox checked={isSelected} className="mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium text-sm truncate">
                              {device?.name || alert.deviceId}
                            </span>
                            <Badge
                              variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                              className="text-xs flex-shrink-0"
                            >
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {alert.title}
                          </p>
                          {device && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                              <MapPin className="w-3 h-3" />
                              {device.location.latitude.toFixed(4)}, {device.location.longitude.toFixed(4)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        )}

        {/* Step 2: Assign Rescuers */}
        {step === 2 && (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2 pr-4">
              {rescuers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <UserIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No active rescuers available</p>
                </div>
              ) : (
                rescuers.map(rescuer => {
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
              <p className="text-xs text-muted-foreground text-center pt-2">
                You can skip this step and assign rescuers later
              </p>
            </div>
          </ScrollArea>
        )}

        {/* Step 3: Review & Create */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Campaign Name</Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="e.g., Lahore Emergency Response"
              />
            </div>

            <div className="p-3 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Nodes</span>
                <Badge variant="secondary">{selectedAlertIds.length}</Badge>
              </div>
              <div className="space-y-1">
                {selectedAlertIds.map(alertId => {
                  const alert = alerts.find(a => a.id === alertId);
                  const device = alert ? getDeviceForAlert(alert.deviceId) : null;
                  return (
                    <p key={alertId} className="text-xs text-muted-foreground flex items-center gap-1">
                      <Radio className="w-3 h-3" />
                      {device?.name || alertId} - {alert?.title}
                    </p>
                  );
                })}
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Assigned Rescuers</span>
                <Badge variant="secondary">{selectedRescuerIds.length}</Badge>
              </div>
              {selectedRescuerIds.length > 0 ? (
                <div className="space-y-1">
                  {selectedRescuerIds.map(rescuerId => {
                    const rescuer = rescuers.find(r => r.id === rescuerId);
                    return (
                      <p key={rescuerId} className="text-xs text-muted-foreground flex items-center gap-1">
                        <UserIcon className="w-3 h-3" />
                        {rescuer?.displayName || rescuerId}
                      </p>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No rescuers assigned yet</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={step === 1 && selectedAlertIds.length === 0}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={!campaignName.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Campaign'
                )}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
