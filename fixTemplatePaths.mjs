// fixTemplatePaths.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function normalizePath(path) {
  if (!path) return path;

  let p = path;

  // Convert backslashes to forward slashes
  p = p.replace(/\\/g, "/");

  // Remove duplicate slashes
  p = p.replace(/\/+/g, "/");

  // Ensure it starts with templates/
  if (!p.startsWith("templates/")) {
    p = p.replace(/^\/+/, ""); // remove leading slash
    p = "templates/" + p;
  }

  return p;
}

async function main() {
  console.log("🔧 Fixing templatePath values in JobDocument...");

  const docs = await prisma.jobDocument.findMany();

  for (const doc of docs) {
    const oldPath = doc.templatePath;
    const newPath = normalizePath(oldPath);

    if (oldPath !== newPath) {
      console.log(`Updating ${doc.id}:`);
      console.log(`  OLD: ${oldPath}`);
      console.log(`  NEW: ${newPath}`);

      await prisma.jobDocument.update({
        where: { id: doc.id },
        data: { templatePath: newPath },
      });
    }
  }

  console.log("✅ Done. All templatePath values normalized.");
}

main()
  .catch((e) => {
    console.error("❌ ERROR:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
