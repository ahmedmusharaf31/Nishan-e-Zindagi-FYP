'use client';

import { useEffect, useState, useMemo } from 'react';
import { RoleGuard } from '@/components/auth';
import { useDeviceStore, useAlertStore, useCampaignStore, useUserStore } from '@/store';
import { useAuth } from '@/providers/auth-provider';
import { Campaign, CampaignReport } from '@/types';
import { generateCampaignReport, generateAggregateReport } from '@/lib/pdf/generate-report';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  RefreshCcw,
  TrendingUp,
  Radio,
  Bell,
  Megaphone,
  Calendar,
  FileDown,
  HeartPulse,
  Users,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

type DateRange = '7d' | '14d' | '30d' | '90d';

export default function ReportsPage() {
  const { userProfile } = useAuth();
  const { devices, fetchDevices } = useDeviceStore();
  const { alerts, fetchAlerts } = useAlertStore();
  const { campaigns, fetchCampaigns, getCampaignStats } = useCampaignStore();
  const { users, fetchUsers } = useUserStore();

  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('all');

  const isPublic = userProfile?.role === 'public';

  // Fetch data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchDevices(), fetchAlerts(), fetchCampaigns(), fetchUsers()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchDevices, fetchAlerts, fetchCampaigns, fetchUsers]);

  const selectedCampaign = selectedCampaignId !== 'all'
    ? campaigns.find(c => c.id === selectedCampaignId)
    : undefined;

  // Get date range in days
  const getRangeDays = (range: DateRange) => {
    const days: Record<DateRange, number> = { '7d': 7, '14d': 14, '30d': 30, '90d': 90 };
    return days[range];
  };

  const campaignStats = getCampaignStats();

  // Rescuer name helper
  const rescuerNames: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    users.forEach(u => { map[u.id] = u.displayName; });
    return map;
  }, [users]);

  // Device name helper
  const deviceNames: Record<string, string> = useMemo(() => {
    const map: Record<string, string> = {};
    devices.forEach(d => { map[d.id] = d.name; });
    return map;
  }, [devices]);

  // Device status chart data
  const deviceStatusData = useMemo(() => {
    const online = devices.filter((d) => d.status === 'online').length;
    const offline = devices.filter((d) => d.status === 'offline').length;
    const warning = devices.filter((d) => d.status === 'warning').length;
    const critical = devices.filter((d) => d.status === 'critical').length;
    return [
      { name: 'Online', value: online, color: '#22c55e' },
      { name: 'Offline', value: offline, color: '#64748b' },
      { name: 'Warning', value: warning, color: '#f59e0b' },
      { name: 'Critical', value: critical, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [devices]);

  // Alert severity distribution
  const alertSeverityData = useMemo(() => {
    const low = alerts.filter((a) => a.severity === 'low').length;
    const medium = alerts.filter((a) => a.severity === 'medium').length;
    const high = alerts.filter((a) => a.severity === 'high').length;
    const critical = alerts.filter((a) => a.severity === 'critical').length;
    return [
      { name: 'Low', value: low, color: '#3b82f6' },
      { name: 'Medium', value: medium, color: '#f59e0b' },
      { name: 'High', value: high, color: '#f97316' },
      { name: 'Critical', value: critical, color: '#ef4444' },
    ].filter((d) => d.value > 0);
  }, [alerts]);

  // Alert time series
  const alertTimeSeriesData = useMemo(() => {
    const days = getRangeDays(dateRange);
    const now = new Date();
    const data: { date: string; alerts: number; resolved: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const displayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const dayAlerts = alerts.filter((a) => {
        const alertDate = new Date(a.triggeredAt).toISOString().split('T')[0];
        return alertDate === dateStr;
      });
      const resolved = dayAlerts.filter((a) => a.status === 'resolved').length;
      data.push({ date: displayDate, alerts: dayAlerts.length, resolved });
    }
    return data;
  }, [alerts, dateRange]);

  // Campaign status breakdown
  const campaignStatusData = useMemo(() => {
    const initiated = campaigns.filter((c) => c.status === 'initiated').length;
    const inProgress = campaigns.filter((c) =>
      ['assigned', 'accepted', 'en_route', 'on_scene', 'in_progress'].includes(c.status)
    ).length;
    const resolved = campaigns.filter((c) => c.status === 'resolved').length;
    const cancelled = campaigns.filter((c) => c.status === 'cancelled').length;
    return [
      { name: 'Pending', value: initiated, color: '#3b82f6' },
      { name: 'In Progress', value: inProgress, color: '#f59e0b' },
      { name: 'Resolved', value: resolved, color: '#22c55e' },
      { name: 'Cancelled', value: cancelled, color: '#64748b' },
    ].filter((d) => d.value > 0);
  }, [campaigns]);

  // Battery data
  const batteryData = useMemo(() => {
    const ranges = [
      { name: '0-25%', min: 0, max: 25, color: '#ef4444' },
      { name: '26-50%', min: 26, max: 50, color: '#f97316' },
      { name: '51-75%', min: 51, max: 75, color: '#f59e0b' },
      { name: '76-100%', min: 76, max: 100, color: '#22c55e' },
    ];
    return ranges.map((range) => ({
      ...range,
      count: devices.filter(
        (d) => d.batteryLevel >= range.min && d.batteryLevel <= range.max
      ).length,
    }));
  }, [devices]);

  // Survivors by campaign chart
  const survivorsData = useMemo(() => {
    return campaigns
      .filter(c => (c.totalSurvivorsFound || 0) > 0)
      .map(c => ({
        name: c.name || `#${c.id.slice(-6)}`,
        survivors: c.totalSurvivorsFound || 0,
      }));
  }, [campaigns]);

  // Summary stats
  const stats = useMemo(() => ({
    totalDevices: devices.length,
    onlineDevices: devices.filter((d) => d.status === 'online').length,
    totalAlerts: alerts.length,
    activeAlerts: alerts.filter((a) => a.status === 'active').length,
    totalCampaigns: campaigns.length,
    activeCampaigns: campaigns.filter(
      (c) => !['resolved', 'cancelled'].includes(c.status)
    ).length,
    avgBattery: devices.length > 0
      ? Math.round(devices.reduce((acc, d) => acc + d.batteryLevel, 0) / devices.length)
      : 0,
  }), [devices, alerts, campaigns]);

  // Export handlers
  const handleExportCampaign = (campaign: Campaign) => {
    const alertDetails: Record<string, typeof alerts[0]> = {};
    (campaign.alertIds || []).forEach(aid => {
      const alert = alerts.find(a => a.id === aid);
      if (alert) alertDetails[aid] = alert;
    });

    const report: CampaignReport = {
      campaign,
      rescuerNames,
      deviceNames,
      alertDetails,
      generatedAt: new Date().toISOString(),
    };
    generateCampaignReport(report);
  };

  const handleExportAggregate = () => {
    generateAggregateReport(campaigns, rescuerNames);
  };

  // Refresh data
  const handleRefresh = async () => {
    setIsLoading(true);
    await Promise.all([fetchDevices(), fetchAlerts(), fetchCampaigns(), fetchUsers()]);
    setIsLoading(false);
  };

  return (
    <RoleGuard allowedRoles={['admin', 'rescuer', 'public']} fallbackUrl="/login">
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Reports & Analytics
            </h1>
            <p className="text-muted-foreground">
              {isPublic ? 'Rescue operation statistics and outcomes' : 'System performance and operational metrics'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isPublic && (
              <Select value={selectedCampaignId} onValueChange={setSelectedCampaignId}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select campaign" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Campaigns</SelectItem>
                  {campaigns.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name || `#${c.id.slice(-6).toUpperCase()}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-[130px]">
                <Calendar className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {!isPublic && (
              <Button
                variant="default"
                size="sm"
                onClick={() => {
                  if (selectedCampaign) {
                    handleExportCampaign(selectedCampaign);
                  } else {
                    handleExportAggregate();
                  }
                }}
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            )}
          </div>
        </div>

        {/* Campaign-specific detail card */}
        {selectedCampaign && !isPublic && (
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle>{selectedCampaign.name || `Campaign #${selectedCampaign.id.slice(-6).toUpperCase()}`}</CardTitle>
              <CardDescription>{selectedCampaign.description || 'Campaign details'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedCampaign.nodeAssignments?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Nodes</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{selectedCampaign.assignedRescuerIds?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">Rescuers</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedCampaign.totalSurvivorsFound || 0}</p>
                  <p className="text-xs text-muted-foreground">Survivors Found</p>
                </div>
                <div className="text-center">
                  <Badge variant={selectedCampaign.status === 'resolved' ? 'default' : 'secondary'}>
                    {selectedCampaign.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isPublic ? (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <HeartPulse className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Persons Rescued</p>
                      <p className="text-2xl font-bold text-green-600">{campaignStats.totalSurvivorsFound}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Megaphone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Operations</p>
                      <p className="text-2xl font-bold">{campaignStats.activeCampaigns}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Active Alerts</p>
                      <p className="text-2xl font-bold">{stats.activeAlerts}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Resolved Campaigns</p>
                      <p className="text-2xl font-bold">{campaignStats.resolvedCampaigns}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Radio className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Devices</p>
                      <p className="text-2xl font-bold">{stats.onlineDevices}/{stats.totalDevices}</p>
                      <p className="text-xs text-muted-foreground">online</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                      <Bell className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Alerts</p>
                      <p className="text-2xl font-bold">{stats.activeAlerts}/{stats.totalAlerts}</p>
                      <p className="text-xs text-muted-foreground">active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <HeartPulse className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Survivors Found</p>
                      <p className="text-2xl font-bold text-green-600">{campaignStats.totalSurvivorsFound}</p>
                      <p className="text-xs text-muted-foreground">total rescued</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Battery</p>
                      <p className="text-2xl font-bold">{stats.avgBattery}%</p>
                      <p className="text-xs text-muted-foreground">across devices</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Survivors by Campaign */}
          {survivorsData.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Survivors Found by Campaign</CardTitle>
                <CardDescription>Number of survivors rescued per campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={survivorsData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Bar dataKey="survivors" name="Survivors" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Alert Trends - all roles */}
          <Card className={survivorsData.length === 0 ? 'lg:col-span-2' : ''}>
            <CardHeader>
              <CardTitle>Alert Trends</CardTitle>
              <CardDescription>Alert activity over the selected time period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={alertTimeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="alerts" name="Total Alerts" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.2} />
                  <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Campaign Status */}
          <Card>
            <CardHeader>
              <CardTitle>Campaign Status</CardTitle>
              <CardDescription>Current campaign distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={campaignStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {campaignStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Non-public charts */}
          {!isPublic && (
            <>
              {/* Device Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Status</CardTitle>
                  <CardDescription>Current status distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={deviceStatusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {deviceStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Alert Severity */}
              <Card>
                <CardHeader>
                  <CardTitle>Alert Severity Distribution</CardTitle>
                  <CardDescription>Breakdown by severity level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={alertSeverityData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                        {alertSeverityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Battery Levels */}
              <Card>
                <CardHeader>
                  <CardTitle>Device Battery Levels</CardTitle>
                  <CardDescription>Distribution of battery charge</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={batteryData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="count" name="Devices">
                        {batteryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          )}

          {/* Public: resolved campaigns list */}
          {isPublic && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Resolved Campaigns
                </CardTitle>
                <CardDescription>Completed rescue operations and outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.filter(c => c.status === 'resolved').length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No resolved campaigns yet</p>
                  ) : (
                    campaigns.filter(c => c.status === 'resolved').map(c => (
                      <div key={c.id} className="p-3 rounded-lg border flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{c.name || `Campaign #${c.id.slice(-6).toUpperCase()}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {c.nodeAssignments?.length || 0} nodes | {c.assignedRescuerIds?.length || 0} rescuers | {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{c.totalSurvivorsFound || 0}</p>
                          <p className="text-xs text-muted-foreground">survivors</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
