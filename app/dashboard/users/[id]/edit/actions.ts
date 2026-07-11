"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import bcrypt from "bcryptjs";

export async function updateUserAction(formData: FormData) {
  const id = formData.get("user_id") as string;

  const current = await getServerSession();
  if (!current || current.user.role !== "admin") redirect("/login");

  const username = (formData.get("username") as string)?.trim();
  const email = (formData.get("email") as string)?.trim() || null;
  const password = (formData.get("password") as string) || "";

  if (!username) throw new Error("Username is required.");

  const updateData: {
    username: string;
    email: string | null;
    passwordHash?: string;
  } = {
    username,
    email,
  };

  if (password.trim().length > 0) {
    updateData.passwordHash = await bcrypt.hash(password, 10);
  }

  await prisma.user.update({
    where: { id },
    data: updateData,
  });

  redirect("/dashboard/users");
}

export async function deleteUserAction(formData: FormData) {
  const id = formData.get("user_id") as string;

  const current = await getServerSession();
  if (!current || current.user.role !== "admin") redirect("/login");

  await prisma.user.delete({
    where: { id },
  });

  redirect("/dashboard/users");
}
