const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('password1234', 10);

  console.log('🌱 Starting seed...');

  // Provider 1: Plomero
  const plumber = await prisma.user.create({
    data: {
      email: 'juan.perez@email.com',
      password,
      firstName: 'Juan',
      lastName: 'Pérez',
      phone: '+54 11 1234-5678',
      address: 'Av. Corrientes 1234, CABA',
      role: 'PROVIDER',
      services: {
        create: [
          {
            title: 'Reparación de cañerías',
            description:
              'Servicio profesional de reparación de cañerías con garantía. Atención de emergencias 24/7.',
            price: 5000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '08:00',
                  endTime: '18:00',
                },
                {
                  dayOfWeek: 'WEDNESDAY',
                  startTime: '08:00',
                  endTime: '18:00',
                },
                {
                  dayOfWeek: 'FRIDAY',
                  startTime: '08:00',
                  endTime: '18:00',
                },
              ],
            },
          },
          {
            title: 'Instalación de sanitarios',
            description:
              'Instalación completa de inodoros, lavatorios, bidets y duchas.',
            price: 7500,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'TUESDAY',
                  startTime: '09:00',
                  endTime: '17:00',
                },
                {
                  dayOfWeek: 'THURSDAY',
                  startTime: '09:00',
                  endTime: '17:00',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Provider 2: Electricista
  const electrician = await prisma.user.create({
    data: {
      email: 'maria.gomez@email.com',
      password,
      firstName: 'María',
      lastName: 'Gómez',
      phone: '+54 11 2345-6789',
      address: 'Av. Santa Fe 2345, CABA',
      role: 'PROVIDER',
      services: {
        create: [
          {
            title: 'Reparación eléctrica general',
            description:
              'Arreglo de cortocircuitos, cambio de cables y tableros eléctricos.',
            price: 4500,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '10:00',
                  endTime: '19:00',
                },
                {
                  dayOfWeek: 'TUESDAY',
                  startTime: '10:00',
                  endTime: '19:00',
                },
                {
                  dayOfWeek: 'FRIDAY',
                  startTime: '10:00',
                  endTime: '19:00',
                },
              ],
            },
          },
          {
            title: 'Instalación de iluminación LED',
            description:
              'Instalación profesional de sistemas de iluminación LED con diseño personalizado.',
            price: 6000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'WEDNESDAY',
                  startTime: '10:00',
                  endTime: '18:00',
                },
                {
                  dayOfWeek: 'SATURDAY',
                  startTime: '09:00',
                  endTime: '14:00',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Provider 3: Pintor
  const painter = await prisma.user.create({
    data: {
      email: 'carlos.lopez@email.com',
      password,
      firstName: 'Carlos',
      lastName: 'López',
      phone: '+54 11 3456-7890',
      address: 'Av. Rivadavia 3456, CABA',
      role: 'PROVIDER',
      services: {
        create: [
          {
            title: 'Pintura de interiores',
            description:
              'Pintura profesional de ambientes interiores con materiales de primera calidad.',
            price: 8000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '08:00',
                  endTime: '17:00',
                },
                {
                  dayOfWeek: 'WEDNESDAY',
                  startTime: '08:00',
                  endTime: '17:00',
                },
                {
                  dayOfWeek: 'FRIDAY',
                  startTime: '08:00',
                  endTime: '17:00',
                },
              ],
            },
          },
          {
            title: 'Pintura de fachadas',
            description:
              'Renovación y protección de fachadas con pinturas impermeables.',
            price: 12000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'TUESDAY',
                  startTime: '07:00',
                  endTime: '16:00',
                },
                {
                  dayOfWeek: 'THURSDAY',
                  startTime: '07:00',
                  endTime: '16:00',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Provider 4: Gasista
  const gasWorker = await prisma.user.create({
    data: {
      email: 'roberto.martinez@email.com',
      password,
      firstName: 'Roberto',
      lastName: 'Martínez',
      phone: '+54 11 4567-8901',
      address: 'Av. Cabildo 4567, CABA',
      role: 'PROVIDER',
      services: {
        create: [
          {
            title: 'Instalación de gas natural',
            description:
              'Instalación certificada de sistemas de gas natural para hogares y comercios.',
            price: 9000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '09:00',
                  endTime: '18:00',
                },
                {
                  dayOfWeek: 'WEDNESDAY',
                  startTime: '09:00',
                  endTime: '18:00',
                },
              ],
            },
          },
          {
            title: 'Reparación de fugas de gas',
            description:
              'Detección y reparación urgente de fugas de gas. Servicio de emergencia.',
            price: 6500,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'TUESDAY',
                  startTime: '08:00',
                  endTime: '20:00',
                },
                {
                  dayOfWeek: 'THURSDAY',
                  startTime: '08:00',
                  endTime: '20:00',
                },
                {
                  dayOfWeek: 'SATURDAY',
                  startTime: '08:00',
                  endTime: '14:00',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Provider 5: Carpintero
  const carpenter = await prisma.user.create({
    data: {
      email: 'laura.fernandez@email.com',
      password,
      firstName: 'Laura',
      lastName: 'Fernández',
      phone: '+54 11 5678-9012',
      address: 'Av. Libertador 5678, CABA',
      role: 'PROVIDER',
      services: {
        create: [
          {
            title: 'Fabricación de muebles a medida',
            description:
              'Diseño y fabricación de muebles personalizados en madera de calidad.',
            price: 15000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '10:00',
                  endTime: '18:00',
                },
                {
                  dayOfWeek: 'THURSDAY',
                  startTime: '10:00',
                  endTime: '18:00',
                },
              ],
            },
          },
          {
            title: 'Reparación de muebles',
            description:
              'Restauración y reparación de todo tipo de muebles de madera.',
            price: 5500,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'TUESDAY',
                  startTime: '09:00',
                  endTime: '17:00',
                },
                {
                  dayOfWeek: 'WEDNESDAY',
                  startTime: '09:00',
                  endTime: '17:00',
                },
                {
                  dayOfWeek: 'FRIDAY',
                  startTime: '09:00',
                  endTime: '17:00',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Provider 6: Jardinero
  const gardener = await prisma.user.create({
    data: {
      email: 'diego.sanchez@email.com',
      password,
      firstName: 'Diego',
      lastName: 'Sánchez',
      phone: '+54 11 6789-0123',
      address: 'Av. del Libertador 6789, CABA',
      role: 'PROVIDER',
      services: {
        create: [
          {
            title: 'Mantenimiento de jardines',
            description:
              'Poda, corte de césped y mantenimiento integral de espacios verdes.',
            price: 4000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '07:00',
                  endTime: '15:00',
                },
                {
                  dayOfWeek: 'WEDNESDAY',
                  startTime: '07:00',
                  endTime: '15:00',
                },
                {
                  dayOfWeek: 'FRIDAY',
                  startTime: '07:00',
                  endTime: '15:00',
                },
              ],
            },
          },
          {
            title: 'Diseño de jardines',
            description:
              'Creación y diseño de jardines personalizados con plantas nativas.',
            price: 10000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'SATURDAY',
                  startTime: '09:00',
                  endTime: '13:00',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Provider 7: Técnico en Aires Acondicionados
  const acTechnician = await prisma.user.create({
    data: {
      email: 'ana.rodriguez@email.com',
      password,
      firstName: 'Ana',
      lastName: 'Rodríguez',
      phone: '+54 11 7890-1234',
      address: 'Av. Córdoba 7890, CABA',
      role: 'PROVIDER',
      services: {
        create: [
          {
            title: 'Instalación de aire acondicionado',
            description:
              'Instalación profesional de equipos de aire acondicionado split y central.',
            price: 8500,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '09:00',
                  endTime: '18:00',
                },
                {
                  dayOfWeek: 'TUESDAY',
                  startTime: '09:00',
                  endTime: '18:00',
                },
                {
                  dayOfWeek: 'THURSDAY',
                  startTime: '09:00',
                  endTime: '18:00',
                },
              ],
            },
          },
          {
            title: 'Mantenimiento y carga de gas',
            description:
              'Service preventivo y carga de gas refrigerante para aires acondicionados.',
            price: 4500,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'WEDNESDAY',
                  startTime: '10:00',
                  endTime: '17:00',
                },
                {
                  dayOfWeek: 'FRIDAY',
                  startTime: '10:00',
                  endTime: '17:00',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Provider 8: Cerrajero
  const locksmith = await prisma.user.create({
    data: {
      email: 'pablo.castro@email.com',
      password,
      firstName: 'Pablo',
      lastName: 'Castro',
      phone: '+54 11 8901-2345',
      address: 'Av. Callao 8901, CABA',
      role: 'PROVIDER',
      services: {
        create: [
          {
            title: 'Apertura de puertas',
            description:
              'Servicio de emergencia para apertura de puertas sin daños.',
            price: 3500,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '08:00',
                  endTime: '20:00',
                },
                {
                  dayOfWeek: 'TUESDAY',
                  startTime: '08:00',
                  endTime: '20:00',
                },
                {
                  dayOfWeek: 'WEDNESDAY',
                  startTime: '08:00',
                  endTime: '20:00',
                },
                {
                  dayOfWeek: 'THURSDAY',
                  startTime: '08:00',
                  endTime: '20:00',
                },
                {
                  dayOfWeek: 'FRIDAY',
                  startTime: '08:00',
                  endTime: '20:00',
                },
              ],
            },
          },
          {
            title: 'Instalación de cerraduras de seguridad',
            description:
              'Instalación de cerraduras multipunto y sistemas de seguridad.',
            price: 7000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '10:00',
                  endTime: '18:00',
                },
                {
                  dayOfWeek: 'FRIDAY',
                  startTime: '10:00',
                  endTime: '18:00',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Provider 9: Técnico en Computación
  const itTechnician = await prisma.user.create({
    data: {
      email: 'sofia.herrera@email.com',
      password,
      firstName: 'Sofía',
      lastName: 'Herrera',
      phone: '+54 11 9012-3456',
      address: 'Av. Pueyrredón 9012, CABA',
      role: 'PROVIDER',
      services: {
        create: [
          {
            title: 'Reparación de computadoras',
            description:
              'Diagnóstico y reparación de PCs y notebooks. Servicio a domicilio.',
            price: 3000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '10:00',
                  endTime: '19:00',
                },
                {
                  dayOfWeek: 'WEDNESDAY',
                  startTime: '10:00',
                  endTime: '19:00',
                },
                {
                  dayOfWeek: 'FRIDAY',
                  startTime: '10:00',
                  endTime: '19:00',
                },
              ],
            },
          },
          {
            title: 'Instalación de redes y WiFi',
            description:
              'Configuración de redes domésticas y empresariales, instalación de routers.',
            price: 4500,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'TUESDAY',
                  startTime: '11:00',
                  endTime: '18:00',
                },
                {
                  dayOfWeek: 'THURSDAY',
                  startTime: '11:00',
                  endTime: '18:00',
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Provider 10: Limpieza y Mantenimiento
  const cleaner = await prisma.user.create({
    data: {
      email: 'miguel.ruiz@email.com',
      password,
      firstName: 'Miguel',
      lastName: 'Ruiz',
      phone: '+54 11 0123-4567',
      address: 'Av. Las Heras 1234, CABA',
      role: 'PROVIDER',
      services: {
        create: [
          {
            title: 'Limpieza profunda de hogar',
            description:
              'Servicio de limpieza integral con productos profesionales.',
            price: 5000,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'MONDAY',
                  startTime: '08:00',
                  endTime: '16:00',
                },
                {
                  dayOfWeek: 'TUESDAY',
                  startTime: '08:00',
                  endTime: '16:00',
                },
                {
                  dayOfWeek: 'WEDNESDAY',
                  startTime: '08:00',
                  endTime: '16:00',
                },
                {
                  dayOfWeek: 'THURSDAY',
                  startTime: '08:00',
                  endTime: '16:00',
                },
                {
                  dayOfWeek: 'FRIDAY',
                  startTime: '08:00',
                  endTime: '16:00',
                },
              ],
            },
          },
          {
            title: 'Limpieza de oficinas',
            description:
              'Servicio de limpieza para oficinas y espacios comerciales.',
            price: 7500,
            availabilities: {
              create: [
                {
                  dayOfWeek: 'SATURDAY',
                  startTime: '09:00',
                  endTime: '15:00',
                },
                {
                  dayOfWeek: 'SUNDAY',
                  startTime: '09:00',
                  endTime: '15:00',
                },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('✅ Seed completed successfully!');
  console.log(`Created 10 providers with services and availabilities.`);
  console.log('\nProvider credentials:');
  console.log('Email: juan.perez@email.com - Password: password1234');
  console.log('Email: maria.gomez@email.com - Password: password1234');
  console.log('Email: carlos.lopez@email.com - Password: password1234');
  console.log('Email: roberto.martinez@email.com - Password: password1234');
  console.log('Email: laura.fernandez@email.com - Password: password1234');
  console.log('Email: diego.sanchez@email.com - Password: password1234');
  console.log('Email: ana.rodriguez@email.com - Password: password1234');
  console.log('Email: pablo.castro@email.com - Password: password1234');
  console.log('Email: sofia.herrera@email.com - Password: password1234');
  console.log('Email: miguel.ruiz@email.com - Password: password1234');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
