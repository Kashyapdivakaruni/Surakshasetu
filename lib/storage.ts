import { prisma } from "./prisma";

// Production Database Storage using Prisma
export const storage = {
  async getUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async getUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  },

  async getCitizenProfileByUserId(userId: string) {
    return prisma.citizenProfile.findUnique({
      where: { userId },
      include: { qrCodes: true, vehicles: true, passengers: true, medicalInfo: true }
    });
  },

  async getQRCodeByToken(token: string) {
    return prisma.qRCode.findUnique({
      where: { qrToken: token },
      include: { citizen: { include: { medicalInfo: true } }, vehicle: true }
    });
  },

  async createAccidentCase(data: any) {
    return prisma.accidentCase.create({
      data: {
        qrCodeId: data.qrCodeId,
        citizenId: data.citizenId,
        vehicleId: data.vehicleId,
        status: "ACTIVE",
        severityLevel: "CRITICAL"
      }
    });
  },

  async getCaseById(caseId: string) {
    return prisma.accidentCase.findUnique({
      where: { id: caseId },
      include: { citizen: { include: { medicalInfo: true } }, vehicle: true, emsVitals: true }
    });
  },

  async getHospitalCases(hospitalId: string) {
    return prisma.accidentCase.findMany({
      where: { assignedHospitalId: hospitalId }
    });
  },

  async updateCaseStatus(caseId: string, status: string) {
    return prisma.accidentCase.update({
      where: { id: caseId },
      data: { status }
    });
  },

  async addVitals(data: any) {
    return prisma.eMSVitals.create({
      data: {
        caseId: data.caseId,
        emsId: data.emsId,
        bloodPressure: data.bloodPressure,
        pulseRate: data.pulseRate,
        oxygenLevel: data.oxygenLevel,
        injuryObservations: data.injuryObservations,
        consciousnessStatus: data.consciousnessStatus
      }
    });
  },

  async getAllHospitals() {
    return prisma.hospitalProfile.findMany();
  },

  async getHospitalByUserId(userId: string) {
    return prisma.hospitalProfile.findUnique({
      where: { userId }
    });
  },

  async createNotification(data: any) {
    return prisma.notification.create({
      data: {
        caseId: data.caseId,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone,
        type: data.type,
        message: data.message,
        status: "SENT"
      }
    });
  },

  async getNotifications() {
    return prisma.notification.findMany({
      orderBy: { createdAt: 'desc' }
    });
  },

  async createPoliceReport(data: any) {
    return prisma.policeReport.create({
      data: {
        caseId: data.caseId,
        officerId: data.officerId,
        firNumber: data.firNumber,
        accidentDescription: data.accidentDescription,
        accidentLocation: data.accidentLocation,
        vehicleVerificationStatus: data.vehicleVerificationStatus
      }
    });
  }
};
