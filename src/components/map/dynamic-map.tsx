'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import MapView to prevent SSR issues with Leaflet
export const DynamicMapView = dynamic(
  () => import('./map-view').then((mod) => mod.MapView),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] w-full">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    ),
  }
);

// Dynamically import DeviceMarkers to prevent SSR issues
export const DeviceMarkers = dynamic(
  () => import('./device-marker').then((mod) => mod.DeviceMarkers),
  { ssr: false }
);

export const DeviceMarker = dynamic(
  () => import('./device-marker').then((mod) => mod.DeviceMarker),
  { ssr: false }
);

export const DynamicManualReportMarker = dynamic(
  () => import('./device-marker').then((mod) => mod.ManualReportMarker),
  { ssr: false }
);
