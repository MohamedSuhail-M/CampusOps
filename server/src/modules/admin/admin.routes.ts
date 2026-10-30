import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import prisma from '../../prisma';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.use(requireRole(['SYSTEM_ADMIN', 'FACILITIES_ADMIN']));

/**
 * GET /api/admin/overview
 * Returns executive operational overview across all modules.
 */
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalIncidents,
      openIncidents,
      criticalIncidents,
      workOrdersCount,
      blockedWorkOrders,
      lowStockItemsCount,
      recentAudits,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.incident.count(),
      prisma.incident.count({ where: { status: { in: ['REPORTED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS'] } } }),
      prisma.incident.count({ where: { priority: 'CRITICAL', status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      prisma.workOrder.count(),
      prisma.workOrder.count({ where: { status: 'BLOCKED' } }),
      prisma.inventoryItem.count({
        where: {
          quantityOnHand: {
            lte: prisma.inventoryItem.fields.reorderLevel,
          },
        },
      }),
      prisma.auditLog.findMany({
        include: { actor: { select: { id: true, name: true, loginId: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    res.json({
      success: true,
      data: {
        users: { total: totalUsers },
        incidents: {
          total: totalIncidents,
          open: openIncidents,
          critical: criticalIncidents,
        },
        workOrders: {
          total: workOrdersCount,
          blocked: blockedWorkOrders,
        },
        inventory: {
          lowStockAlerts: lowStockItemsCount,
        },
        recentAudits,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/admin/audit-logs
 * Returns audit trail with filtering by entityType, actorId, and action.
 */
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const { entityType, actorId, action, limit = 50, offset = 0 } = req.query;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where: {
          entityType: entityType ? String(entityType) : undefined,
          actorId: actorId ? String(actorId) : undefined,
          action: action ? String(action) : undefined,
        },
        include: {
          actor: {
            select: { id: true, name: true, loginId: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.auditLog.count({
        where: {
          entityType: entityType ? String(entityType) : undefined,
          actorId: actorId ? String(actorId) : undefined,
          action: action ? String(action) : undefined,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        logs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/admin/system-health
 * Diagnostic metrics for SQLite database and server runtime.
 */
router.get('/system-health', async (req: Request, res: Response) => {
  try {
    const dbPath = path.resolve(__dirname, '../../../../prisma/dev.db');
    let dbSizeBytes = 0;
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      dbSizeBytes = stats.size;
    }

    const [
      userCount,
      buildingCount,
      roomCount,
      assetCount,
      incidentCount,
      workOrderCount,
      inventoryCount,
      auditCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.building.count(),
      prisma.room.count(),
      prisma.asset.count(),
      prisma.incident.count(),
      prisma.workOrder.count(),
      prisma.inventoryItem.count(),
      prisma.auditLog.count(),
    ]);

    res.json({
      success: true,
      data: {
        status: 'HEALTHY',
        uptimeSeconds: Math.round(process.uptime()),
        memoryUsageMb: Math.round(process.memoryUsage().rss / (1024 * 1024)),
        database: {
          type: 'SQLite',
          path: 'prisma/dev.db',
          sizeBytes: dbSizeBytes,
          sizeFormatted: `${(dbSizeBytes / 1024).toFixed(1)} KB`,
        },
        tableRecordCounts: {
          users: userCount,
          buildings: buildingCount,
          rooms: roomCount,
          assets: assetCount,
          incidents: incidentCount,
          workOrders: workOrderCount,
          inventoryItems: inventoryCount,
          auditLogs: auditCount,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/admin/users
 * Returns list of users with their assigned roles and departments.
 */
router.get('/users', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        department: { select: { id: true, name: true } },
        userRoles: {
          include: {
            role: { select: { id: true, code: true, name: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        loginId: u.loginId,
        name: u.name,
        email: u.email,
        status: u.status,
        department: u.department?.name || 'Unassigned',
        roles: u.userRoles.map((ur) => ur.role.code),
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
