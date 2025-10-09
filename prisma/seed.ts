import { PrismaClient } from "../app/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  // Create API key for desplega.ai
  const apiKey = await prisma.apiKey.upsert({
    where: { token: "desplega-dev-token-12345" },
    update: {},
    create: {
      token: "desplega-dev-token-12345",
      companyName: "desplega.ai",
    },
  });

  console.log("✅ Created API key:", apiKey.token);

  // Create founder
  const founder = await prisma.founder.upsert({
    where: { email: "t@desplega.ai" },
    update: {},
    create: {
      name: "Taras",
      email: "t@desplega.ai",
      apiKeyId: apiKey.id,
    },
  });

  console.log("✅ Created founder:", founder.email);

  console.log("\n🎉 Seed completed!");
  console.log("\n📝 Your API token is: desplega-dev-token-12345");
  console.log("   Use this token to access the dashboard\n");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
