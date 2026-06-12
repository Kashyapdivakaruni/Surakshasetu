"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, Edit, Trash2, UploadCloud, X, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

type Passenger = {
  id: string;
  name: string;
  age: number;
  gender: string;
  relationship: string;
  photo: string | null;
  bloodGroup: string | null;
  healthConditions: string | null;
  allergies: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
};

export default function CitizenPassengers() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<Partial<Passenger>>({
    name: "",
    age: undefined,
    gender: "",
    relationship: "",
    photo: null,
    bloodGroup: "",
    healthConditions: "",
    allergies: "",
    emergencyContactName: "",
    emergencyContactPhone: ""
  });

  useEffect(() => {
    fetchPassengers();
  }, []);

  const fetchPassengers = async () => {
    try {
      const res = await fetch("/api/citizen/passengers");
      const data = await res.json();
      if (res.ok) setPassengers(data.passengers);
    } catch (err) {
      toast({ title: "Error", description: "Failed to fetch passengers", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      name: "", age: undefined, gender: "", relationship: "", photo: null,
      bloodGroup: "", healthConditions: "", allergies: "", emergencyContactName: "", emergencyContactPhone: ""
    });
    setIsModalOpen(true);
  };

  const openEditModal = (p: Passenger) => {
    setEditingId(p.id);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB", type: "error" });
      return;
    }
    setImageProcessing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, photo: reader.result as string });
      setImageProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.age || !formData.gender || !formData.relationship) {
      toast({ title: "Validation Error", description: "Name, age, gender, and relationship are required", type: "error" });
      return;
    }

    setSaving(true);
    try {
      const isNew = !editingId;
      const url = isNew ? "/api/citizen/passengers" : `/api/citizen/passengers/${editingId}`;
      const method = isNew ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();
      if (res.ok) {
        toast({ title: "Success", description: `Passenger ${isNew ? 'added' : 'updated'}`, type: "success" });
        if (isNew) {
          setPassengers([data.passenger, ...passengers]);
        } else {
          setPassengers(passengers.map(p => p.id === editingId ? data.passenger : p));
        }
        setIsModalOpen(false);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this passenger?")) return;
    try {
      const res = await fetch(`/api/citizen/passengers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPassengers(passengers.filter(p => p.id !== id));
        toast({ title: "Success", description: "Passenger removed", type: "success" });
      } else {
        throw new Error("Failed to delete");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, type: "error" });
    }
  };

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading passengers...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B]">Passengers</h1>
          <p className="text-slate-500 mt-1 font-medium">Add frequent co-passengers (family members) to your profile.</p>
        </div>
        <Button onClick={openAddModal} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-md px-6 h-11 shrink-0 transition-all hover:-translate-y-0.5">
          <Plus className="w-4 h-4 mr-2" /> Add Passenger
        </Button>
      </div>

      {passengers.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-slate-300 rounded-2xl bg-white shadow-sm">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-[#0F284B] text-lg">No passengers added yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6 font-medium">Add details of family members who frequently travel with you.</p>
          <Button onClick={openAddModal} className="bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold shadow-md">
            Add First Passenger
          </Button>
        </div>
      ) : (
        <div className="grid gap-4">
          {passengers.map((p) => (
            <Card key={p.id} className="border-slate-200 shadow-sm rounded-2xl hover:shadow-md transition">
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-bold overflow-hidden relative shrink-0 border-2 border-white shadow-sm">
                    {p.photo ? (
                      <Image src={p.photo} alt={p.name} fill className="object-cover" />
                    ) : (
                      <span className="text-xl text-teal-700 bg-teal-100 w-full h-full flex items-center justify-center">{p.name.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-[#0F284B]">{p.name}</h3>
                    <div className="text-sm text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-1 font-medium">
                      <span>Relation: <strong className="text-slate-700">{p.relationship}</strong></span>
                      <span>Age: <strong className="text-slate-700">{p.age}</strong></span>
                      {p.bloodGroup && <span>Blood: <strong className="text-red-600">{p.bloodGroup}</strong></span>}
                    </div>
                    {(p.healthConditions || p.allergies) && (
                      <div className="text-xs mt-2 bg-red-50 text-red-700 inline-block px-2 py-1 rounded font-semibold border border-red-100">
                        Medical Info Added
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => openEditModal(p)} className="rounded-full text-blue-600 border-blue-200 hover:bg-blue-50">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(p.id)} className="rounded-full text-red-600 border-red-200 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto font-sans">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-[#0F284B]">{editingId ? "Edit Passenger" : "Add Passenger"}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="shrink-0 flex flex-col items-center gap-3">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 overflow-hidden relative border-4 border-white shadow-md">
                    {formData.photo ? (
                      <Image src={formData.photo} alt="Preview" fill className="object-cover" />
                    ) : (
                      <Users className="w-8 h-8 text-slate-300" />
                    )}
                    {imageProcessing && <div className="absolute inset-0 bg-white/50 flex items-center justify-center"><RefreshCw className="w-5 h-5 animate-spin text-[#0F284B]" /></div>}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/jpeg,image/png,image/webp" className="hidden" />
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-full text-xs h-8">
                    <UploadCloud className="w-3 h-3 mr-1" /> Photo
                  </Button>
                  {formData.photo && <button type="button" onClick={() => setFormData({...formData, photo: null})} className="text-xs text-red-500 font-medium">Remove</button>}
                </div>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[#0F284B] font-semibold">Name *</Label>
                    <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required className="h-10 focus:border-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F284B] font-semibold">Age *</Label>
                    <Input type="number" value={formData.age || ''} onChange={e => setFormData({...formData, age: parseInt(e.target.value)})} required className="h-10 focus:border-orange-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F284B] font-semibold">Gender *</Label>
                    <select value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} required className="flex h-10 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-orange-500 outline-none">
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[#0F284B] font-semibold">Relationship *</Label>
                    <Input value={formData.relationship} onChange={e => setFormData({...formData, relationship: e.target.value})} placeholder="e.g. Spouse, Child" required className="h-10 focus:border-orange-500" />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[#0F284B] font-semibold">Blood Group</Label>
                  <select value={formData.bloodGroup || ""} onChange={e => setFormData({...formData, bloodGroup: e.target.value})} className="flex h-10 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-orange-500 outline-none font-bold text-red-600">
                    <option value="" className="text-slate-900 font-normal">Select...</option>
                    <option value="A+">A+</option><option value="A-">A-</option>
                    <option value="B+">B+</option><option value="B-">B-</option>
                    <option value="O+">O+</option><option value="O-">O-</option>
                    <option value="AB+">AB+</option><option value="AB-">AB-</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F284B] font-semibold">Medical Conditions</Label>
                  <Input value={formData.healthConditions || ""} onChange={e => setFormData({...formData, healthConditions: e.target.value})} placeholder="e.g. Asthma" className="h-10 focus:border-orange-500" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label className="text-[#0F284B] font-semibold">Allergies</Label>
                  <Input value={formData.allergies || ""} onChange={e => setFormData({...formData, allergies: e.target.value})} placeholder="e.g. Penicillin, Peanuts" className="h-10 focus:border-orange-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F284B] font-semibold">Emergency Contact Name</Label>
                  <Input value={formData.emergencyContactName || ""} onChange={e => setFormData({...formData, emergencyContactName: e.target.value})} className="h-10 focus:border-orange-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[#0F284B] font-semibold">Emergency Contact Phone</Label>
                  <Input value={formData.emergencyContactPhone || ""} onChange={e => setFormData({...formData, emergencyContactPhone: e.target.value})} className="h-10 focus:border-orange-500" />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="rounded-full h-11 px-6">Cancel</Button>
                <Button type="submit" disabled={saving || imageProcessing} className="bg-[#0F284B] hover:bg-[#1A3A6B] text-white rounded-full font-bold h-11 px-8 shadow-md">
                  {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {saving ? "Saving..." : "Save Passenger"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
