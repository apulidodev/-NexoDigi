import { fetchArchiveCatalog } from "@/features/digimon/infrastructure/digi-archive-client";
import type { ArchiveKind } from "@/features/digimon/domain/digimon";
import { NextResponse } from "next/server";

const validKinds: ArchiveKind[] = ["attribute", "type", "level", "field", "skill"];

export async function GET(request: Request, { params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!validKinds.includes(kind as ArchiveKind)) {
    return NextResponse.json({ error: "Catalogo no valido." }, { status: 404 });
  }

  const rawPage = Number(new URL(request.url).searchParams.get("page") ?? 0);
  const page = Number.isInteger(rawPage) ? Math.max(0, rawPage) : 0;
  const catalog = await fetchArchiveCatalog(kind as ArchiveKind, page);

  return NextResponse.json(catalog, { status: catalog.isAvailable ? 200 : 502 });
}