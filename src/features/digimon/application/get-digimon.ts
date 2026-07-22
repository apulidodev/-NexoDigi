import { fetchDigimon } from "@/features/digimon/infrastructure/digi-api-client";
export const getDigimon = (id: number) => fetchDigimon(id);