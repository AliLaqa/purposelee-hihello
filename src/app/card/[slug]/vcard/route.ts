import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateVCard } from "@/lib/cards/vcard";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const supabase = await createClient();

  const { data: card } = await supabase
    .from("cards")
    .select("slug,full_name,company,email,phone")
    .eq("slug", slug)
    .maybeSingle();

  if (!card) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const vcard = generateVCard({
    fullName: card.full_name,
    company: card.company,
    email: card.email,
    phone: card.phone,
  });

  const filename = `${card.slug}.vcf`;
  return new NextResponse(vcard, {
    headers: {
      "content-type": "text/vcard; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
    },
  });
}
