'use client';

import { useEffect, useState } from 'react';
import { RoleGuard } from '@/components/auth';
import { DynamicMapView, DynamicManualReportMarker } from '@/components/map';
import { useAlertStore } from '@/store';
import { useAuth } from '@/providers/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Alert, AlertSeverity } from '@/types';
import { HeartPulse, MapPin, Crosshair, Bell, X } from 'lucide-react';

export default function MarkSurvivorLocationPage() {
  const { userProfile } = useAuth();
  const { addAlert } = useAlertStore();

  const [isMarkMode, setIsMarkMode] = useState(false);
  const [pinnedLocation, setPinnedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [reporterName, setReporterName] = useState('');
  const [reportSeverity, setReportSeverity] = useState<AlertSeverity>('high');
  const [reportNote, setReportNote] = useState('');

  useEffect(() => {
    if (userProfile?.displayName) {
      setReporterName(userProfile.displayName);
    }
  }, [userProfile?.displayName]);

  const handleMapClick = (lat: number, lng: number) => {
    if (isMarkMode) {
      setPinnedLocation({ lat, lon: lng });
      setIsMarkMode(false);
    }
  };

  const handleCreateAlert = async () => {
    if (!pinnedLocation) return;
    const alert: Alert = {
      id: `manual-${Date.now()}`,
      deviceId: 'manual-report',
      type: 'manual_report',
      severity: reportSeverity,
      status: 'active',
      title: `Potential survivor/s reported by Rescuer ${reporterName}`,
      description: reportNote || undefined,
      location: { latitude: pinnedLocation.lat, longitude: pinnedLocation.lon },
      reportedBy: reporterName,
      triggeredAt: new Date().toISOString(),
    };
    await addAlert(alert);
    setPinnedLocation(null);
    setReportNote('');
    setReportSeverity('high');
  };

  return (
    <RoleGuard allowedRoles={['rescuer', 'admin']} fallbackUrl="/public">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HeartPulse className="w-6 h-6 text-purple-600" />
            Mark Potential Survivor Location
          </h1>
          <p className="text-muted-foreground mt-1">
            Pin a location on the map based on a rescuer field report, then create an alert for the rescue team.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Map */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Pin Location on Map
                </CardTitle>
                {pinnedLocation && (
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 font-mono text-xs">
                    <MapPin className="w-3 h-3 mr-1" />
                    {pinnedLocation.lat.toFixed(5)}, {pinnedLocation.lon.toFixed(5)}
                  </Badge>
                )}
              </div>
              <CardDescription>
                {isMarkMode
                  ? 'Click anywhere on the map to drop the survivor location pin'
                  : 'Click "Pin on Map" then click the map to mark the location'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={isMarkMode ? 'cursor-crosshair' : ''}>
                <DynamicMapView
                  center={[30.3753, 69.3451]}
                  zoom={6}
                  className="h-[500px] w-full rounded-lg overflow-hidden"
                  onMapClick={handleMapClick}
                >
                  {pinnedLocation && (
                    <DynamicManualReportMarker
                      position={[pinnedLocation.lat, pinnedLocation.lon]}
                      reportedBy={reporterName}
                      severity={reportSeverity}
                    />
                  )}
                </DynamicMapView>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-purple-600" />
                Report Details
              </CardTitle>
              <CardDescription>
                Fill in the details and create an alert for this location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Pin button */}
              <div className="space-y-2">
                <Label>Location</Label>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    variant={isMarkMode ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsMarkMode((v) => !v)}
                    className={
                      isMarkMode
                        ? 'gap-2 animate-pulse bg-green-600 hover:bg-green-700'
                        : 'gap-2 border-green-600 text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30'
                    }
                  >
                    <Crosshair className="w-4 h-4" />
                    {isMarkMode ? 'Click on map...' : 'Pin on Map'}
                  </Button>
                  {pinnedLocation && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPinnedLocation(null)}
                      className="h-8 gap-1 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </Button>
                  )}
                </div>
                {pinnedLocation && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {pinnedLocation.lat.toFixed(6)}, {pinnedLocation.lon.toFixed(6)}
                  </p>
                )}
              </div>

              {/* Reporter name */}
              <div className="space-y-1.5">
                <Label htmlFor="reporter-name">Reported by Rescuer</Label>
                <Input
                  id="reporter-name"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Rescuer name"
                />
              </div>

              {/* Severity */}
              <div className="space-y-1.5">
                <Label htmlFor="report-severity">Severity</Label>
                <Select
                  value={reportSeverity}
                  onValueChange={(v) => setReportSeverity(v as AlertSeverity)}
                >
                  <SelectTrigger id="report-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="report-note">Notes (optional)</Label>
                <Input
                  id="report-note"
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  placeholder="e.g. heard voices under rubble"
                />
              </div>

              {/* Create alert button */}
              <Button
                className="w-full gap-2"
                disabled={!pinnedLocation || !reporterName.trim()}
                onClick={handleCreateAlert}
              >
                <Bell className="w-4 h-4" />
                Create Alert
              </Button>

              {!pinnedLocation && (
                <p className="text-xs text-center text-muted-foreground">
                  Pin a location on the map to enable alert creation
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  );
}
