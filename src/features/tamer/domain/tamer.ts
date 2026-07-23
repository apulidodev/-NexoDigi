import type { DigimonSearchFilters } from "@/features/digimon/domain/digimon";

export type TeamMember = { id: number; name: string; image?: string };
export type ScanRecord = TeamMember & { scannedAt: string };
export type SavedFilter = { id: string; label: string; filters: DigimonSearchFilters };

export type TamerData = {
  team: TeamMember[];
  history: ScanRecord[];
  savedFilters: SavedFilter[];
  evoNotes: Record<number, string>;
  quizCorrectDates: string[];
};