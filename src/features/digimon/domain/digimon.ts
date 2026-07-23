export type Digimon = {
  id: number;
  name: string;
  xAntibody: boolean;
  image?: string;
  level: string;
  type: string;
  attribute: string;
  skills: string[];
  nextEvolutions: Array<{ id: number; name: string; condition: string }>;
};

export type DigimonSummary = {
  id: number;
  name: string;
  image?: string;
};

export type DigimonSearchFilters = {
  name?: string;
  level?: string;
  attribute?: string;
  xAntibody?: boolean;
  page?: number;
  pageSize?: number;
};

export type DigimonSearchResult = {
  content: DigimonSummary[];
  currentPage: number;
  totalElements: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};
export type ArchiveKind = "attribute" | "type" | "level" | "field" | "skill";

export type ArchiveEntry = {
  id: number;
  name: string;
  href: string;
};

export type ArchiveCatalog = {
  kind: ArchiveKind;
  name: string;
  description: string;
  entries: ArchiveEntry[];
  totalElements: number;
  currentPage: number;
  hasNextPage: boolean;
  isAvailable: boolean;
};