/**
 * Central platform statistics configuration
 * Edit these values whenever platform milestones are updated.
 */
export const siteStats = {
  expertsCount: "2,000+",
  languagesCount: "100+",
  projectsDelivered: "100+",
  qcStagesCount: "5",
  audioFormats: "16kHz / 44.1kHz",
} as const;

export type SiteStats = typeof siteStats;
