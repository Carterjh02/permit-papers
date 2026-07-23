import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { supabaseServer } from "@/lib/supabaseServer";
import { autoMapFields } from "@/lib/mapping/autoMapping";
import { fillPdf } from "@/lib/pdf/fillPdf";
import { bufferToBase64 } from "@/lib/pdf/pdfUtils";

export async function POST(req: Request) {
  try {
    const { jobId, templateId } = await req.json();

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { company: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const template = await prisma.formTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    const storagePath = template.storagePath ?? "";
    if (!storagePath) {
      return NextResponse.json(
        { error: "Template storage path missing" },
        { status: 500 }
      );
    }

    const { data, error } = await supabaseServer.storage
      .from("forms")
      .download(storagePath);

    if (error || !data) {
      return NextResponse.json(
        { error: "Failed to load template PDF" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    const autoMapped = autoMapFields(template.fieldNames as string[]);

    const companyData = {
      company_name: job.company.name ?? "",
      company_license: job.company.licenseNumber ?? "",
      qualifier_name: job.company.qualifierName ?? "",
      company_phone: job.company.phone ?? "",
      company_email: job.company.email ?? "",
      company_address_street: job.company.addressStreet ?? "",
      company_address_city: job.company.addressCity ?? "",
      company_address_state: job.company.addressState ?? "",
      company_address_zip: job.company.addressZip ?? "",
      company_address_full: [
        job.company.addressStreet,
        job.company.addressCity,
        job.company.addressState,
        job.company.addressZip,
      ]
        .filter(Boolean)
        .join(", "),
      company_contact_full: [
        job.company.name,
        [
          job.company.addressStreet,
          job.company.addressCity,
          job.company.addressState,
          job.company.addressZip,
        ]
          .filter(Boolean)
          .join(", "),
        job.company.phone,
      ]
        .filter(Boolean)
        .join(", "),
      desc_of_improvement: job.company.descOfImprov ?? "",
      desc_of_improv: job.company.descOfImprov ?? "",
    };

    const jobData = {
      customer_name: job.customerName ?? "",
      customer_phone: job.customerPhone ?? "",
      customer_email: job.customerEmail ?? "",
      customer_address_street: job.customerAddress ?? "",
      customer_address_city: job.customerCity ?? "",
      customer_address_state: job.customerState ?? "",
      customer_address_zip: job.customerZip ?? "",
      customer_address_full: [
        job.customerAddress,
        job.customerCity,
        job.customerState,
        job.customerZip,
      ]
        .filter(Boolean)
        .join(", "),
      customer_name_address: [
        job.customerName,
        [
          job.customerAddress,
          job.customerCity,
          job.customerState,
          job.customerZip,
        ]
          .filter(Boolean)
          .join(", "),
      ]
        .filter(Boolean)
        .join(", "),
      customer_tax_folio: job.taxFolioNumber ?? "",
      legal_description: job.legalDescription ?? "",
      lot: job.lotNumber ?? "",
      block: job.blockNumber ?? "",
      subdivision: job.subdivision ?? "",
      bldg: job.buildingNumber ?? "",
      unit: job.unitNumber ?? "",
      job_price: job.jobValue ?? "",
      job_number: job.jobNumber ?? "",
    };

    const filledPdf = await fillPdf({
      templateBuffer: buffer,
      autoMapped,
      company: companyData,
      job: jobData,
    });

    // Bump updatedAt so preview refreshes
    await prisma.job.update({
      where: { id: jobId },
      data: { updatedAt: new Date() },
    });

    const base64 = bufferToBase64(filledPdf);

    return NextResponse.json({
      previewBase64: base64,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Server error filling PDF" },
      { status: 500 }
    );
  }
}
