import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * Secure server-side upload route.
 * Allows master users to upload files to templates or companies buckets.
 * Uses service role key to bypass RLS.
 */
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;
    const path = formData.get("path") as string;

    if (!file || !bucket || !path) {
      return NextResponse.json(
        { error: "Missing file, bucket, or path" },
        { status: 400 }
      );
    }

    // Upload using service role key
    const { error: uploadError } = await supabaseServer.storage
      .from(bucket)
      .upload(path, file, {
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      console.error("SERVER UPLOAD ERROR:", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // ⭐ Generate signed URL (1 hour)
    const { data: signedUrlData, error: signedUrlError } =
      await supabaseServer.storage
        .from(bucket)
        .createSignedUrl(path, 60 * 60);

    if (signedUrlError) {
      console.error("SIGNED URL ERROR:", signedUrlError);
      return NextResponse.json(
        {
          success: true,
          bucket,
          path,
          signedUrl: null,
          warning: "File uploaded but signed URL could not be generated.",
        },
        { status: 200 }
      );
    }

    const signedUrl = signedUrlData?.signedUrl ?? null;

    console.log("✅ Upload successful:", { bucket, path });

    return NextResponse.json(
      {
        success: true,
        bucket,
        path,
        signedUrl, // ⭐ Returned to caller
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("SERVER UPLOAD ROUTE ERROR:", err);
    return NextResponse.json(
      { error: "Unexpected server error" },
      { status: 500 }
    );
  }
}