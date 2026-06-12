import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Car, Users, HeartPulse, UserCircle, ArrowRight, ShieldCheck, FileText } from "lucide-react";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function CitizenDashboard() {
  const session = await getSession();
  
  if (!session || !session.user) {
    return <div>Unauthorized</div>;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      citizenProfile: {
        include: {
          medicalInfo: true,
          vehicles: true,
          passengers: true,
          qrCodes: { where: { isActive: true } }
        }
      }
    }
  });

  if (!user) return <div>User not found</div>;

  const profile = user.citizenProfile;
  const hasMedical = profile?.medicalInfo != null;
  const hasVehicle = profile && profile.vehicles.length > 0;
  const hasPassenger = profile && profile.passengers.length > 0;
  const hasContact = profile?.emergencyContactPhone && profile?.emergencyContactName;
  const hasActiveQr = profile && profile.qrCodes.length > 0;

  // Calculate profile completion
  let completionPoints = 0;
  if (profile?.age && profile?.bloodGroup) completionPoints += 25;
  if (hasContact) completionPoints += 25;
  if (hasMedical) completionPoints += 25;
  if (hasVehicle) completionPoints += 25;

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#0F284B]">Welcome, {user.fullName}</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your emergency response profile and secure QR systems.</p>
      </div>

      {/* Progress Section */}
      <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-md rounded-2xl overflow-hidden relative border border-white/50">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
          <ShieldCheck className="w-48 h-48 text-[#0F284B]" />
        </div>
        <CardHeader className="relative z-10 pb-2">
          <CardTitle className="text-xl text-[#0F284B] flex items-center gap-2">
            Profile Completion
          </CardTitle>
          <CardDescription className="text-slate-500 font-medium">Complete all sections to ensure EMS has full data during emergencies.</CardDescription>
        </CardHeader>
        <CardContent className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
              <div 
                className={`h-full rounded-full transition-all duration-1000 ${
                  completionPoints === 100 ? 'bg-green-500' : 'bg-orange-500'
                }`}
                style={{ width: `${completionPoints}%` }}
              />
            </div>
            <span className="font-bold text-[#0F284B]">{completionPoints}%</span>
          </div>
          {completionPoints < 100 && (
            <p className="text-sm text-orange-600 font-semibold">
              Action Required: Please complete your profile to generate or ensure the effectiveness of your QR.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions Grid */}
      <h2 className="text-xl font-bold text-[#0F284B] pt-4">Quick Actions</h2>
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        
        <Link href="/citizen/profile" className="group">
          <Card className="h-full border border-slate-200 hover:border-[#0F284B]/30 hover:shadow-lg transition-all rounded-2xl group-hover:-translate-y-1">
            <CardContent className="p-6 flex flex-col items-start gap-4">
              <div className={`p-3 rounded-xl ${profile?.age ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                <UserCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F284B] text-lg mb-1">Complete Profile</h3>
                <p className="text-sm text-slate-500 font-medium">Personal details, photo, and emergency contacts.</p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-sm font-bold text-blue-600 group-hover:text-[#0F284B] transition-colors">
                {profile?.age ? "Update Profile" : "Start Profile"} <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/citizen/medical" className="group">
          <Card className="h-full border border-slate-200 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/5 transition-all rounded-2xl group-hover:-translate-y-1">
            <CardContent className="p-6 flex flex-col items-start gap-4">
              <div className={`p-3 rounded-xl ${hasMedical ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                <HeartPulse className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F284B] text-lg mb-1">Add Medical Info</h3>
                <p className="text-sm text-slate-500 font-medium">Allergies, conditions, and critical medications.</p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-sm font-bold text-red-600 group-hover:text-red-700 transition-colors">
                {hasMedical ? "Update Medical" : "Add Medical"} <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/citizen/vehicle" className="group">
          <Card className="h-full border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all rounded-2xl group-hover:-translate-y-1">
            <CardContent className="p-6 flex flex-col items-start gap-4">
              <div className={`p-3 rounded-xl ${hasVehicle ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F284B] text-lg mb-1">Register Vehicle</h3>
                <p className="text-sm text-slate-500 font-medium">Link a vehicle to your emergency QR profile.</p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-sm font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                Manage Vehicles <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/citizen/passengers" className="group">
          <Card className="h-full border border-slate-200 hover:border-teal-300 hover:shadow-lg transition-all rounded-2xl group-hover:-translate-y-1">
            <CardContent className="p-6 flex flex-col items-start gap-4">
              <div className={`p-3 rounded-xl ${hasPassenger ? 'bg-green-100 text-green-700' : 'bg-teal-100 text-teal-700'}`}>
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-[#0F284B] text-lg mb-1">Manage Passengers</h3>
                <p className="text-sm text-slate-500 font-medium">Add frequent co-passengers for faster EMS response.</p>
              </div>
              <div className="mt-auto pt-4 flex items-center text-sm font-bold text-teal-600 group-hover:text-teal-700 transition-colors">
                Add Passengers <ArrowRight className="w-4 h-4 ml-1" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/citizen/qr" className="group md:col-span-2 lg:col-span-2">
          <Card className={`h-full border transition-all rounded-2xl group-hover:-translate-y-1 overflow-hidden relative ${
            hasActiveQr ? 'bg-[#0F284B] text-white hover:shadow-lg hover:shadow-blue-900/20' : 'bg-white border-slate-200 hover:border-[#0F284B]/30'
          }`}>
            <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10 h-full">
              <div className="flex items-start gap-4">
                <div className={`p-4 rounded-2xl shrink-0 ${hasActiveQr ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <h3 className={`font-bold text-xl mb-1 ${hasActiveQr ? 'text-white' : 'text-[#0F284B]'}`}>
                    View Emergency QR
                  </h3>
                  <p className={`text-sm font-medium ${hasActiveQr ? 'text-blue-100' : 'text-slate-500'}`}>
                    {hasActiveQr 
                      ? "Your permanent secure QR code is active and ready." 
                      : "Complete your profile and add a vehicle to generate your secure QR code."}
                  </p>
                </div>
              </div>
              <Button 
                variant={hasActiveQr ? "secondary" : "default"}
                className={`shrink-0 rounded-full font-bold px-6 h-12 ${
                  hasActiveQr ? "bg-white text-[#0F284B] hover:bg-slate-100" : "bg-[#0F284B] hover:bg-[#1A3A6B] text-white"
                }`}
              >
                {hasActiveQr ? "Open QR Center" : "Setup QR"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>
  );
}
