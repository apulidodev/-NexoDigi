import type { Digimon, DigimonSearchFilters, DigimonSearchResult } from "@/features/digimon/domain/digimon";

const BASE_URL = "https://digi-api.com/api/v1/digimon";

const fallback: Digimon = {
  id: 1,
  name: "Agumon",
  xAntibody: false,
  image: "https://digi-api.com/images/digimon/w/Agumon.png",
  level: "Child",
  type: "Reptile",
  attribute: "Vaccine",
  skills: ["Baby Flame", "Spitfire"],
  nextEvolutions: [{ id: 34, name: "Greymon", condition: "" }],
};

const fallbackSearch: DigimonSearchResult = {
  content: [{ id: fallback.id, name: fallback.name, image: fallback.image }],
  currentPage: 0,
  totalElements: 1,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

type ApiDigimon = {
  id: number;
  name: string;
  xAntibody: boolean;
  images?: Array<{ href: string }>;
  levels?: Array<{ level: string }>;
  types?: Array<{ type: string }>;
  attributes?: Array<{ attribute: string }>;
  skills?: Array<{ skill: string }>;
  nextEvolutions?: Array<{ id: number; digimon: string; condition: string }>;
};

type ApiDigimonPage = {
  content?: Array<{ id: number; name: string; image?: string }>;
  pageable?: {
    currentPage?: number;
    totalElements?: number;
    totalPages?: number;
    previousPage?: string;
    nextPage?: string;
  };
};

function mapDigimon(data: ApiDigimon): Digimon {
  return {
    id: data.id,
    name: data.name,
    xAntibody: data.xAntibody,
    image: data.images?.[0]?.href,
    level: data.levels?.[0]?.level ?? "Unknown",
    type: data.types?.[0]?.type ?? "Unknown",
    attribute: data.attributes?.[0]?.attribute ?? "Unknown",
    skills: data.skills?.slice(0, 2).map((skill) => skill.skill) ?? [],
    nextEvolutions: data.nextEvolutions?.slice(0, 3).map((evolution) => ({ id: evolution.id, name: evolution.digimon, condition: evolution.condition })) ?? [],
  };
}

export async function fetchDigimon(id: number): Promise<Digimon> {
  try {
    const response = await fetch(`${BASE_URL}/${id}`, { next: { revalidate: 3600 } });
    if (!response.ok) return fallback;
    return mapDigimon((await response.json()) as ApiDigimon);
  } catch {
    return fallback;
  }
}

export async function searchDigimon(filters: DigimonSearchFilters): Promise<DigimonSearchResult> {
  const query = new URLSearchParams({ page: String(filters.page ?? 0), pageSize: String(filters.pageSize ?? 12) });
  if (filters.name) query.set("name", filters.name);
  if (filters.level) query.set("level", filters.level);
  if (filters.attribute) query.set("attribute", filters.attribute);
  if (filters.xAntibody !== undefined) query.set("xAntibody", String(filters.xAntibody));

  try {
    const response = await fetch(`${BASE_URL}?${query.toString()}`, { next: { revalidate: 300 } });
    if (!response.ok) return fallbackSearch;
    const data = (await response.json()) as ApiDigimonPage;
    const page = data.pageable;
    return {
      content: data.content ?? [],
      currentPage: page?.currentPage ?? 0,
      totalElements: page?.totalElements ?? 0,
      totalPages: page?.totalPages ?? 0,
      hasPreviousPage: Boolean(page?.previousPage),
      hasNextPage: Boolean(page?.nextPage),
    };
  } catch {
    return fallbackSearch;
  }
}