import { demoData } from "./demoData";

// In-memory store for Vercel deployment where SQLite isn't persistent
class DemoStore {
  private data: any = JSON.parse(JSON.stringify(demoData));

  // Users
  getUserByEmail(email: string) {
    return this.data.users.find((u: any) => u.email === email) || null;
  }
  getUserById(id: string) {
    return this.data.users.find((u: any) => u.id === id) || null;
  }

  // Citizen Profile
  getCitizenProfileByUserId(userId: string) {
    const cp = this.data.citizenProfiles.find((cp: any) => cp.userId === userId);
    if (!cp) return null;
    return {
      ...cp,
      medicalInfo: this.data.medicalInfo.find((m: any) => m.citizenId === cp.id),
      vehicles: this.data.vehicles.filter((v: any) => v.citizenId === cp.id),
      passengers: this.data.passengers.filter((p: any) => p.citizenId === cp.id),
      qrCodes: this.data.qrCodes.filter((q: any) => q.citizenId === cp.id)
    };
  }

  getCitizenProfileById(id: string) {
    const cp = this.data.citizenProfiles.find((cp: any) => cp.id === id);
    if (!cp) return null;
    return {
      ...cp,
      user: this.data.users.find((u: any) => u.id === cp.userId)
    };
  }

  // QR Codes
  getQRCodeByToken(token: string) {
    const qr = this.data.qrCodes.find((q: any) => q.qrToken === token);
    if (!qr) return null;
    const vehicle = this.data.vehicles.find((v: any) => v.id === qr.vehicleId);
    const citizen = this.getCitizenProfileById(qr.citizenId);
    const medicalInfo = this.data.medicalInfo.find((m: any) => m.citizenId === qr.citizenId);
    const passengers = this.data.passengers.filter((p: any) => p.citizenId === qr.citizenId);
    return {
      ...qr,
      vehicle,
      citizen: {
        ...citizen,
        medicalInfo,
        passengers
      }
    };
  }

  // Accident Cases
  createAccidentCase(data: any) {
    const newCase = {
      id: `case_${Date.now()}`,
      ...data,
      status: "ACTIVE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.data.accidentCases.push(newCase);
    return newCase;
  }

  getCaseById(caseId: string) {
    const c = this.data.accidentCases.find((c: any) => c.id === caseId);
    if (!c) return null;
    return {
      ...c,
      citizen: this.getCitizenProfileById(c.citizenId),
      vehicle: this.data.vehicles.find((v: any) => v.id === c.vehicleId),
      vitals: this.data.emsVitals.filter((v: any) => v.caseId === caseId),
      hospitalResponse: this.data.hospitalResponses.find((hr: any) => hr.caseId === caseId)
    };
  }

  getHospitalCases(hospitalId: string) {
    return this.data.accidentCases
      .filter((c: any) => c.assignedHospitalId === hospitalId)
      .map((c: any) => this.getCaseById(c.id));
  }

  getAllCases() {
    return this.data.accidentCases;
  }

  updateCaseStatus(caseId: string, status: string) {
    const c = this.data.accidentCases.find((c: any) => c.id === caseId);
    if (c) {
      c.status = status;
      c.updatedAt = new Date().toISOString();
    }
    return c;
  }

  // Vitals
  addVitals(data: any) {
    const v = {
      id: `vitals_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.data.emsVitals.push(v);
    return v;
  }

  // Hospitals
  getAllHospitals() {
    return this.data.hospitals;
  }

  getHospitalByUserId(userId: string) {
    return this.data.hospitals.find((h: any) => h.userId === userId);
  }

  // Notifications
  createNotification(data: any) {
    const n = {
      id: `notif_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.data.notifications.push(n);
    return n;
  }

  getNotifications() {
    return this.data.notifications;
  }

  // Police Reports
  createPoliceReport(data: any) {
    const r = {
      id: `pr_${Date.now()}`,
      ...data,
      createdAt: new Date().toISOString()
    };
    this.data.policeReports.push(r);
    return r;
  }
}

// Singleton instance
let globalStore: DemoStore;

export function getDemoStore() {
  if (!globalStore) {
    globalStore = new DemoStore();
  }
  return globalStore;
}
