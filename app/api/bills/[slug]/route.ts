import { NextResponse } from "next/server";
import { fetchBillFull, parseBillSlug, formatBillCode } from "@/lib/congress";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const parsed = parseBillSlug(slug);
  if (!parsed) {
    return NextResponse.json({ error: "Invalid bill slug" }, { status: 400 });
  }
  try {
    const bill = await fetchBillFull(parsed.congress, parsed.type, parsed.number);
    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }
    return NextResponse.json({
      bill: {
        slug: bill.slug,
        code: formatBillCode(bill),
        title: bill.title,
        summary:
          bill.summary ??
          // Fallback: synthesize a "summary" from latest action when CRS hasn't summarized yet.
          (bill.latestActionText
            ? `(No CRS summary available yet.) Latest action${bill.latestActionDate ? ` on ${bill.latestActionDate}` : ""}: ${bill.latestActionText}`
            : "(No CRS summary available yet.)"),
        url: bill.url,
        policyArea: bill.policyArea,
        introducedDate: bill.introducedDate,
        latestActionDate: bill.latestActionDate,
        latestActionText: bill.latestActionText,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unknown error" },
      { status: 500 }
    );
  }
}
