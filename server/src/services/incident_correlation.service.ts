import prisma from '../prisma';

export interface CorrelationResult {
  isDuplicate: boolean;
  matchedIncidentId: string | null;
  confidence: number;
  matchReason: string | null;
}

export async function detectIncidentCorrelation(
  category: string,
  buildingId?: string | null,
  roomId?: string | null,
  assetId?: string | null
): Promise<CorrelationResult> {
  // Query only non-resolved, non-closed incidents
  const activeIncidents = await prisma.incident.findMany({
    where: {
      status: { notIn: ['RESOLVED', 'CLOSED'] },
      OR: [
        ...(assetId ? [{ assetId }] : []),
        ...(roomId ? [{ roomId, category }] : []),
        ...(buildingId && !roomId ? [{ buildingId, category }] : []),
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (activeIncidents.length === 0) {
    return {
      isDuplicate: false,
      matchedIncidentId: null,
      confidence: 0,
      matchReason: null,
    };
  }

  // 1. Direct asset match (highest confidence: 0.99)
  if (assetId) {
    const assetMatch = activeIncidents.find((inc) => inc.assetId === assetId);
    if (assetMatch) {
      return {
        isDuplicate: true,
        matchedIncidentId: assetMatch.id,
        confidence: 0.99,
        matchReason: `Matching active incident found on identical physical asset (${assetMatch.reference}).`,
      };
    }
  }

  // 2. Direct room & category match (high confidence: 0.95)
  if (roomId) {
    const roomMatch = activeIncidents.find((inc) => inc.roomId === roomId && inc.category === category);
    if (roomMatch) {
      return {
        isDuplicate: true,
        matchedIncidentId: roomMatch.id,
        confidence: 0.95,
        matchReason: `Active incident already reported in this room for ${category} issues (${roomMatch.reference}).`,
      };
    }
  }

  // 3. Building-wide category match (e.g. general building Wi-Fi down, confidence: 0.80)
  if (buildingId) {
    const buildingMatch = activeIncidents.find((inc) => inc.buildingId === buildingId && inc.category === category);
    if (buildingMatch) {
      return {
        isDuplicate: true,
        matchedIncidentId: buildingMatch.id,
        confidence: 0.80,
        matchReason: `Active building-wide ${category} issue in progress (${buildingMatch.reference}).`,
      };
    }
  }

  return {
    isDuplicate: false,
    matchedIncidentId: null,
    confidence: 0,
    matchReason: null,
  };
}
