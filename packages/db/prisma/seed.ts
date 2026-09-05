import { hashSync } from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function seedDemoCatalog() {
  // Owner account for demo establishments (Business membership required for Professional.memberId).
  const ownerPassword = hashSync("demo-owner-pass", 12);
  const owner = await db.user.upsert({
    where: { email: "owner.demo@marka.ia" },
    update: {},
    create: {
      email: "owner.demo@marka.ia",
      name: "Owner Demo",
      phone: "(11) 90000-0000",
      passwordHash: ownerPassword,
      emailVerifiedAt: new Date(),
    },
  });

  const demos = [
    {
      slug: "studio-vela",
      name: "Studio Vela",
      category: "nails" as const,
      city: "São Paulo",
      state: "SP",
      address: "Av. Paulista, 1200",
      description: "Estúdio de nails com foco em alongamento, gel e nail art.",
      hoursText: "Ter–Dom · 10h–20h",
      slotStartHour: 10,
      slotEndHour: 20,
      acceptsOnlinePayment: true,
      photoUrls: [] as string[],
      services: [
        { name: "Alongamento em Gel", description: "Alongamento com gel.", durationMinutes: 90, price: 160 },
        { name: "Banho de Gel", description: "Manutenção de esmaltação em gel.", durationMinutes: 45, price: 80 },
        { name: "Nail Art", description: "Nail art personalizado.", durationMinutes: 60, price: 120 },
      ],
      professional: { name: "Mariana Demo", email: "mariana.demo@marka.ia", specialties: ["Alongamento em Gel", "Nail Art"] },
    },
    {
      slug: "barbearia-corte",
      name: "Barbearia Corte",
      category: "barbearia" as const,
      city: "São Paulo",
      state: "SP",
      address: "Rua Augusta, 450",
      description: "Barbearia para cortes masculinos, degradê e barba.",
      hoursText: "Seg–Sáb · 9h–19h",
      slotStartHour: 9,
      slotEndHour: 19,
      acceptsOnlinePayment: false,
      photoUrls: [] as string[],
      services: [
        { name: "Corte", description: "Corte clássico e fade.", durationMinutes: 40, price: 50 },
        { name: "Corte + Barba", description: "Corte e barba.", durationMinutes: 70, price: 85 },
        { name: "Barba", description: "Barba e contorno.", durationMinutes: 30, price: 40 },
      ],
      professional: { name: "Lucas Demo", email: "lucas.demo@marka.ia", specialties: ["Corte", "Barba"] },
    },
    {
      slug: "lash-studio",
      name: "Lash Studio",
      category: "lash_designer" as const,
      city: "São Paulo",
      state: "SP",
      address: "Rua das Flores, 210",
      description: "Especialistas em extensão de cílios.",
      hoursText: "Ter–Sáb · 11h–19h",
      slotStartHour: 11,
      slotEndHour: 19,
      acceptsOnlinePayment: true,
      photoUrls: [] as string[],
      services: [
        { name: "Extensão de Cílios", description: "Extensão natural com volume.", durationMinutes: 90, price: 220 },
        { name: "Volume Russo", description: "Volume Russo.", durationMinutes: 120, price: 250 },
        { name: "Fio a Fio", description: "Cílios fio a fio.", durationMinutes: 75, price: 180 },
      ],
      professional: { name: "Camila Demo", email: "camila.demo@marka.ia", specialties: ["Volume Russo", "Fio a Fio"] },
    },
  ];

  for (const demo of demos) {
    const est = await db.establishment.upsert({
      where: { slug: demo.slug },
      update: {
        name: demo.name,
        category: demo.category,
        status: "active",
        city: demo.city,
        state: demo.state,
        address: demo.address,
        description: demo.description,
        hoursText: demo.hoursText,
        slotStartHour: demo.slotStartHour,
        slotEndHour: demo.slotEndHour,
        acceptsLocalPayment: true,
        acceptsOnlinePayment: demo.acceptsOnlinePayment,
        photoUrls: demo.photoUrls,
      },
      create: {
        slug: demo.slug,
        name: demo.name,
        category: demo.category,
        status: "active",
        city: demo.city,
        state: demo.state,
        address: demo.address,
        description: demo.description,
        hoursText: demo.hoursText,
        slotStartHour: demo.slotStartHour,
        slotEndHour: demo.slotEndHour,
        acceptsLocalPayment: true,
        acceptsOnlinePayment: demo.acceptsOnlinePayment,
        photoUrls: demo.photoUrls,
      },
    });

    await db.establishmentMember.upsert({
      where: { establishmentId_userId: { establishmentId: est.id, userId: owner.id } },
      update: { role: "OWNER", status: "ACTIVE", joinedAt: new Date() },
      create: {
        establishmentId: est.id,
        userId: owner.id,
        role: "OWNER",
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });

    const serviceIds: string[] = [];
    for (const svc of demo.services) {
      const existing = await db.service.findFirst({
        where: { establishmentId: est.id, name: svc.name },
      });
      const saved = existing
        ? await db.service.update({
            where: { id: existing.id },
            data: {
              description: svc.description,
              durationMinutes: svc.durationMinutes,
              price: svc.price,
              active: true,
              category: demo.category === "lash_designer" ? "lash-designer" : demo.category,
            },
          })
        : await db.service.create({
            data: {
              establishmentId: est.id,
              name: svc.name,
              description: svc.description,
              durationMinutes: svc.durationMinutes,
              price: svc.price,
              active: true,
              category: demo.category === "lash_designer" ? "lash-designer" : demo.category,
            },
          });
      serviceIds.push(saved.id);
    }

    const proUser = await db.user.upsert({
      where: { email: demo.professional.email },
      update: {},
      create: {
        email: demo.professional.email,
        name: demo.professional.name,
        passwordHash: hashSync("demo-pro-pass", 12),
        emailVerifiedAt: new Date(),
      },
    });

    const member = await db.establishmentMember.upsert({
      where: { establishmentId_userId: { establishmentId: est.id, userId: proUser.id } },
      update: { role: "PROFESSIONAL", status: "ACTIVE", joinedAt: new Date() },
      create: {
        establishmentId: est.id,
        userId: proUser.id,
        role: "PROFESSIONAL",
        status: "ACTIVE",
        joinedAt: new Date(),
      },
    });

    const professional = await db.professional.upsert({
      where: { memberId: member.id },
      update: {
        specialties: demo.professional.specialties,
        active: true,
      },
      create: {
        establishmentId: est.id,
        memberId: member.id,
        specialties: demo.professional.specialties,
        active: true,
      },
    });

    for (const serviceId of serviceIds) {
      await db.professionalService.upsert({
        where: {
          professionalId_serviceId: {
            professionalId: professional.id,
            serviceId,
          },
        },
        update: {},
        create: { professionalId: professional.id, serviceId },
      });
    }

    console.log(`Seeded consumer demo establishment: ${est.slug}`);
  }
}

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL ?? "admin@marka.ia";
  const password = process.env.ADMIN_SEED_PASSWORD ?? "change-me-now";

  const admin = await db.administrator.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Super Admin",
      role: "super_admin",
      passwordHash: hashSync(password, 12),
    },
  });
  console.log(`Seeded backoffice super_admin: ${admin.email}`);

  const plan = await db.plan.upsert({
    where: { code: "starter" },
    update: {},
    create: {
      code: "starter",
      name: "Starter",
      priceMonthly: 0,
      features: { professionals: 3, ai: false },
    },
  });
  console.log(`Seeded plan: ${plan.code}`);

  await seedDemoCatalog();
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
