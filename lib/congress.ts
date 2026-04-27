/**
 * Congress.gov API integration.
 * Docs: https://api.congress.gov/
 * Key: free at https://api.data.gov/signup/
 */

const BASE = "https://api.congress.gov/v3";

export type CongressBill = {
  congress: number;
  billType: string; // hr, s, hjres, sjres, hconres, sconres, hres, sres
  billNumber: number;
  title: string;
  latestActionDate: string | null;
  latestActionText: string | null;
  originChamber: string | null;
};

export type CongressBillFull = CongressBill & {
  summary: string | null;
  policyArea: string | null;
  introducedDate: string | null;
  url: string;
  slug: string;
};

function key(): string {
  const k = process.env.CONGRESS_API_KEY;
  if (!k) throw new Error("Missing CONGRESS_API_KEY in env");
  return k;
}

/** List recent bills, sorted by latest update. */
export async function fetchRecentBills(limit = 30): Promise<CongressBill[]> {
  const url = `${BASE}/bill?api_key=${key()}&limit=${limit}&sort=updateDate+desc&format=json`;
  const res = await fetch(url, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Congress API: ${res.status} ${res.statusText}`);
  const json = (await res.json()) as { bills?: unknown[] };
  return (json.bills ?? []).map((raw) => normalizeBill(raw));
}

/** Fetch a single bill with its latest summary. */
export async function fetchBillFull(
  congress: number,
  type: string,
  number: number
): Promise<CongressBillFull | null> {
  const billUrl = `${BASE}/bill/${congress}/${type.toLowerCase()}/${number}?api_key=${key()}&format=json`;
  const billRes = await fetch(billUrl, { next: { revalidate: 1800 } });
  if (!billRes.ok) return null;
  const billJson = (await billRes.json()) as { bill?: Record<string, unknown> };
  const bill = billJson.bill;
  if (!bill) return null;

  // Summaries: pick the most recent one
  const sumUrl = `${BASE}/bill/${congress}/${type.toLowerCase()}/${number}/summaries?api_key=${key()}&format=json`;
  const sumRes = await fetch(sumUrl, { next: { revalidate: 1800 } });
  let summary: string | null = null;
  if (sumRes.ok) {
    const sj = (await sumRes.json()) as { summaries?: { text?: string; updateDate?: string }[] };
    const sums = sj.summaries ?? [];
    if (sums.length > 0) {
      const sorted = [...sums].sort((a, b) =>
        (b.updateDate ?? "").localeCompare(a.updateDate ?? "")
      );
      summary = stripHtml(sorted[0]?.text ?? "");
    }
  }

  const latestAction =
    (bill.latestAction as { actionDate?: string; text?: string } | undefined) ?? {};

  return {
    congress,
    billType: type.toLowerCase(),
    billNumber: number,
    title: typeof bill.title === "string" ? bill.title : "",
    latestActionDate: latestAction.actionDate ?? null,
    latestActionText: latestAction.text ?? null,
    originChamber: typeof bill.originChamber === "string" ? bill.originChamber : null,
    summary,
    policyArea:
      typeof (bill.policyArea as { name?: string } | undefined)?.name === "string"
        ? (bill.policyArea as { name: string }).name
        : null,
    introducedDate: typeof bill.introducedDate === "string" ? bill.introducedDate : null,
    url: `https://www.congress.gov/bill/${congress}th-congress/${typeToUrlSegment(type)}/${number}`,
    slug: billSlug(congress, type, number),
  };
}

export function billSlug(congress: number, type: string, number: number): string {
  return `${congress}-${type.toLowerCase()}-${number}`;
}

export function parseBillSlug(slug: string): {
  congress: number;
  type: string;
  number: number;
} | null {
  const m = slug.match(/^(\d+)-([a-z]+)-(\d+)$/i);
  if (!m) return null;
  return { congress: parseInt(m[1], 10), type: m[2].toLowerCase(), number: parseInt(m[3], 10) };
}

export function formatBillCode(b: { billType: string; billNumber: number }): string {
  const map: Record<string, string> = {
    hr: "H.R.",
    s: "S.",
    hjres: "H.J.Res.",
    sjres: "S.J.Res.",
    hconres: "H.Con.Res.",
    sconres: "S.Con.Res.",
    hres: "H.Res.",
    sres: "S.Res.",
  };
  return `${map[b.billType.toLowerCase()] || b.billType.toUpperCase()} ${b.billNumber}`;
}

function typeToUrlSegment(t: string): string {
  const map: Record<string, string> = {
    hr: "house-bill",
    s: "senate-bill",
    hjres: "house-joint-resolution",
    sjres: "senate-joint-resolution",
    hconres: "house-concurrent-resolution",
    sconres: "senate-concurrent-resolution",
    hres: "house-resolution",
    sres: "senate-resolution",
  };
  return map[t.toLowerCase()] || t;
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeBill(raw: unknown): CongressBill {
  const r = raw as Record<string, unknown>;
  const action = (r.latestAction as { actionDate?: string; text?: string } | undefined) ?? {};
  return {
    congress: typeof r.congress === "number" ? r.congress : Number(r.congress),
    billType: typeof r.type === "string" ? r.type.toLowerCase() : "",
    billNumber: typeof r.number === "number" ? r.number : Number(r.number),
    title: typeof r.title === "string" ? r.title : "",
    latestActionDate: action.actionDate ?? null,
    latestActionText: action.text ?? null,
    originChamber: typeof r.originChamber === "string" ? r.originChamber : null,
  };
}
