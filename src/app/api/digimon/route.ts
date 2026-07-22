import { searchDigimon } from "@/features/digimon/infrastructure/digi-api-client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const page = Math.max(0, Number(query.get("page") ?? 0));
  const pageSize = Math.min(24, Math.max(1, Number(query.get("pageSize") ?? 12)));
  const xAntibody = query.get("xAntibody");

  const results = await searchDigimon({
    name: query.get("name")?.trim() || undefined,
    level: query.get("level") || undefined,
    attribute: query.get("attribute") || undefined,
    xAntibody: xAntibody === null || xAntibody === "" ? undefined : xAntibody === "true",
    page,
    pageSize,
  });

  return NextResponse.json(results);
}