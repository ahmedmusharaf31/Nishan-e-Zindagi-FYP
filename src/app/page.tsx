"use client";

import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Radio,
  Megaphone,
  BarChart3,
  Users,
  Eye,
  ArrowRight,
  Cpu,
  Wind,
  UserCheck,
  HeartPulse,
} from 'lucide-react';

export default function Home() {
  const { isAuthenticated, userProfile } = useAuth();

  const getDashboardUrl = () => {
    if (!isAuthenticated || !userProfile) return '/login';
    switch (userProfile.role) {
      case 'admin': return '/admin';
      case 'rescuer': return '/rescuer';
      case 'public': return '/public';
      default: return '/login';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="relative max-w-6xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Nishan-e-Zindagi
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
              AI-powered disaster rescue system using mesh networks and CO2 detection to locate and save survivors
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <Link href={getDashboardUrl()}>
                  <Button size="lg" className="gap-2">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="gap-2">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="outline">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-3xl font-bold mb-4">Comprehensive Rescue Operations</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Everything you need to manage disaster response operations from detection to rescue
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Radio className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold">Real-Time Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Live sensor data from mesh network nodes including CO2 levels, temperature, humidity, and GPS location
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Campaign Management</h3>
              <p className="text-sm text-muted-foreground">
                Multi-node, multi-rescuer rescue campaigns with real-time progress tracking and node assignments
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-6 text-center space-y-4">
              <div className="mx-auto w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold">Reports & Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Campaign reports with PDF export, survivor statistics, rescuer performance, and system analytics
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">How It Works</Badge>
            <h2 className="text-3xl font-bold mb-4">From Detection to Rescue</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Our system streamlines the entire rescue workflow in four steps
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                icon: Cpu,
                title: 'Deploy Nodes',
                description: 'Deploy Meshtastic sensor nodes across the disaster zone for wide-area coverage',
              },
              {
                step: 2,
                icon: Wind,
                title: 'Detect CO2',
                description: 'Nodes detect elevated CO2 levels indicating potential survivors trapped under debris',
              },
              {
                step: 3,
                icon: Megaphone,
                title: 'Create Campaign',
                description: 'Admins create multi-node rescue campaigns and assign rescuers to each node',
              },
              {
                step: 4,
                icon: HeartPulse,
                title: 'Rescue Survivors',
                description: 'Rescuers navigate to nodes, mark rescues, and report survivors found',
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center space-y-3">
                <div className="mx-auto w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
                  {item.step}
                </div>
                <div className="mx-auto w-12 h-12 rounded-xl bg-card border flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Privileges Section */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Roles</Badge>
          <h2 className="text-3xl font-bold mb-4">Role-Based Access</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three distinct roles with tailored capabilities for effective operations
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Admin</h3>
                  <Badge variant="outline" className="text-xs">Full Access</Badge>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>- System-wide dashboard & device monitoring</li>
                <li>- User management & role assignments</li>
                <li>- Create & manage rescue campaigns</li>
                <li>- Assign rescuers to nodes</li>
                <li>- Full reports with PDF export</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Rescuer</h3>
                  <Badge variant="outline" className="text-xs">Field Operations</Badge>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>- Live sensor data & map view</li>
                <li>- View assigned campaigns & nodes</li>
                <li>- Update campaign status</li>
                <li>- Mark nodes as rescued</li>
                <li>- Campaign reports with PDF export</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Eye className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Public</h3>
                  <Badge variant="outline" className="text-xs">View Only</Badge>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>- View active alerts & notifications</li>
                <li>- Rescue operation statistics</li>
                <li>- Aggregate reports & outcomes</li>
                <li>- Persons rescued data</li>
                <li>- Danger level information</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="bg-muted/50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground">
            Join the rescue operations platform and help save lives
          </p>
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href={getDashboardUrl()}>
                <Button size="lg" className="gap-2">
                  <Users className="w-4 h-4" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="gap-2">
                    <Users className="w-4 h-4" />
                    Create Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
          <p className="text-xs text-muted-foreground pt-4">
            Nishan-e-Zindagi - Final Year Project
          </p>
        </div>
      </section>
    </div>
  );
}
