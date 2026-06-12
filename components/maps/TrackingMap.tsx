"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icons in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const accidentIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const ambulanceIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

function MapBounds({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [bounds, map]);
  return null;
}

export default function TrackingMap({ 
  accidentLat, 
  accidentLng, 
  hospitalLat, 
  hospitalLng 
}: { 
  accidentLat: number; 
  accidentLng: number; 
  hospitalLat?: number; 
  hospitalLng?: number;
}) {
  const [mounted, setMounted] = useState(false);
  
  // Simulate ambulance movement along the path
  const [ambulancePos, setAmbulancePos] = useState<[number, number]>([accidentLat, accidentLng]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (hospitalLat && hospitalLng) {
      // Very simple linear interpolation mock for ambulance movement
      let progress = 0;
      const interval = setInterval(() => {
        progress += 0.05;
        if (progress > 1) progress = 1;
        
        const currentLat = accidentLat + (hospitalLat - accidentLat) * progress;
        const currentLng = accidentLng + (hospitalLng - accidentLng) * progress;
        
        setAmbulancePos([currentLat, currentLng]);
        
        if (progress === 1) clearInterval(interval);
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [accidentLat, accidentLng, hospitalLat, hospitalLng]);

  if (!mounted) return <div className="h-full w-full bg-slate-100 flex items-center justify-center animate-pulse">Initializing map engine...</div>;

  const center: [number, number] = [accidentLat, accidentLng];
  
  let bounds: L.LatLngBoundsExpression;
  if (hospitalLat && hospitalLng) {
    bounds = [
      [Math.min(accidentLat, hospitalLat), Math.min(accidentLng, hospitalLng)],
      [Math.max(accidentLat, hospitalLat), Math.max(accidentLng, hospitalLng)]
    ];
  } else {
    bounds = [
      [accidentLat - 0.01, accidentLng - 0.01],
      [accidentLat + 0.01, accidentLng + 0.01]
    ];
  }

  return (
    <MapContainer 
      center={center} 
      zoom={14} 
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <MapBounds bounds={bounds} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <Marker position={[accidentLat, accidentLng]} icon={accidentIcon}>
        <Popup className="font-sans font-bold text-red-600">Incident Origin</Popup>
      </Marker>

      {hospitalLat && hospitalLng && (
        <>
          <Marker position={[hospitalLat, hospitalLng]} icon={hospitalIcon}>
            <Popup className="font-sans font-bold text-blue-600">Destination Hospital</Popup>
          </Marker>

          <Polyline 
            positions={[
              [accidentLat, accidentLng], 
              [hospitalLat, hospitalLng]
            ]} 
            color="#3b82f6" 
            weight={4}
            dashArray="10, 10"
            opacity={0.6}
          />
        </>
      )}

      {/* Ambulance moving */}
      <Marker position={ambulancePos} icon={ambulanceIcon} zIndexOffset={1000}>
        <Popup className="font-sans font-bold text-[#0F284B]">Ambulance En Route</Popup>
      </Marker>
      
    </MapContainer>
  );
}
