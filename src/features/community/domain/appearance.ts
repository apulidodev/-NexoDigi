export type SeriesId = "adventure-1999" | "adventure-02" | "tamers" | "frontier" | "savers" | "xros-wars" | "ghost-game";

export type CommunityAppearance = {
  digimonId: number;
  seriesId: SeriesId;
  character?: string;
  role?: "partner" | "ally" | "antagonist" | "appearance";
  sourceUrl: string;
  verified: boolean;
};

export type AppearanceSuggestion = Omit<CommunityAppearance, "verified"> & {
  submittedAt: string;
  contributorAlias: string;
};