import { getDigimon } from "@/features/digimon/application/get-digimon";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const digimon = await getDigimon(Number(id));
  return NextResponse.json(digimon);
}