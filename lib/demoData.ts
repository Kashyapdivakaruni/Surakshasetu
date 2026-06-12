export const demoData = {
  users: [
    {
      id: "u1",
      fullName: "Ravi Kumar",
      email: "citizen@demo.com",
      phone: "9876543210",
      passwordHash: "$2a$10$xyz", // Mock hash
      role: "CITIZEN",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "u2",
      fullName: "EMS Officer Arjun",
      email: "ems@demo.com",
      phone: "9000000001",
      passwordHash: "$2a$10$xyz",
      role: "EMS",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "u3",
      fullName: "City Care Admin",
      email: "hospital@demo.com",
      phone: "9000000002",
      passwordHash: "$2a$10$xyz",
      role: "HOSPITAL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "u4",
      fullName: "Inspector Meera Singh",
      email: "police@demo.com",
      phone: "9000000003",
      passwordHash: "$2a$10$xyz",
      role: "POLICE",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  citizenProfiles: [
    {
      id: "cp1",
      userId: "u1",
      age: 34,
      gender: "Male",
      bloodGroup: "O+",
      address: "Andheri East, Mumbai, Maharashtra",
      emergencyContactName: "Priya Kumar",
      emergencyContactPhone: "9876500000",
      organDonorStatus: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  medicalInfo: [
    {
      id: "m1",
      citizenId: "cp1",
      previousConditions: "Asthma",
      allergies: "Penicillin",
      currentMedications: "Inhaler",
      disabilities: "None",
      notes: "May require oxygen support during breathing difficulty",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  vehicles: [
    {
      id: "v1",
      citizenId: "cp1",
      vehicleNumber: "MH12AB1234",
      vehicleType: "Car",
      vehicleColor: "White",
      registrationState: "Maharashtra",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  passengers: [
    {
      id: "p1",
      citizenId: "cp1",
      name: "Ananya Kumar",
      age: 30,
      gender: "Female",
      relationship: "Wife",
      bloodGroup: "A+",
      healthConditions: "None",
      allergies: "None",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "p2",
      citizenId: "cp1",
      name: "Rohan Kumar",
      age: 8,
      gender: "Male",
      relationship: "Son",
      bloodGroup: "B+",
      healthConditions: "Mild allergy",
      allergies: "Dust",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  hospitals: [
    {
      id: "h1",
      userId: "u3",
      hospitalName: "City Care Trauma Center",
      address: "Central Road, Mumbai",
      latitude: 19.0760,
      longitude: 72.8777,
      traumaCareAvailable: true,
      icuBedsAvailable: 5,
      emergencyBedsAvailable: 12,
      contactNumber: "0221000001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "h2",
      userId: "mock_h2",
      hospitalName: "Suraksha Multi Speciality Hospital",
      address: "Ring Road, Mumbai",
      latitude: 19.0820,
      longitude: 72.8890,
      traumaCareAvailable: true,
      icuBedsAvailable: 8,
      emergencyBedsAvailable: 20,
      contactNumber: "0221000002",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "h3",
      userId: "mock_h3",
      hospitalName: "National Emergency Hospital",
      address: "Highway Junction, Mumbai",
      latitude: 19.0650,
      longitude: 72.8700,
      traumaCareAvailable: false,
      icuBedsAvailable: 3,
      emergencyBedsAvailable: 10,
      contactNumber: "0221000003",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  qrCodes: [
    {
      id: "q1",
      citizenId: "cp1",
      vehicleId: "v1",
      qrToken: "demo-secure-token-12345",
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ],
  accidentCases: [],
  emsVitals: [],
  notifications: [],
  hospitalResponses: [],
  policeReports: [],
  auditLogs: []
};
