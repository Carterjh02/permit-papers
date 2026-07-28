import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { email } = await req.json();

  // TODO: Replace with your actual email logic
  // e.g., send reset link via SendGrid, Resend, or Nodemailer
  console.log(`Password reset requested for ${email}`);

  return NextResponse.json({
    message: "If an account exists for that email, a reset link has been sent.",
  });
}
