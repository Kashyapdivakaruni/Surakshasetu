"use client";

import dynamic from "next/dynamic";


// Dynamically import the LiveMap to avoid SSR issues with Leaflet touching `window`
const DynamicLiveMap = dynamic(
  () => import("./LiveMap"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] bg-slate-100 rounded-2xl flex items-center justify-center relative overflow-hidden border border-slate-200">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <div className="flex flex-col items-center z-10 text-slate-500 font-medium">
          <svg className="w-10 h-10 mb-2 animate-bounce text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Loading Emergency Map...
        </div>
      </div>
    )
  }
);

export function EMSNearbyHospitalMap({ 
  accidentLocation, 
  hospitals,
  onHospitalSelect
}: { 
  accidentLocation: { lat: number, lng: number }, 
  hospitals: any[],
  onHospitalSelect?: (id: string, etaMinutes: number) => void
}) {
  return (
    <div className="w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden shadow-inner border border-slate-200 bg-white z-0 relative isolate">
      <DynamicLiveMap 
        accidentLocation={accidentLocation} 
        hospitals={hospitals} 
        onHospitalSelect={onHospitalSelect}
      />
    </div>
  );
}
