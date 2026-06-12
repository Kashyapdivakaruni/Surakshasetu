-- AlterTable
ALTER TABLE "CitizenProfile" ADD COLUMN "emergencyContactEmail" TEXT;

-- AlterTable
ALTER TABLE "EMSVitals" ADD COLUMN "bleedingSeverity" TEXT;
ALTER TABLE "EMSVitals" ADD COLUMN "bloodSugar" INTEGER;
ALTER TABLE "EMSVitals" ADD COLUMN "fractureDetails" TEXT;
ALTER TABLE "EMSVitals" ADD COLUMN "passengerId" TEXT;
ALTER TABLE "EMSVitals" ADD COLUMN "patientName" TEXT;
ALTER TABLE "EMSVitals" ADD COLUMN "respiratoryRate" INTEGER;
ALTER TABLE "EMSVitals" ADD COLUMN "triageConfidence" REAL;
ALTER TABLE "EMSVitals" ADD COLUMN "triageLevel" TEXT;
ALTER TABLE "EMSVitals" ADD COLUMN "triageScore" INTEGER;

-- CreateTable
CREATE TABLE "AmbulanceLocation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AmbulanceLocation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AccidentCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "passengerId" TEXT,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "dataUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AccidentCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UploadedFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AccidentCase" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "qrCodeId" TEXT,
    "citizenId" TEXT,
    "vehicleId" TEXT,
    "scannedByEmsId" TEXT,
    "assignedHospitalId" TEXT,
    "accidentLatitude" REAL,
    "accidentLongitude" REAL,
    "accidentAddress" TEXT,
    "severityLevel" TEXT,
    "identityStatus" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ambulanceEtaMinutes" INTEGER,
    "manualPatientName" TEXT,
    "manualPatientAge" INTEGER,
    "manualPatientGender" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AccidentCase_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccidentCase_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "CitizenProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AccidentCase_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AccidentCase" ("accidentAddress", "accidentLatitude", "accidentLongitude", "ambulanceEtaMinutes", "assignedHospitalId", "citizenId", "createdAt", "id", "identityStatus", "qrCodeId", "scannedByEmsId", "severityLevel", "status", "updatedAt", "vehicleId") SELECT "accidentAddress", "accidentLatitude", "accidentLongitude", "ambulanceEtaMinutes", "assignedHospitalId", "citizenId", "createdAt", "id", "identityStatus", "qrCodeId", "scannedByEmsId", "severityLevel", "status", "updatedAt", "vehicleId" FROM "AccidentCase";
DROP TABLE "AccidentCase";
ALTER TABLE "new_AccidentCase" RENAME TO "AccidentCase";
CREATE TABLE "new_HospitalProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" REAL NOT NULL,
    "longitude" REAL NOT NULL,
    "traumaCareAvailable" BOOLEAN NOT NULL DEFAULT false,
    "icuBedsAvailable" INTEGER NOT NULL DEFAULT 0,
    "emergencyBedsAvailable" INTEGER NOT NULL DEFAULT 0,
    "contactNumber" TEXT NOT NULL,
    "specialization" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "emergencySupportAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HospitalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HospitalProfile" ("address", "contactNumber", "createdAt", "emergencyBedsAvailable", "hospitalName", "icuBedsAvailable", "id", "latitude", "longitude", "traumaCareAvailable", "updatedAt", "userId") SELECT "address", "contactNumber", "createdAt", "emergencyBedsAvailable", "hospitalName", "icuBedsAvailable", "id", "latitude", "longitude", "traumaCareAvailable", "updatedAt", "userId" FROM "HospitalProfile";
DROP TABLE "HospitalProfile";
ALTER TABLE "new_HospitalProfile" RENAME TO "HospitalProfile";
CREATE UNIQUE INDEX "HospitalProfile_userId_key" ON "HospitalProfile"("userId");
CREATE TABLE "new_HospitalResponse" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "caseId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "preparationNotes" TEXT,
    "doctorAssigned" TEXT,
    "bedNumber" TEXT,
    "videoRoomId" TEXT,
    "videoStatus" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HospitalResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AccidentCase" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HospitalResponse" ("bedNumber", "caseId", "doctorAssigned", "hospitalId", "id", "preparationNotes", "status", "updatedAt") SELECT "bedNumber", "caseId", "doctorAssigned", "hospitalId", "id", "preparationNotes", "status", "updatedAt" FROM "HospitalResponse";
DROP TABLE "HospitalResponse";
ALTER TABLE "new_HospitalResponse" RENAME TO "HospitalResponse";
CREATE TABLE "new_QRCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "citizenId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "qrImageData" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME,
    "regeneratedAt" DATETIME,
    "revokedAt" DATETIME,
    CONSTRAINT "QRCode_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "CitizenProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QRCode_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_QRCode" ("citizenId", "createdAt", "expiresAt", "id", "isActive", "qrImageData", "qrToken", "vehicleId") SELECT "citizenId", "createdAt", "expiresAt", "id", "isActive", "qrImageData", "qrToken", "vehicleId" FROM "QRCode";
DROP TABLE "QRCode";
ALTER TABLE "new_QRCode" RENAME TO "QRCode";
CREATE UNIQUE INDEX "QRCode_qrToken_key" ON "QRCode"("qrToken");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
