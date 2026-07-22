import type { ArchiveCatalog, ArchiveKind } from "@/features/digimon/domain/digimon";

const baseUrl = "https://digi-api.com/api/v1";

type ApiArchive = {
  name?: string;
  description?: string;
  fields?: Array<{ id: number; name: string; href: string }>;
};

const labels: Record<ArchiveKind, string> = {
  attribute: "Atributos",
  type: "Tipos",
  level: "Niveles",
  field: "Campos",
  skill: "Tecnicas",
};

export async function fetchArchiveCatalog(kind: ArchiveKind): Promise<ArchiveCatalog> {
  try {
    const response = await fetch(`${baseUrl}/${kind}`, { next: { revalidate: 3600 } });
    if (!response.ok) throw new Error("Archive request failed");
    const data = (await response.json()) as ApiArchive;
    return { kind, name: labels[kind], description: data.description ?? "", entries: data.fields ?? [] };
  } catch {
    return { kind, name: labels[kind], description: "El archivo no esta disponible en este momento.", entries: [] };
  }
}

export async function fetchArchiveCatalogs(): Promise<ArchiveCatalog[]> {
  const kinds: ArchiveKind[] = ["attribute", "type", "level", "field", "skill"];
  return Promise.all(kinds.map(fetchArchiveCatalog));
}