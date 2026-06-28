import { NextResponse } from "next/server";
import { deleteJob } from "../../actions";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  await deleteJob(params.id);
  return NextResponse.json({ ok: true });
}
