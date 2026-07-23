import type { ArchiveCatalog, ArchiveEntry, ArchiveKind } from "@/features/digimon/domain/digimon";

const baseUrl = "https://digi-api.com/api/v1";

type ApiArchive = {
  name?: string;
  description?: string;
  fields?: ArchiveEntry[];
};

type ApiArchiveResponse = {
  content?: ApiArchive[] | ApiArchive;
  pageable?: {
    currentPage?: number;
    totalElements?: number;
    nextPage?: string;
  };
};

const labels: Record<ArchiveKind, string> = {
  attribute: "Atributos",
  type: "Tipos",
  level: "Niveles",
  field: "Campos",
  skill: "Tecnicas",
};

export async function fetchArchiveCatalog(kind: ArchiveKind, page = 0): Promise<ArchiveCatalog> {
  try {
    const response = await fetch(`${baseUrl}/${kind}?page=${page}`, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("Archive request failed");

    const data = (await response.json()) as ApiArchiveResponse;
    const catalog = Array.isArray(data.content) ? data.content[0] : data.content;
    const entries = catalog?.fields ?? [];

    return {
      kind,
      name: labels[kind],
      description: catalog?.description ?? "Consulta los registros oficiales de DAPI.",
      entries,
      totalElements: data.pageable?.totalElements ?? entries.length,
      currentPage: data.pageable?.currentPage ?? page,
      hasNextPage: Boolean(data.pageable?.nextPage),
      isAvailable: true,
    };
  } catch {
    return {
      kind,
      name: labels[kind],
      description: "No fue posible conectar con DAPI en este momento.",
      entries: [],
      totalElements: 0,
      currentPage: page,
      hasNextPage: false,
      isAvailable: false,
    };
  }
}

export async function fetchArchiveCatalogs(): Promise<ArchiveCatalog[]> {
  const kinds: ArchiveKind[] = ["attribute", "type", "level", "field", "skill"];
  return Promise.all(kinds.map((kind) => fetchArchiveCatalog(kind)));
}