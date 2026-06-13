const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with test users...');

  // Hash password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Citizen
  const citizen = await prisma.user.upsert({
    where: { email: 'citizen@demo.com' },
    update: {},
    create: {
      email: 'citizen@demo.com',
      fullName: 'Ravi Kumar',
      phone: '9876543210',
      passwordHash,
      role: 'CITIZEN',
      citizenProfile: {
        create: {
          age: 34,
          gender: 'Male',
          bloodGroup: 'O+',
          address: 'Banjara Hills, Hyderabad, Telangana',
          emergencyContactName: 'Priya Kumar',
          emergencyContactPhone: '9876500000',
          medicalInfo: {
            create: {
              previousConditions: 'Hypertension',
              allergies: 'Penicillin',
              currentMedications: 'Amlodipine',
            }
          },
          vehicles: {
            create: {
              id: 'seed-vehicle-1',
              vehicleNumber: 'TS-09-AB-1234',
              vehicleType: 'Car',
              vehicleColor: 'White',
              registrationState: 'Telangana'
            }
          },
          passengers: {
            create: [
              {
                name: 'Priya Kumar',
                age: 30,
                gender: 'Female',
                relationship: 'Wife',
                bloodGroup: 'A+',
                healthConditions: 'None',
                allergies: 'None',
                emergencyContactName: 'Rahul',
                emergencyContactPhone: '9876543211',
              }
            ]
          },
          qrCodes: {
            create: {
              id: 'seed-qr-1',
              vehicleId: 'seed-vehicle-1',
              qrToken: 'demo-token-123',
              isActive: true,
            }
          }
        }
      }
    },
  });

  const citizenProfile = await prisma.citizenProfile.findUnique({ where: { userId: citizen.id } });

  // 2. EMS
  const ems = await prisma.user.upsert({
    where: { email: 'ems@demo.com' },
    update: {},
    create: {
      email: 'ems@demo.com',
      fullName: 'Dr. Anita Desai',
      phone: '9988776655',
      passwordHash,
      role: 'EMS',
    },
  });



  // Create mock Accident Case so Dashboard isn't empty
  await prisma.accidentCase.upsert({
    where: { id: 'seed-case-1' },
    update: {},
    create: {
      id: 'seed-case-1',
      qrCodeId: 'seed-qr-1',
      citizenId: citizenProfile.id,
      vehicleId: 'seed-vehicle-1',
      scannedByEmsId: ems.id,
      accidentLatitude: 17.3850,
      accidentLongitude: 78.4867,
      accidentAddress: 'Outer Ring Road, Hyderabad',
      severityLevel: 'CRITICAL',
      identityStatus: 'VERIFIED',
      status: 'ACTIVE',
      ambulanceEtaMinutes: 12,
      emsVitals: {
        create: {
          emsId: ems.id,
          bloodPressure: '130/85',
          pulseRate: 110,
          oxygenLevel: 94,
          temperature: 98.6,
          consciousnessStatus: 'SEMI_CONSCIOUS',
          injuryObservations: 'Blunt trauma to chest, minor lacerations.',
        }
      }
    }
  });

  // 4. Police
  const police = await prisma.user.upsert({
    where: { email: 'police@demo.com' },
    update: {},
    create: {
      email: 'police@demo.com',
      fullName: 'Inspector Singh',
      phone: '100',
      passwordHash,
      role: 'POLICE',
    },
  });

  // 5. Hospital 1 (Primary)
  const hospitalUser = await prisma.user.upsert({
    where: { email: 'hospital@demo.com' },
    update: {},
    create: {
      email: 'hospital@demo.com',
      fullName: 'City General Hospital',
      phone: '9112233445',
      passwordHash,
      role: 'HOSPITAL',
      hospitalProfile: {
        create: {
          hospitalName: 'City General Hospital',
          address: 'Road No. 2, Banjara Hills, Hyderabad',
          latitude: 17.4165,
          longitude: 78.4416,
          traumaCareAvailable: true,
          icuBedsAvailable: 15,
          emergencyBedsAvailable: 8,
          contactNumber: '+91 9112233445',
          specialization: 'Trauma & Emergency Services',
          status: 'Available',
          emergencySupportAvailable: true,
        }
      }
    }
  });

  // 6. Hospital 2 (Apollo)
  await prisma.user.upsert({
    where: { email: 'apollo@demo.com' },
    update: {},
    create: {
      email: 'apollo@demo.com',
      fullName: 'Apollo Hospital Jubilee Hills',
      phone: '9885544332',
      passwordHash,
      role: 'HOSPITAL',
      hospitalProfile: {
        create: {
          hospitalName: 'Apollo Hospital Jubilee Hills',
          address: 'Jubilee Hills, Hyderabad, Telangana',
          latitude: 17.4265,
          longitude: 78.4116,
          traumaCareAvailable: true,
          icuBedsAvailable: 25,
          emergencyBedsAvailable: 12,
          contactNumber: '+91 9885544332',
          specialization: 'Cardiology, Neurology & Trauma',
          status: 'Available',
          emergencySupportAvailable: true,
        }
      }
    }
  });

  // 7. Hospital 3 (Care)
  await prisma.user.upsert({
    where: { email: 'care@demo.com' },
    update: {},
    create: {
      email: 'care@demo.com',
      fullName: 'Care Hospital Gachibowli',
      phone: '9776655443',
      passwordHash,
      role: 'HOSPITAL',
      hospitalProfile: {
        create: {
          hospitalName: 'Care Hospital Gachibowli',
          address: 'Gachibowli, Hyderabad, Telangana',
          latitude: 17.4325,
          longitude: 78.3685,
          traumaCareAvailable: false,
          icuBedsAvailable: 10,
          emergencyBedsAvailable: 5,
          contactNumber: '+91 9776655443',
          specialization: 'Orthopedics & General Medicine',
          status: 'Available',
          emergencySupportAvailable: true,
        }
      }
    }
  });

  console.log('Seed completed. Users created:');
  console.log({ citizen: citizen.email, ems: ems.email, police: police.email, hospital: hospitalUser.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
