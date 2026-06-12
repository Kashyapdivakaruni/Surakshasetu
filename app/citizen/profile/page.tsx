"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Save, UploadCloud, X, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import Image from "next/image";

export default function CitizenProfile() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    age: "",
    gender: "",
    bloodGroup: "",
    organDonorStatus: false,
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactEmail: "",
    profilePhoto: ""
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/citizen/profile");
      const data = await res.json();
      if (res.ok) {
        setFormData({
          fullName: data.fullName || "",
          phone: data.phone || "",
          age: data.profile?.age?.toString() || "",
          gender: data.profile?.gender || "",
          bloodGroup: data.profile?.bloodGroup || "",
          organDonorStatus: data.profile?.organDonorStatus || false,
          address: data.profile?.address || "",
          emergencyContactName: data.profile?.emergencyContactName || "",
          emergencyContactPhone: data.profile?.emergencyContactPhone || "",
          emergencyContactEmail: data.profile?.emergencyContactEmail || "",
          profilePhoto: data.profilePhoto || ""
        });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to load profile", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB", type: "error" });
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({ title: "Invalid format", description: "Only JPG, PNG, WEBP allowed", type: "error" });
      return;
    }

    setImageProcessing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData({ ...formData, profilePhoto: reader.result as string });
      setImageProcessing(false);
      toast({ title: "Image ready", description: "Click Save to apply changes", type: "info" });
    };
    reader.onerror = () => {
      setImageProcessing(false);
      toast({ title: "Upload Failed", description: "Could not process image", type: "error" });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setFormData({ ...formData, profilePhoto: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/citizen/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (res.ok) {
        toast({ title: "Profile updated successfully", type: "success" });
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast({ title: "Error saving profile", description: err.message, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center animate-pulse text-slate-500 font-medium">Loading profile...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 font-sans pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B]">My Profile</h1>
          <p className="text-slate-500 mt-1 font-medium">Manage your personal identity and emergency contacts.</p>
        </div>
        <Button type="submit" disabled={saving || imageProcessing} className="bg-orange-500 hover:bg-orange-600 text-white rounded-full font-bold shadow-md px-6 h-11 shrink-0 transition-all hover:-translate-y-0.5">
          {saving ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border border-slate-200 bg-white shadow-sm flex flex-col items-center justify-center py-10 rounded-2xl relative overflow-hidden">
          {imageProcessing && (
            <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-sm flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-[#0F284B] animate-spin" />
            </div>
          )}
          
          <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-4 overflow-hidden border-4 border-white shadow-lg relative group">
            {formData.profilePhoto ? (
              <Image src={formData.profilePhoto} alt="Profile" fill className="object-cover" />
            ) : (
              <User className="w-12 h-12 text-slate-300" />
            )}
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageUpload} 
            accept="image/jpeg,image/png,image/webp" 
            className="hidden" 
          />
          
          <div className="flex gap-2 mt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="rounded-full text-[#0F284B] border-slate-200 hover:bg-slate-50 font-semibold">
              <UploadCloud className="w-4 h-4 mr-2" /> {formData.profilePhoto ? "Replace" : "Upload"}
            </Button>
            {formData.profilePhoto && (
              <Button type="button" variant="destructive" size="sm" onClick={removeImage} className="rounded-full px-3">
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-4 text-center px-6 font-medium">Helps EMS identify you instantly. Max 5MB (JPG, PNG).</p>
        </Card>

        <Card className="md:col-span-2 border-slate-200 shadow-sm rounded-2xl">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-4">
            <CardTitle className="text-lg text-[#0F284B]">Personal Information</CardTitle>
            <CardDescription>Your core identity details</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label className="text-[#0F284B] font-semibold">Full Name</Label>
                <Input name="fullName" value={formData.fullName} onChange={handleChange} required className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F284B] font-semibold">Phone Number</Label>
                <Input name="phone" value={formData.phone} onChange={handleChange} required className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F284B] font-semibold">Age</Label>
                <Input name="age" type="number" value={formData.age} onChange={handleChange} className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500" />
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F284B] font-semibold">Gender</Label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="flex h-11 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 outline-none">
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F284B] font-semibold">Blood Group</Label>
                <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="flex h-11 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-orange-500 focus:ring-orange-500 outline-none font-bold text-red-600">
                  <option value="" className="text-slate-900 font-normal">Select...</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[#0F284B] font-semibold">Organ Donor</Label>
                <select name="organDonorStatus" value={formData.organDonorStatus ? "true" : "false"} onChange={(e) => setFormData({...formData, organDonorStatus: e.target.value === "true"})} className="flex h-11 w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm focus:border-orange-500 outline-none">
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label className="text-[#0F284B] font-semibold">Home Address</Label>
              <Input name="address" value={formData.address} onChange={handleChange} className="h-11 border-slate-200 focus:border-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-orange-200 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="bg-orange-50 border-b border-orange-100 pb-4">
          <CardTitle className="text-lg text-orange-800 flex items-center gap-2">Primary Emergency Contact</CardTitle>
          <CardDescription className="text-orange-700/70 font-medium">This contact will be notified via SMS if you are in an accident.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <Label className="text-[#0F284B] font-semibold">Contact Name</Label>
              <Input name="emergencyContactName" value={formData.emergencyContactName} onChange={handleChange} required className="h-11 border-slate-200 focus:border-orange-500" placeholder="e.g. Spouse, Parent" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0F284B] font-semibold">Phone Number</Label>
              <Input name="emergencyContactPhone" value={formData.emergencyContactPhone} onChange={handleChange} required className="h-11 border-slate-200 focus:border-orange-500" placeholder="10-digit mobile" />
            </div>
            <div className="space-y-2">
              <Label className="text-[#0F284B] font-semibold">Email (Optional)</Label>
              <Input name="emergencyContactEmail" type="email" value={formData.emergencyContactEmail} onChange={handleChange} className="h-11 border-slate-200 focus:border-orange-500" placeholder="For backup alerts" />
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
