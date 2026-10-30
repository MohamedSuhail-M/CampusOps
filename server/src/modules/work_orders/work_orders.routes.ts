import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../prisma';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { findEligibleTechnicians } from '../../services/technician_matcher.service';

const router = Router();

router.use(authenticate);

// Valid work order transitions
const VALID_WO_TRANSITIONS: Record<string, string[]> = {
  OPEN: ['ASSIGNED', 'CANCELLED'],
  ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['BLOCKED', 'COMPLETED', 'CANCELLED'],
  BLOCKED: ['IN_PROGRESS', 'RESUMED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

// GET /api/work-orders
router.get('/', async (req: Request, res: Response) => {
  const { assignedTo, status, incidentId } = req.query;

  try {
    const where: any = {};
    if (assignedTo && typeof assignedTo === 'string') where.assignedTo = assignedTo;
    if (status && typeof status === 'string') where.status = status;
    if (incidentId && typeof incidentId === 'string') where.incidentId = incidentId;

    const workOrders = await prisma.workOrder.findMany({
      where,
      include: {
        incident: {
          select: {
            id: true,
            reference: true,
            title: true,
            priority: true,
            category: true,
            building: { select: { code: true, name: true } },
            room: { select: { id: true, code: true } },
            asset: { select: { id: true, assetTag: true } },
          },
        },
        assignee: { select: { id: true, name: true, loginId: true } },
        requiredSkill: { select: { id: true, name: true } },
        _count: {
          select: { events: true, stockReservations: true, purchaseRequests: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    res.json({
      success: true,
      data: workOrders,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch work orders.', details: error.message },
    });
  }
});

// GET /api/work-orders/:id
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        incident: {
          include: {
            building: true,
            room: true,
            asset: true,
          },
        },
        assignee: true,
        requiredSkill: true,
        events: {
          orderBy: { createdAt: 'asc' },
          include: { actor: { select: { id: true, name: true } } },
        },
        stockReservations: {
          include: { item: true },
        },
        purchaseRequests: {
          include: {
            lines: { include: { item: true } },
            approvalDecisions: true,
            stockReceipts: true,
          },
        },
        maintenanceHistory: true,
      },
    });

    if (!wo) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Work order '${id}' not found.` },
      });
      return;
    }

    res.json({
      success: true,
      data: wo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch work order details.', details: error.message },
    });
  }
});

const createWoSchema = z.object({
  incidentId: z.string().min(1, 'incidentId is required'),
  requiredSkillId: z.string().optional(),
  dueAt: z.string().optional(),
});

// POST /api/work-orders
router.post('/', requireRole(['FACILITIES_ADMIN', 'SYSTEM_ADMIN']), async (req: Request, res: Response) => {
  try {
    const parsed = createWoSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', details: parsed.error.format() },
      });
      return;
    }

    const { incidentId, requiredSkillId, dueAt } = parsed.data;
    const user = req.user!;

    const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
    if (!incident) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Incident '${incidentId}' not found.` },
      });
      return;
    }

    // Auto-resolve skill if not passed
    let skillId = requiredSkillId;
    if (!skillId) {
      const categorySkillMap: Record<string, string> = {
        ELECTRICAL: 'SK01',
        NETWORK: 'SK02',
        HVAC: 'SK03',
        PLUMBING: 'SK04',
        AUDIO_VISUAL: 'SK05',
      };
      skillId = categorySkillMap[incident.category.toUpperCase()] || 'SK01';
    }

    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const woId = `WO-${timestamp}-${randomSuffix}`;

    const createdWo = await prisma.$transaction(async (tx) => {
      const wo = await tx.workOrder.create({
        data: {
          id: woId,
          incidentId,
          status: 'OPEN',
          requiredSkillId: skillId,
          dueAt: dueAt ? new Date(dueAt) : null,
        },
      });

      await tx.workOrderEvent.create({
        data: {
          id: `WOE-${timestamp}-${randomSuffix}`,
          workOrderId: woId,
          actorId: user.id,
          eventType: 'CREATED',
          details: `Work order created for incident ${incident.reference}`,
          createdAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          id: `AUD-${timestamp}-${randomSuffix}`,
          actorId: user.id,
          action: 'CREATE_WORK_ORDER',
          entityType: 'work_orders',
          entityId: woId,
          beforeJson: null,
          afterJson: JSON.stringify({ incidentId, status: 'OPEN', requiredSkillId: skillId }),
          createdAt: new Date(),
        },
      });

      return wo;
    });

    res.status(201).json({
      success: true,
      message: 'Work order created successfully.',
      data: createdWo,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

// GET /api/work-orders/:id/eligible-technicians
router.get('/:id/eligible-technicians', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: { requiredSkill: true },
    });

    if (!wo) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Work order '${id}' not found.` },
      });
      return;
    }

    if (!wo.requiredSkillId) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_SKILL_SPECIFIED', message: 'Work order does not have a required skill specified.' },
      });
      return;
    }

    const targetDate = wo.dueAt ? new Date(wo.dueAt) : new Date();
    const result = await findEligibleTechnicians(wo.requiredSkillId, targetDate);

    res.json({
      success: true,
      data: {
        workOrderId: wo.id,
        requiredSkill: wo.requiredSkill?.name,
        targetDate,
        ...result,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to evaluate technician eligibility.', details: error.message },
    });
  }
});

// POST /api/work-orders/:id/assign
router.post('/:id/assign', requireRole(['FACILITIES_ADMIN', 'SYSTEM_ADMIN', 'DEPARTMENT_MANAGER']), async (req: Request, res: Response) => {
  const { id } = req.params;
  const { technicianId } = req.body;
  const user = req.user!;

  if (!technicianId || typeof technicianId !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'technicianId is required.' },
    });
    return;
  }

  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: { incident: true },
    });

    if (!wo) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Work order '${id}' not found.` } });
      return;
    }

    // Verify technician eligibility
    if (wo.requiredSkillId) {
      const targetDate = wo.dueAt ? new Date(wo.dueAt) : new Date();
      const { eligible, excluded } = await findEligibleTechnicians(wo.requiredSkillId, targetDate);
      const isExcluded = excluded.find((c) => c.userId === technicianId);

      if (isExcluded) {
        res.status(400).json({
          success: false,
          error: {
            code: 'TECHNICIAN_NOT_ELIGIBLE',
            message: `Technician '${isExcluded.name}' cannot be assigned: ${isExcluded.reason}`,
          },
        });
        return;
      }
    }

    const techUser = await prisma.user.findUnique({ where: { id: technicianId } });
    if (!techUser) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Technician user not found.' } });
      return;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updatedWo = await tx.workOrder.update({
        where: { id },
        data: {
          assignedTo: technicianId,
          status: 'ASSIGNED',
        },
      });

      // Update Incident to ASSIGNED
      await tx.incident.update({
        where: { id: wo.incidentId },
        data: { status: 'ASSIGNED' },
      });

      // Log Work Order Event
      const woeCount = await tx.workOrderEvent.count();
      await tx.workOrderEvent.create({
        data: {
          id: `WOE${String(woeCount + 1).padStart(3, '0')}`,
          workOrderId: wo.id,
          actorId: user.id,
          eventType: 'ASSIGNED',
          details: `Assigned to technician ${techUser.name} (${techUser.id})`,
          createdAt: new Date(),
        },
      });

      // Audit Log
      const auditCount = await tx.auditLog.count();
      await tx.auditLog.create({
        data: {
          id: `AUD${String(auditCount + 1).padStart(3, '0')}`,
          actorId: user.id,
          action: 'ASSIGN',
          entityType: 'WORK_ORDER',
          entityId: wo.id,
          beforeJson: JSON.stringify({ assignedTo: wo.assignedTo, status: wo.status }),
          afterJson: JSON.stringify({ assignedTo: technicianId, status: 'ASSIGNED' }),
          createdAt: new Date(),
        },
      });

      return updatedWo;
    });

    res.json({
      success: true,
      data: updated,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to assign work order.', details: error.message },
    });
  }
});

// POST /api/work-orders/:id/transition (Start, Block, Resume, Complete)
router.post('/:id/transition', async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, blockedReason, resolution, faultType } = req.body;
  const user = req.user!;

  if (!action || typeof action !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: "action is required ('START', 'BLOCK', 'RESUME', 'COMPLETE')." },
    });
    return;
  }

  try {
    const wo = await prisma.workOrder.findUnique({
      where: { id },
      include: {
        incident: true,
        stockReservations: true,
      },
    });

    if (!wo) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Work order '${id}' not found.` } });
      return;
    }

    let nextStatus = '';
    let eventType = '';
    let details = '';

    switch (action.toUpperCase()) {
      case 'START':
        if (!['ASSIGNED'].includes(wo.status)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_TRANSITION', message: `Cannot START work order in '${wo.status}' status.` },
          });
          return;
        }
        nextStatus = 'IN_PROGRESS';
        eventType = 'STARTED';
        details = 'Technician started inspection and repair work.';
        break;

      case 'BLOCK':
        if (!['IN_PROGRESS'].includes(wo.status)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_TRANSITION', message: `Cannot BLOCK work order in '${wo.status}' status.` },
          });
          return;
        }
        if (!blockedReason) {
          res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'blockedReason string is required when blocking work order.' },
          });
          return;
        }
        nextStatus = 'BLOCKED';
        eventType = 'BLOCKED';
        details = `Blocked: ${blockedReason}`;
        break;

      case 'RESUME':
        if (!['BLOCKED'].includes(wo.status)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_TRANSITION', message: `Cannot RESUME work order in '${wo.status}' status.` },
          });
          return;
        }
        nextStatus = 'IN_PROGRESS';
        eventType = 'RESUMED';
        details = 'Work resumed after required spare parts or dependencies resolved.';
        break;

      case 'COMPLETE':
        if (!['IN_PROGRESS'].includes(wo.status)) {
          res.status(400).json({
            success: false,
            error: { code: 'INVALID_TRANSITION', message: `Cannot COMPLETE work order in '${wo.status}' status.` },
          });
          return;
        }
        if (!resolution) {
          res.status(400).json({
            success: false,
            error: { code: 'VALIDATION_ERROR', message: 'resolution string is required when completing work order.' },
          });
          return;
        }
        nextStatus = 'COMPLETED';
        eventType = 'COMPLETED';
        details = `Work completed: ${resolution}`;
        break;

      default:
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_ACTION', message: `Unknown action '${action}'. Allowed: START, BLOCK, RESUME, COMPLETE.` },
        });
        return;
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Work Order
      const updatedWo = await tx.workOrder.update({
        where: { id },
        data: {
          status: nextStatus,
          blockedReason: action.toUpperCase() === 'BLOCK' ? blockedReason : null,
        },
      });

      // 2. Create Event Record
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const timestamp = Date.now();
      await tx.workOrderEvent.create({
        data: {
          id: `WOE-${timestamp}-${randomSuffix}`,
          workOrderId: wo.id,
          actorId: user.id,
          eventType,
          details,
          createdAt: new Date(),
        },
      });

      // 3. Update Incident Status
      if (nextStatus === 'IN_PROGRESS') {
        await tx.incident.update({
          where: { id: wo.incidentId },
          data: { status: 'IN_PROGRESS' },
        });
      } else if (nextStatus === 'COMPLETED') {
        await tx.incident.update({
          where: { id: wo.incidentId },
          data: { status: 'RESOLVED' },
        });

        // Record Maintenance History if asset is attached or on room
        const targetAssetId = wo.incident.assetId || (await tx.asset.findFirst({ where: { roomId: wo.incident.roomId || undefined } }))?.id || (await tx.asset.findFirst())?.id;
        if (targetAssetId) {
          await tx.maintenanceHistory.create({
            data: {
              id: `MNT-${timestamp}-${randomSuffix}`,
              assetId: targetAssetId,
              workOrderId: wo.id,
              faultType: faultType || wo.incident.category,
              resolution,
              completedAt: new Date(),
            },
          });
        }

        // Clear any active room outages for this incident
        await tx.roomOutage.updateMany({
          where: { incidentId: wo.incidentId, status: 'ACTIVE' },
          data: { status: 'RESOLVED', endsAt: new Date() },
        });
      }

      // 4. Audit Log
      await tx.auditLog.create({
        data: {
          id: `AUD-${timestamp}-${randomSuffix}`,
          actorId: user.id,
          action: `WORK_ORDER_${action.toUpperCase()}`,
          entityType: 'WORK_ORDER',
          entityId: wo.id,
          beforeJson: JSON.stringify({ status: wo.status }),
          afterJson: JSON.stringify({ status: nextStatus, details }),
          createdAt: new Date(),
        },
      });

      return updatedWo;
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to transition work order.', details: error.message },
    });
  }
});

export default router;
