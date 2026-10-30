import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../prisma';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

// Valid incident state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  NEW: ['TRIAGED', 'ASSIGNED'],
  TRIAGED: ['ASSIGNED', 'IN_PROGRESS'],
  ASSIGNED: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED'],
  RESOLVED: ['CLOSED'],
  CLOSED: [],
};

// GET /api/incidents
router.get('/', async (req: Request, res: Response) => {
  const { status, category, priority, buildingId, roomId } = req.query;

  try {
    const where: any = {};
    if (status && typeof status === 'string') where.status = status;
    if (category && typeof category === 'string') where.category = category;
    if (priority && typeof priority === 'string') where.priority = priority;
    if (buildingId && typeof buildingId === 'string') where.buildingId = buildingId;
    if (roomId && typeof roomId === 'string') where.roomId = roomId;

    const incidents = await prisma.incident.findMany({
      where,
      include: {
        building: { select: { id: true, code: true, name: true } },
        room: { select: { id: true, code: true, roomType: true } },
        asset: { select: { id: true, assetTag: true, type: true } },
        _count: {
          select: { incidentReports: true, workOrders: true, impacts: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: incidents,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch incidents.', details: error.message },
    });
  }
});

// GET /api/incidents/:id (Full Incident Dossier)
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        building: true,
        room: true,
        asset: true,
        incidentReports: {
          include: {
            intakeMessage: {
              include: {
                reporter: { select: { id: true, name: true, email: true, loginId: true } },
              },
            },
          },
        },
        workOrders: {
          include: {
            assignee: { select: { id: true, name: true, loginId: true } },
            requiredSkill: true,
            events: {
              orderBy: { createdAt: 'asc' },
              include: { actor: { select: { id: true, name: true } } },
            },
            stockReservations: {
              include: { item: true },
            },
            purchaseRequests: {
              include: { approvalDecisions: true, stockReceipts: true },
            },
          },
        },
        impacts: true,
        sourceLinks: {
          include: {
            targetIncident: { select: { id: true, reference: true, title: true, status: true } },
          },
        },
        targetLinks: {
          include: {
            sourceIncident: { select: { id: true, reference: true, title: true, status: true } },
          },
        },
      },
    });

    if (!incident) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Incident with ID '${id}' not found.` },
      });
      return;
    }

    // Lookup matching SLA policy
    const slaPolicy = await prisma.slaPolicy.findUnique({
      where: { priority: incident.priority },
    });

    let slaStatus: any = null;
    if (slaPolicy) {
      const createdTime = new Date(incident.createdAt).getTime();
      const responseDeadline = new Date(createdTime + slaPolicy.responseMinutes * 60 * 1000);
      const resolutionDeadline = new Date(createdTime + slaPolicy.resolutionMinutes * 60 * 1000);
      const now = Date.now();

      slaStatus = {
        priority: slaPolicy.priority,
        responseDeadline,
        resolutionDeadline,
        isResponseBreached: now > responseDeadline.getTime() && incident.status === 'NEW',
        isResolutionBreached: now > resolutionDeadline.getTime() && !['RESOLVED', 'CLOSED'].includes(incident.status),
      };
    }

    res.json({
      success: true,
      data: {
        ...incident,
        sla: slaStatus,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch incident dossier.', details: error.message },
    });
  }
});

// PATCH /api/incidents/:id/status (Enforced State Transitions)
router.patch('/:id/status', requireRole(['FACILITIES_ADMIN', 'SYSTEM_ADMIN', 'TECHNICIAN']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status: targetStatus } = req.body;
  const user = req.user!;

  if (!targetStatus || typeof targetStatus !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'Target status string is required.' },
    });
    return;
  }

  try {
    const incident = await prisma.incident.findUnique({
      where: { id },
    });

    if (!incident) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Incident with ID '${id}' not found.` },
      });
      return;
    }

    // Verify valid state transition
    const allowedTargets = VALID_TRANSITIONS[incident.status] || [];
    if (!allowedTargets.includes(targetStatus)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TRANSITION',
          message: `Cannot transition incident from '${incident.status}' to '${targetStatus}'. Allowed transitions from '${incident.status}': [${allowedTargets.join(', ')}]`,
        },
      });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const inc = await tx.incident.update({
        where: { id },
        data: { status: targetStatus },
      });

      // Audit Log
      const auditCount = await tx.auditLog.count();
      await tx.auditLog.create({
        data: {
          id: `AUD${String(auditCount + 1).padStart(3, '0')}`,
          actorId: user.id,
          action: 'UPDATE_STATUS',
          entityType: 'INCIDENT',
          entityId: incident.id,
          beforeJson: JSON.stringify({ status: incident.status }),
          afterJson: JSON.stringify({ status: targetStatus }),
          createdAt: new Date(),
        },
      });

      // Emit Outbox Event if RESOLVED
      if (targetStatus === 'RESOLVED') {
        const obxCount = await tx.outboxEvent.count();
        await tx.outboxEvent.create({
          data: {
            id: `OBX${String(obxCount + 1).padStart(3, '0')}`,
            eventKey: `${inc.id}-RESOLVED`,
            eventType: 'INCIDENT_RESOLVED',
            payload: JSON.stringify({ incidentId: inc.id, reference: inc.reference }),
            status: 'PENDING',
            attempts: 0,
            createdAt: new Date(),
          },
        });
      }

      return inc;
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to update incident status.', details: error.message },
    });
  }
});

// POST /api/incidents/:id/link (Manual Correlation / Linking)
router.post('/:id/link', requireRole(['FACILITIES_ADMIN', 'SYSTEM_ADMIN']), async (req: Request, res: Response) => {
  const { id: sourceIncidentId } = req.params;
  const { targetIncidentId, relation, confidence } = req.body;

  if (!targetIncidentId || !relation) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'targetIncidentId and relation are required.' },
    });
    return;
  }

  try {
    const linkCount = await prisma.incidentLink.count();
    const linkId = `LNK${String(linkCount + 1).padStart(3, '0')}`;

    const link = await prisma.incidentLink.create({
      data: {
        id: linkId,
        sourceIncidentId,
        targetIncidentId,
        relation,
        confidence: Number(confidence || 1.0),
        reviewStatus: 'REVIEWED',
      },
    });

    res.status(201).json({
      success: true,
      data: link,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to link incidents.', details: error.message },
    });
  }
});

export default router;
