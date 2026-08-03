// app/api/storage/list/route.ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

export async function POST(req: Request) {
  try {
    const { bucket, path } = await req.json();

    if (!bucket) {
      return NextResponse.json(
        { error: "Missing bucket parameter" },
        { status: 400 }
      );
    }

    const clean = (path ?? "").replace(/\/$/, "").replace(/\/+/g, "/");
    const prefix = clean === "" ? "" : clean + "/";

    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .list(prefix, {
        limit: 1000,
        offset: 0,
      });

    if (error) {
      console.error("SERVER STORAGE LIST ERROR:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bucket,
      path: clean,
      prefix,
      items: data ?? [],
    });
    } catch (err) {
      console.error("SERVER STORAGE LIST ROUTE ERROR:", err);
      return NextResponse.json(
          { error: "Unexpected server error" },
          { status: 500 }
    );
  }
}
