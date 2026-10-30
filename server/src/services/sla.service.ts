import prisma from '../prisma';

export interface SlaAssessment {
  incidentId: string;
  reference: string;
  title: string;
  priority: string;
  status: string;
  createdAt: Date;
  responseDueAt: Date;
  resolutionDueAt: Date;
  isResponseBreached: boolean;
  isResolutionBreached: boolean;
  isAtRisk: boolean; // Less than 25% of resolution time remaining
  minutesRemaining: number;
}

export interface SlaDashboardMetrics {
  totalAssessed: number;
  breachedCount: number;
  atRiskCount: number;
  compliantCount: number;
  complianceRatePercent: number;
  incidents: SlaAssessment[];
}

/**
 * Evaluates SLA compliance for all active and recently resolved incidents.
 */
export async function getSlaMetrics(): Promise<SlaDashboardMetrics> {
  const policies = await prisma.slaPolicy.findMany();
  const policyMap = new Map<string, { responseMinutes: number; resolutionMinutes: number }>();
  for (const p of policies) {
    policyMap.set(p.priority.toUpperCase(), {
      responseMinutes: p.responseMinutes,
      resolutionMinutes: p.resolutionMinutes,
    });
  }

  // Fallbacks if priority policy missing
  const defaultPolicy = { responseMinutes: 120, resolutionMinutes: 1440 };

  const incidents = await prisma.incident.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      workOrders: {
        select: { id: true, status: true, events: true },
      },
    },
  });

  const now = Date.now();
  const assessments: SlaAssessment[] = [];

  let breachedCount = 0;
  let atRiskCount = 0;
  let compliantCount = 0;

  for (const inc of incidents) {
    const policy = policyMap.get(inc.priority.toUpperCase()) || defaultPolicy;
    const createdAtMs = new Date(inc.createdAt).getTime();

    const responseDueAt = new Date(createdAtMs + policy.responseMinutes * 60 * 1000);
    const resolutionDueAt = new Date(createdAtMs + policy.resolutionMinutes * 60 * 1000);

    const isResolved = ['RESOLVED', 'CLOSED'].includes(inc.status.toUpperCase());
    const isAcknowledged = ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(inc.status.toUpperCase());

    const isResponseBreached = !isAcknowledged && now > responseDueAt.getTime();
    const isResolutionBreached = !isResolved && now > resolutionDueAt.getTime();

    const msRemaining = resolutionDueAt.getTime() - now;
    const minutesRemaining = Math.round(msRemaining / (60 * 1000));

    // At risk if still open and less than 25% of total allowed resolution time remains
    const totalAllowedMs = policy.resolutionMinutes * 60 * 1000;
    const isAtRisk = !isResolved && !isResolutionBreached && msRemaining < totalAllowedMs * 0.25;

    if (isResolutionBreached || isResponseBreached) {
      breachedCount++;
    } else if (isAtRisk) {
      atRiskCount++;
    } else {
      compliantCount++;
    }

    assessments.push({
      incidentId: inc.id,
      reference: inc.reference,
      title: inc.title,
      priority: inc.priority,
      status: inc.status,
      createdAt: inc.createdAt,
      responseDueAt,
      resolutionDueAt,
      isResponseBreached,
      isResolutionBreached,
      isAtRisk,
      minutesRemaining,
    });
  }

  const totalAssessed = incidents.length;
  const complianceRatePercent =
    totalAssessed > 0 ? Math.round(((totalAssessed - breachedCount) / totalAssessed) * 100) : 100;

  return {
    totalAssessed,
    breachedCount,
    atRiskCount,
    compliantCount,
    complianceRatePercent,
    incidents: assessments,
  };
}
