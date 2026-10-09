import { NextRequest, NextResponse } from "next/server";
import { getJob } from "@/lib/jobStore";
import { Document, Packer, Paragraph, HeadingLevel } from "docx";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const job = getJob(id);
  const format = req.nextUrl.searchParams.get("format") || "txt";

  if (!job || job.status !== "done") {
    return NextResponse.json({ error: "Job not found or not finished" }, { status: 404 });
  }

  const transcript = job.result.transcript || "";

  if (format === "txt") {
    return new NextResponse(transcript, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="transcript-${id}.txt"`,
      },
    });
  }

  if (format === "docx") {
    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({ text: "Transcript", heading: HeadingLevel.TITLE }),
            ...transcript.split("\n").map((line) => new Paragraph(line)),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="transcript-${id}.docx"`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
