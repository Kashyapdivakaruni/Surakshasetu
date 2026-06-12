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

const ambulanceIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalAvailableIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalTraumaIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalFullIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const hospitalICUIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png",
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

export default function LiveMap({ 
  accidentLocation, 
  hospitals,
  onHospitalSelect
}: { 
  accidentLocation: { lat: number, lng: number }, 
  hospitals: any[],
  onHospitalSelect?: (id: string, etaMinutes: number) => void
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-full w-full bg-slate-100 flex items-center justify-center">Loading map...</div>;

  const getHospitalIcon = (h: any) => {
    if (h.status !== "Available") return hospitalFullIcon;
    if (h.traumaCareAvailable) return hospitalTraumaIcon;
    if (h.icuBedsAvailable > 0) return hospitalICUIcon;
    return hospitalAvailableIcon;
  };

  const center: [number, number] = [accidentLocation.lat, accidentLocation.lng];
  
  // Calculate bounds
  const latitudes = [accidentLocation.lat, ...hospitals.map(h => h.latitude)];
  const longitudes = [accidentLocation.lng, ...hospitals.map(h => h.longitude)];
  
  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLng = Math.min(...longitudes);
  const maxLng = Math.max(...longitudes);

  const bounds: L.LatLngBoundsExpression = [
    [minLat, minLng],
    [maxLat, maxLng]
  ];

  // Route to nearest hospital (assuming the first one is the nearest as per the API sorting)
  const nearestHospital = hospitals.length > 0 ? hospitals[0] : null;

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
    >
      <MapBounds bounds={bounds} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Accident Marker */}
      <Marker position={center} icon={accidentIcon}>
        <Popup className="font-sans">
          <div className="font-bold text-red-600">Accident Location</div>
          <div className="text-xs text-slate-600">Emergency Case Origin</div>
        </Popup>
      </Marker>



      {/* Hospital Markers */}
      {hospitals.map(h => (
        <Marker 
          key={h.id} 
          position={[h.latitude, h.longitude]} 
          icon={getHospitalIcon(h)}
          eventHandlers={{
            click: () => onHospitalSelect && onHospitalSelect(h.userId, h.etaMinutes),
          }}
        >
          <Popup className="font-sans min-w-[200px]">
            <div className="space-y-2">
              <div className="font-bold text-[#0F284B] text-base leading-tight">{h.hospitalName}</div>
              
              <div className="flex flex-wrap gap-1">
                {h.status === "Available" ? (
                  <span className="bg-green-100 text-green-800 text-[10px] font-bold px-1.5 py-0.5 rounded">AVAILABLE</span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-[10px] font-bold px-1.5 py-0.5 rounded">{h.status}</span>
                )}
                {h.traumaCareAvailable && <span className="bg-orange-100 text-orange-800 text-[10px] font-bold px-1.5 py-0.5 rounded">TRAUMA</span>}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 py-2 my-2">
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">DISTANCE</span>
                  <span className="font-bold text-slate-700">{h.distanceKm} km</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">ETA</span>
                  <span className="font-bold text-slate-700">{h.etaMinutes} mins</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">ICU BEDS</span>
                  <span className={`font-bold ${h.icuBedsAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>{h.icuBedsAvailable}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-bold">ER BEDS</span>
                  <span className={`font-bold ${h.emergencyBedsAvailable > 0 ? 'text-green-600' : 'text-red-600'}`}>{h.emergencyBedsAvailable}</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 font-bold mb-2">📞 {h.contactNumber}</div>

              {onHospitalSelect && (
                <button 
                  onClick={() => onHospitalSelect(h.userId, h.etaMinutes)}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1.5 rounded text-xs transition-colors"
                >
                  Select & Assign
                </button>
              )}
            </div>
          </Popup>
        </Marker>
      ))}

      {/* Route to nearest hospital */}
      {nearestHospital && (
        <Polyline 
          positions={[
            center, 
            [nearestHospital.latitude, nearestHospital.longitude]
          ]} 
          color="#3b82f6" 
          weight={4}
          dashArray="10, 10"
          opacity={0.6}
        />
      )}
    </MapContainer>
  );
}
