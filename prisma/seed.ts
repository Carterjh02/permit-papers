import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Example seed data — adjust to your actual schema

  // Create master company
  const company = await prisma.company.upsert({
    where: { companyCode: "GUARDIAN" },
    update: {},
    create: {
      name: "Guardian Roofing",
      companyCode: "GUARDIAN",
    },
  });

  // Create master admin user
  await prisma.user.upsert({
    where: { username: "master" },
    update: {},
    create: {
      username: "master",
      passwordHash: "$2a$10$changemechangemechangemechangemech", // replace with real hash
      role: "master",
      companyId: company.id,
    },
  });

  // You can add more seed logic here...
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
