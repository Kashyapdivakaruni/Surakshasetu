-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "profilePhoto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "age" INTEGER,
    "gender" TEXT,
    "bloodGroup" TEXT,
    "address" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "emergencyContactEmail" TEXT,
    "organDonorStatus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CitizenProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicalInfo" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "previousConditions" TEXT,
    "allergies" TEXT,
    "currentMedications" TEXT,
    "disabilities" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicalInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "vehicleNumber" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "vehicleColor" TEXT NOT NULL,
    "registrationState" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passenger" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "relationship" TEXT NOT NULL,
    "photo" TEXT,
    "bloodGroup" TEXT,
    "healthConditions" TEXT,
    "allergies" TEXT,
    "emergencyContactName" TEXT,
    "emergencyContactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Passenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "qrToken" TEXT NOT NULL,
    "qrImageData" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "regeneratedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccidentCase" (
    "id" TEXT NOT NULL,
    "qrCodeId" TEXT,
    "citizenId" TEXT,
    "vehicleId" TEXT,
    "scannedByEmsId" TEXT,
    "assignedHospitalId" TEXT,
    "accidentLatitude" DOUBLE PRECISION,
    "accidentLongitude" DOUBLE PRECISION,
    "accidentAddress" TEXT,
    "severityLevel" TEXT,
    "identityStatus" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "ambulanceEtaMinutes" INTEGER,
    "trackingToken" TEXT,
    "manualPatientName" TEXT,
    "manualPatientAge" INTEGER,
    "manualPatientGender" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccidentCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EMSVitals" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "emsId" TEXT NOT NULL,
    "passengerId" TEXT,
    "patientName" TEXT,
    "bloodPressure" TEXT,
    "pulseRate" INTEGER,
    "oxygenLevel" INTEGER,
    "temperature" DOUBLE PRECISION,
    "respiratoryRate" INTEGER,
    "bloodSugar" INTEGER,
    "bleedingSeverity" TEXT,
    "fractureDetails" TEXT,
    "consciousnessStatus" TEXT,
    "injuryObservations" TEXT,
    "emergencyNotes" TEXT,
    "triageScore" INTEGER,
    "triageLevel" TEXT,
    "triageConfidence" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EMSVitals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "traumaCareAvailable" BOOLEAN NOT NULL DEFAULT false,
    "icuBedsAvailable" INTEGER NOT NULL DEFAULT 0,
    "emergencyBedsAvailable" INTEGER NOT NULL DEFAULT 0,
    "contactNumber" TEXT NOT NULL,
    "specialization" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Available',
    "emergencySupportAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HospitalResponse" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "preparationNotes" TEXT,
    "doctorAssigned" TEXT,
    "bedNumber" TEXT,
    "videoRoomId" TEXT,
    "videoStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HospitalResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PoliceReport" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "officerId" TEXT NOT NULL,
    "firNumber" TEXT,
    "accidentDescription" TEXT,
    "accidentLocation" TEXT,
    "vehicleVerificationStatus" TEXT,
    "legalNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PoliceReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "caseId" TEXT,
    "recipientName" TEXT NOT NULL,
    "recipientPhone" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "trackingLink" TEXT,
    "status" TEXT NOT NULL,
    "recipientUserId" TEXT,
    "senderUserId" TEXT,
    "senderRole" TEXT,
    "recipientRole" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "role" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "ipAddress" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AmbulanceLocation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AmbulanceLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UploadedFile" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "passengerId" TEXT,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "dataUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UploadedFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "CitizenProfile_userId_key" ON "CitizenProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MedicalInfo_citizenId_key" ON "MedicalInfo"("citizenId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_qrToken_key" ON "QRCode"("qrToken");

-- CreateIndex
CREATE UNIQUE INDEX "AccidentCase_trackingToken_key" ON "AccidentCase"("trackingToken");

-- CreateIndex
CREATE UNIQUE INDEX "HospitalProfile_userId_key" ON "HospitalProfile"("userId");

-- AddForeignKey
ALTER TABLE "CitizenProfile" ADD CONSTRAINT "CitizenProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicalInfo" ADD CONSTRAINT "MedicalInfo_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "CitizenProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "CitizenProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passenger" ADD CONSTRAINT "Passenger_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "CitizenProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "CitizenProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentCase" ADD CONSTRAINT "AccidentCase_qrCodeId_fkey" FOREIGN KEY ("qrCodeId") REFERENCES "QRCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentCase" ADD CONSTRAINT "AccidentCase_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "CitizenProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccidentCase" ADD CONSTRAINT "AccidentCase_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EMSVitals" ADD CONSTRAINT "EMSVitals_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AccidentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalProfile" ADD CONSTRAINT "HospitalProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HospitalResponse" ADD CONSTRAINT "HospitalResponse_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AccidentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PoliceReport" ADD CONSTRAINT "PoliceReport_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AccidentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AmbulanceLocation" ADD CONSTRAINT "AmbulanceLocation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AccidentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "AccidentCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UploadedFile" ADD CONSTRAINT "UploadedFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
