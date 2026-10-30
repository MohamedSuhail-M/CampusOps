import { Router, Request, Response } from 'express';
import prisma from '../../prisma';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { getSlaMetrics } from '../../services/sla.service';

const router = Router();
router.use(authenticate);

/**
 * GET /api/sla/metrics
 * Returns SLA compliance metrics, at-risk flags, and priority deadlines.
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const metrics = await getSlaMetrics();
    res.json({ success: true, data: metrics });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/sla/policies
 * Returns all active SLA priority policies.
 */
router.get('/policies', async (req: Request, res: Response) => {
  try {
    const policies = await prisma.slaPolicy.findMany({
      orderBy: { responseMinutes: 'asc' },
    });
    res.json({ success: true, data: policies });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/notifications
 * Returns in-app notifications for the logged-in user.
 */
router.get('/user/all', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const notifications = await prisma.notification.findMany({
      where: { recipientId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    res.json({
      success: true,
      data: {
        unreadCount,
        notifications,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * PATCH /api/notifications/:id/read
 * Marks a notification as read.
 */
router.patch('/user/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found.' } });
      return;
    }

    if (notif.recipientId !== user.id) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { readAt: new Date() },
    });

    res.json({ success: true, message: 'Notification marked as read.', data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * PATCH /api/notifications/read-all
 * Marks all notifications for current user as read.
 */
router.patch('/user/read-all', async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const result = await prisma.notification.updateMany({
      where: { recipientId: user.id, readAt: null },
      data: { readAt: new Date() },
    });

    res.json({ success: true, message: `Marked ${result.count} notifications as read.`, data: { count: result.count } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/sla/outbox
 * Returns outbound events for simulated notifications (SMS, Email, Webhook).
 */
router.get('/outbox', requireRole(['SYSTEM_ADMIN', 'FACILITIES_ADMIN']), async (req: Request, res: Response) => {
  try {
    const events = await prisma.outboxEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: events });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * POST /api/sla/outbox/process
 * Simulates dispatch of pending outbox events.
 */
router.post('/outbox/process', requireRole(['SYSTEM_ADMIN']), async (req: Request, res: Response) => {
  try {
    const pendingEvents = await prisma.outboxEvent.findMany({
      where: { status: 'PENDING' },
      take: 50,
    });

    const processedIds: string[] = [];
    for (const ev of pendingEvents) {
      await prisma.outboxEvent.update({
        where: { id: ev.id },
        data: {
          status: 'SENT',
          attempts: { increment: 1 },
        },
      });
      processedIds.push(ev.id);
    }

    res.json({
      success: true,
      message: `Processed and dispatched ${processedIds.length} outbound event(s).`,
      data: { processedCount: processedIds.length, processedIds },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

export default router;
