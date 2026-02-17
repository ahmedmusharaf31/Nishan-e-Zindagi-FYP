'use client';

import { MapContainer, TileLayer, ZoomControl, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ReactNode } from 'react';

// Default center coordinates (Pakistan - can be adjusted)
const DEFAULT_CENTER: [number, number] = [30.3753, 69.3451];
const DEFAULT_ZOOM = 6;

interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  children?: ReactNode;
  className?: string;
  onMapClick?: (lat: number, lng: number) => void;
}

function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapView({
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  children,
  className = 'h-[500px] w-full',
  onMapClick,
}: MapViewProps) {
  return (
    <div className={className}>
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        zoomControl={false}
        className="h-full w-full rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />
        {onMapClick && <ClickHandler onMapClick={onMapClick} />}
        {children}
      </MapContainer>
    </div>
  );
}
