import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { companyName, username, email, password } = await req.json();

    if (!companyName || !username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Username already exists." }, { status: 400 });
    }

    // Check if company name already exists (name is NOT unique → use findFirst)
    const existingCompany = await prisma.company.findFirst({
      where: { name: companyName },
    });

    if (existingCompany) {
      return NextResponse.json({ error: "Company already exists." }, { status: 400 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create company
    const company = await prisma.company.create({
      data: {
        name: companyName,
        companyCode: companyName.toUpperCase().replace(/\s+/g, "_"),
      },
    });

    // Create user
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        role: "admin",
        email,
        companyId: company.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
