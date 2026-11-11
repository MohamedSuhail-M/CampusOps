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
    const dbPath = process.env.VERCEL
      ? '/tmp/dev.db'
      : path.resolve(__dirname, '../../../../prisma/dev.db');
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

/**
 * GET /api/admin/reports
 * Aggregates live database metrics across Incidents, Work Orders, Procurement, Facilities, and SLA.
 */
router.get('/reports', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(String(startDate));
    if (endDate) dateFilter.lte = new Date(String(endDate));

    const incidentWhere = Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : undefined;

    const [
      totalIncidents,
      incidentsByCategory,
      incidentsByStatus,
      incidentsByPriority,
      sensitiveIncidentsCount,
      totalWorkOrders,
      workOrdersByStatus,
      totalPurchaseRequests,
      approvedPRs,
      rejectedPRs,
      pendingPRs,
      totalStockReceipts,
      totalStockMovements,
      totalInventoryItems,
      lowStockItemsCount,
      totalFacilityRequests,
      approvedFacilityRequests,
      pendingFacilityRequests,
      rejectedFacilityRequests,
      totalRoomBookings,
      activeRoomOutages,
      slaPolicies,
    ] = await Promise.all([
      prisma.incident.count({ where: incidentWhere }),
      prisma.incident.groupBy({
        by: ['category'],
        _count: { id: true },
        where: incidentWhere,
      }),
      prisma.incident.groupBy({
        by: ['status'],
        _count: { id: true },
        where: incidentWhere,
      }),
      prisma.incident.groupBy({
        by: ['priority'],
        _count: { id: true },
        where: incidentWhere,
      }),
      prisma.incident.count({ where: { isSensitive: true } }),
      prisma.workOrder.count(),
      prisma.workOrder.groupBy({
        by: ['status'],
        _count: { id: true },
      }),
      prisma.purchaseRequest.count(),
      prisma.purchaseRequest.count({ where: { status: 'APPROVED' } }),
      prisma.purchaseRequest.count({ where: { status: 'REJECTED' } }),
      prisma.purchaseRequest.count({ where: { status: { in: ['PENDING_APPROVAL', 'PENDING', 'SUBMITTED'] } } }),
      prisma.stockReceipt.count(),
      prisma.stockMovement.count(),
      prisma.inventoryItem.count(),
      prisma.inventoryItem.count({
        where: {
          quantityOnHand: {
            lte: prisma.inventoryItem.fields.reorderLevel,
          },
        },
      }),
      prisma.facilityRequest.count(),
      prisma.facilityRequest.count({ where: { status: 'APPROVED' } }),
      prisma.facilityRequest.count({ where: { status: 'PENDING_APPROVAL' } }),
      prisma.facilityRequest.count({ where: { status: 'REJECTED' } }),
      prisma.roomBooking.count(),
      prisma.roomOutage.count({ where: { status: 'ACTIVE' } }),
      prisma.slaPolicy.findMany(),
    ]);

    // Format category distribution
    const categoryDistribution: Record<string, number> = {};
    for (const c of incidentsByCategory) {
      categoryDistribution[c.category] = c._count.id;
    }

    // Format status distribution
    const statusDistribution: Record<string, number> = {};
    for (const s of incidentsByStatus) {
      statusDistribution[s.status] = s._count.id;
    }

    // Format priority distribution
    const priorityDistribution: Record<string, number> = {};
    for (const p of incidentsByPriority) {
      priorityDistribution[p.priority] = p._count.id;
    }

    // Format work order distribution
    const workOrderStatusDistribution: Record<string, number> = {};
    for (const w of workOrdersByStatus) {
      workOrderStatusDistribution[w.status] = w._count.id;
    }

    // SLA Compliance calculation
    const resolvedCount = statusDistribution['RESOLVED'] || 0;
    const closedCount = statusDistribution['CLOSED'] || 0;
    const completedIncidents = resolvedCount + closedCount;
    const complianceRate = totalIncidents > 0 ? Math.min(100, Math.round(((completedIncidents + 1) / (totalIncidents + 1)) * 100)) : 100;

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        incidents: {
          total: totalIncidents,
          sensitive: sensitiveIncidentsCount,
          byCategory: categoryDistribution,
          byStatus: statusDistribution,
          byPriority: priorityDistribution,
        },
        workOrders: {
          total: totalWorkOrders,
          byStatus: workOrderStatusDistribution,
          blocked: workOrderStatusDistribution['BLOCKED'] || 0,
          completed: workOrderStatusDistribution['COMPLETED'] || 0,
        },
        procurement: {
          totalRequests: totalPurchaseRequests,
          approved: approvedPRs,
          rejected: rejectedPRs,
          pending: pendingPRs,
          stockReceipts: totalStockReceipts,
          stockMovements: totalStockMovements,
          inventoryItems: totalInventoryItems,
          lowStockAlerts: lowStockItemsCount,
        },
        facilities: {
          eventRequests: {
            total: totalFacilityRequests,
            approved: approvedFacilityRequests,
            pending: pendingFacilityRequests,
            rejected: rejectedFacilityRequests,
          },
          roomBookings: totalRoomBookings,
          activeRoomOutages,
        },
        sla: {
          compliancePercentage: complianceRate,
          configuredPolicies: slaPolicies.length,
          policies: slaPolicies,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
