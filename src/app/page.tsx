"use client";

import { useEffect, useRef } from 'react';
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
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (mapRef.current) {
        const scrollY = window.scrollY;
        mapRef.current.style.transform = `translateY(${scrollY * 0.4}px) scale(1.1)`;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      {/* Hero Section - Pakistan Map Background */}
      <section className="relative overflow-hidden">
        {/* Map background with parallax */}
        <div
          ref={mapRef}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform scale-110"
          style={{ backgroundImage: "url('/pak_map.jpeg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-green-900/80 via-green-900/70 to-background" />
        {/* Subtle texture pattern */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-6xl mx-auto px-4 py-24 sm:py-36">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                <Shield className="h-9 w-9 text-white" />
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-lg">
              Nishan-e-Zindagi
            </h1>
            <p className="text-xl sm:text-2xl text-green-100 max-w-2xl mx-auto drop-shadow">
              AI-powered disaster rescue system using mesh networks and CO2 detection to locate and save survivors
            </p>
            <div className="flex items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <Link href={getDashboardUrl()}>
                  <Button size="lg" className="gap-2 bg-white text-green-900 hover:bg-green-50 font-semibold text-base px-8">
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <Button size="lg" className="gap-2 bg-white text-green-900 hover:bg-green-50 font-semibold text-base px-8">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" className="border border-white/50 bg-transparent text-white hover:bg-white/10 font-semibold text-base px-8">
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
      <section className="relative max-w-6xl mx-auto px-4 py-20">
        {/* Light green texture background */}
        <div className="absolute inset-0 -mx-[50vw] left-1/2 right-1/2 w-screen bg-gradient-to-b from-green-50/80 to-transparent dark:from-green-950/20 dark:to-transparent -z-10" />
        <div className="text-center mb-14">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">Features</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Comprehensive Rescue Operations</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Everything you need to manage disaster response operations from detection to rescue
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-default">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Radio className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold">Real-Time Monitoring</h3>
              <p className="text-muted-foreground">
                Live sensor data from mesh network nodes including CO2 levels, temperature, humidity, and GPS location
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-default">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Megaphone className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Campaign Management</h3>
              <p className="text-muted-foreground">
                Multi-node, multi-rescuer rescue campaigns with real-time progress tracking and node assignments
              </p>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-default">
            <CardContent className="p-8 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BarChart3 className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold">Reports & Analytics</h3>
              <p className="text-muted-foreground">
                Campaign reports with PDF export, survivor statistics, rescuer performance, and system analytics
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">How It Works</Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-4">From Detection to Rescue</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Our system streamlines the entire rescue workflow in four steps
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
              <Card key={item.step} className="border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-default group">
                <CardContent className="p-6 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow duration-300">
                    {item.step}
                  </div>
                  <div className="mx-auto w-14 h-14 rounded-xl bg-card border flex items-center justify-center group-hover:border-primary/50 transition-colors duration-300">
                    <item.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Role Privileges Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-14">
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">Roles</Badge>
          <h2 className="text-4xl lg:text-5xl font-bold mb-4">Role-Based Access</h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Three distinct roles with tailored capabilities for effective operations
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-default">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Admin</h3>
                  <Badge variant="outline" className="text-xs">Full Access</Badge>
                </div>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>- System-wide dashboard & device monitoring</li>
                <li>- User management & role assignments</li>
                <li>- Create & manage rescue campaigns</li>
                <li>- Assign rescuers to nodes</li>
                <li>- Full reports with PDF export</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-default">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Rescuer</h3>
                  <Badge variant="outline" className="text-xs">Field Operations</Badge>
                </div>
              </div>
              <ul className="space-y-2 text-muted-foreground">
                <li>- Live sensor data & map view</li>
                <li>- View assigned campaigns & nodes</li>
                <li>- Update campaign status</li>
                <li>- Mark nodes as rescued</li>
                <li>- Campaign reports with PDF export</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="border-2 hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-default">
            <CardContent className="p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Public</h3>
                  <Badge variant="outline" className="text-xs">View Only</Badge>
                </div>
              </div>
              <ul className="space-y-2 text-muted-foreground">
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
      <section className="relative overflow-hidden py-16">
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/90 to-green-800/90" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2322c55e' fill-opacity='0.6'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
        <div className="relative max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl font-bold text-white">Ready to Get Started?</h2>
          <p className="text-green-100 text-lg">
            Join the rescue operations platform and help save lives
          </p>
          <div className="flex items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link href={getDashboardUrl()}>
                <Button size="lg" className="gap-2 bg-white text-green-900 hover:bg-green-50 font-semibold text-base px-8">
                  <Users className="w-4 h-4" />
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="gap-2 bg-white text-green-900 hover:bg-green-50 font-semibold text-base px-8">
                    <Users className="w-4 h-4" />
                    Create Account
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" className="border border-white/50 bg-transparent text-white hover:bg-white/10 font-semibold text-base px-8">
                    Sign In
                  </Button>
                </Link>
              </>
            )}
          </div>
          <p className="text-lg font-semibold text-white pt-4">
            Nishan-e-Zindagi - Final Year Project
          </p>
        </div>
      </section>
    </div>
  );
}
