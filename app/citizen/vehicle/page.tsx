"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Car, Plus, Trash2, RefreshCw } from "lucide-react";
import { INDIAN_STATES } from "@/lib/indianStates";
import { useToast } from "@/components/ui/use-toast";

type Vehicle = {
  id: string;
  vehicleNumber: string;
  vehicleType: string;
  vehicleColor: string;
  registrationState: string;
};

export default function CitizenVehicle() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await fetch("/api/citizen/vehicle");
      const data = await res.json();
      if (res.ok) {
        setVehicles(data.vehicles);
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch vehicles", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const addEmptyVehicle = () => {
    const newVehicle: Vehicle = {
      id: `temp-${Date.now()}`,
      vehicleNumber: "",
      vehicleType: "Car",
      vehicleColor: "",
      registrationState: ""
    };
    setVehicles([newVehicle, ...vehicles]);
  };

  const updateVehicleField = (id: string, field: keyof Vehicle, value: string) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const handleSave = async (vehicle: Vehicle) => {
    if (!vehicle.vehicleNumber || !vehicle.vehicleType || !vehicle.vehicleColor || !vehicle.registrationState) {
      toast({ title: "Validation Error", description: "All fields are required", type: "error" });
      return;
    }

    setSavingId(vehicle.id);
    try {
      const isNew = vehicle.id.startsWith("temp-");
      const method = isNew ? "POST" : "PUT";
      const body = isNew 
        ? { ...vehicle, id: undefined } 
        : vehicle;

      const res = await fetch("/api/citizen/vehicle", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: "Success", description: "Vehicle saved successfully", type: "success" });
        if (isNew) {
          setVehicles(vehicles.map(v => v.id === vehicle.id ? data.vehicle : v));
        }
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save vehicle", type: "error" });
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (id.startsWith("temp-")) {
      setVehicles(vehicles.filter(v => v.id !== id));
      return;
    }

    if (!confirm("Are you sure you want to remove this vehicle? This might invalidate associated QR codes.")) return;

    try {
      const res = await fetch(`/api/citizen/vehicle?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setVehicles(vehicles.filter(v => v.id !== id));
        toast({ title: "Success", description: "Vehicle removed", type: "success" });
      } else {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    }
  };

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading vehicles...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B]">Vehicles</h1>
          <p className="text-slate-500 mt-1 font-medium">Register your vehicles to link them to your secure QR.</p>
        </div>
        <Button onClick={addEmptyVehicle} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-md px-6 h-11 shrink-0 transition-all hover:-translate-y-0.5">
          <Plus className="w-4 h-4 mr-2" /> Add Vehicle
        </Button>
      </div>

      {vehicles.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-slate-300 rounded-2xl bg-white shadow-sm">
          <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#0F284B] text-lg">No vehicles registered</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6 font-medium">Register at least one vehicle to generate your emergency QR.</p>
          <Button onClick={addEmptyVehicle} className="bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold shadow-md">
            Add First Vehicle
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {vehicles.map((vehicle, index) => (
            <Card key={vehicle.id} className="border-blue-100 shadow-sm rounded-2xl overflow-hidden">
              <CardHeader className="bg-blue-50/50 border-b border-blue-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
                <div>
                  <CardTitle className="text-lg text-[#0F284B] flex items-center gap-2">
                    <Car className="w-5 h-5 text-blue-600" /> {index === 0 ? "Primary Vehicle" : `Vehicle ${index + 1}`}
                  </CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-blue-200 text-[#0F284B] bg-white rounded-full hover:bg-blue-50 font-semibold"
                    onClick={() => handleSave(vehicle)}
                    disabled={savingId === vehicle.id}
                  >
                    {savingId === vehicle.id ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    className="rounded-full px-3"
                    onClick={() => handleDelete(vehicle.id)}
                    disabled={savingId === vehicle.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label className="text-[#0F284B] font-semibold">Vehicle Number (License Plate)</Label>
                    <Input 
                      value={vehicle.vehicleNumber} 
                      onChange={(e) => updateVehicleField(vehicle.id, "vehicleNumber", e.target.value)}
                      placeholder="e.g. MH12AB1234"
                      className="h-11 border-slate-200 focus:border-orange-500 font-bold uppercase" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F284B] font-semibold">Vehicle Type</Label>
                    <select 
                      value={vehicle.vehicleType}
                      onChange={(e) => updateVehicleField(vehicle.id, "vehicleType", e.target.value)}
                      className="flex h-11 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-orange-500 outline-none"
                      required
                    >
                      <option value="Car">Car / SUV</option>
                      <option value="Bike">Two Wheeler</option>
                      <option value="Commercial">Commercial</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F284B] font-semibold">Vehicle Color</Label>
                    <Input 
                      value={vehicle.vehicleColor} 
                      onChange={(e) => updateVehicleField(vehicle.id, "vehicleColor", e.target.value)}
                      placeholder="e.g. White"
                      className="h-11 border-slate-200 focus:border-orange-500" 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F284B] font-semibold">Registered State</Label>
                    <select 
                      value={vehicle.registrationState}
                      onChange={(e) => updateVehicleField(vehicle.id, "registrationState", e.target.value)}
                      className="flex h-11 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-orange-500 outline-none"
                      required
                    >
                      <option value="" disabled>Select State/UT...</option>
                      {INDIAN_STATES.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
