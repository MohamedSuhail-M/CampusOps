import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../prisma';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { detectRoomConflicts, recommendAlternativeRooms } from '../../services/room_coordinator.service';

const router = Router();

router.use(authenticate);

// 1. GET /api/rooms/conflicts?roomId=:id&targetDate=:date
router.get('/conflicts', async (req: Request, res: Response) => {
  const { roomId, targetDate } = req.query;

  if (!roomId || typeof roomId !== 'string') {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'roomId query param required.' } });
    return;
  }

  try {
    const date = targetDate ? new Date(String(targetDate)) : undefined;
    const conflicts = await detectRoomConflicts(roomId, date);

    res.json({
      success: true,
      data: {
        roomId,
        impactedBookings: conflicts,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to detect room conflicts.', details: error.message },
    });
  }
});

// 2. GET /api/rooms/alternatives?bookingId=:id
router.get('/alternatives', async (req: Request, res: Response) => {
  const { bookingId } = req.query;

  if (!bookingId || typeof bookingId !== 'string') {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'bookingId query param required.' } });
    return;
  }

  try {
    const result = await recommendAlternativeRooms(bookingId);
    res.json({
      success: true,
      data: {
        ...result,
        alternatives: result.recommendations,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to recommend alternative rooms.', details: error.message },
    });
  }
});

// 3. POST /api/rooms/outages (Declare Room Outage)
router.post('/outages', requireRole(['FACILITIES_ADMIN', 'SYSTEM_ADMIN']), async (req: Request, res: Response) => {
  const { roomId, incidentId, startsAt, endsAt } = req.body;

  if (!roomId) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'roomId is required.' } });
    return;
  }

  try {
    const outCount = await prisma.roomOutage.count();
    const outageId = `OUT${String(outCount + 1).padStart(3, '0')}`;

    const outage = await prisma.roomOutage.create({
      data: {
        id: outageId,
        roomId,
        incidentId: incidentId || null,
        startsAt: startsAt ? new Date(startsAt) : new Date(),
        endsAt: endsAt ? new Date(endsAt) : null,
        status: 'ACTIVE',
      },
      include: { room: true },
    });

    // Detect affected bookings and create IncidentImpact records
    const conflicts = await detectRoomConflicts(roomId, outage.startsAt);
    if (incidentId) {
      for (const b of conflicts) {
        const impCount = await prisma.incidentImpact.count();
        await prisma.incidentImpact.create({
          data: {
            id: `IMP${String(impCount + 1).padStart(3, '0')}`,
            incidentId,
            targetType: 'BOOKING',
            targetId: b.id,
            impactType: 'EXAM_AT_RISK',
            status: 'ACTIVE',
          },
        });
      }
    }

    res.status(201).json({
      success: true,
      data: {
        outage,
        impactedBookingsCount: conflicts.length,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to record room outage.', details: error.message },
    });
  }
});

// 4. POST /api/rooms/relocate (Authorised Relocation Workflow)
const relocateSchema = z
  .object({
    bookingId: z.string().min(1, 'bookingId is required.'),
    newRoomId: z.string().min(1, 'newRoomId is required.'),
    reason: z.string().optional(),
    justification: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    reason: data.reason || data.justification || 'Facility hazard relocation',
  }));

router.post('/relocate', requireRole(['DEPARTMENT_MANAGER', 'FACILITIES_ADMIN', 'SYSTEM_ADMIN']), async (req: Request, res: Response) => {
  const result = relocateSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message || 'Invalid input.' },
    });
    return;
  }

  const { bookingId, newRoomId, reason } = result.data;
  const user = req.user!;

  try {
    const booking = await prisma.roomBooking.findUnique({
      where: { id: bookingId },
      include: {
        room: { include: { building: true } },
        requirements: true,
        faculty: true,
      },
    });

    if (!booking) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Booking '${bookingId}' not found.` } });
      return;
    }

    const newRoom = await prisma.room.findUnique({
      where: { id: newRoomId },
      include: {
        building: true,
        roomOutages: { where: { status: 'ACTIVE' } },
        roomBookings: {
          where: {
            status: 'CONFIRMED',
            id: { not: booking.id },
          },
        },
      },
    });

    if (!newRoom) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Destination room '${newRoomId}' not found.` } });
      return;
    }

    if (newRoom.roomOutages.length > 0) {
      res.status(400).json({
        success: false,
        error: { code: 'ROOM_OUTAGE_ACTIVE', message: `Destination room '${newRoom.code}' has an active outage and cannot be used.` },
      });
      return;
    }

    // Capacity verification
    const capReq = booking.requirements.find((r) => r.requirementType === 'CAPACITY');
    const requiredCapacity = capReq ? parseInt(capReq.value, 10) : 30;
    if (newRoom.capacity < requiredCapacity) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_CAPACITY',
          message: `Destination room '${newRoom.code}' capacity (${newRoom.capacity}) is lower than required (${requiredCapacity}).`,
        },
      });
      return;
    }

    // Timetable conflict verification
    const bkgStart = new Date(booking.startsAt).getTime();
    const bkgEnd = new Date(booking.endsAt).getTime();
    const conflict = newRoom.roomBookings.find((b) => {
      const s = new Date(b.startsAt).getTime();
      const e = new Date(b.endsAt).getTime();
      return Math.max(s, bkgStart) < Math.min(e, bkgEnd);
    });

    if (conflict) {
      res.status(409).json({
        success: false,
        error: {
          code: 'TIMETABLE_CONFLICT',
          message: `Destination room '${newRoom.code}' is already booked during this time slot (${conflict.purpose}).`,
        },
      });
      return;
    }

    const oldRoomId = booking.roomId;
    const oldRoomCode = `${booking.room.building.code}-${booking.room.code}`;
    const newRoomCode = `${newRoom.building.code}-${newRoom.code}`;

    // Execute relocation in transactional block
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Update Booking room reference
      const updatedBooking = await tx.roomBooking.update({
        where: { id: bookingId },
        data: { roomId: newRoomId },
        include: { room: true },
      });

      // 2. Resolve IncidentImpact for this booking if active
      await tx.incidentImpact.updateMany({
        where: { targetType: 'BOOKING', targetId: bookingId, status: 'ACTIVE' },
        data: { status: 'RESOLVED' },
      });

      // 3. Send Notification to faculty
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const timestamp = Date.now();
      const notification = await tx.notification.create({
        data: {
          id: `NOT-${timestamp}-${randomSuffix}`,
          recipientId: booking.facultyId,
          eventType: 'RELOCATION_REQUEST',
          title: `Classroom Relocation: ${booking.purpose}`,
          body: `Your session '${booking.purpose}' has been confirmed relocated from ${oldRoomCode} to ${newRoomCode} by ${user.name}.`,
          readAt: null,
          createdAt: new Date(),
        },
      });

      // 4. Immutable Audit Log (Matches AUD003 in seed workbook)
      const auditLog = await tx.auditLog.create({
        data: {
          id: `AUD-${timestamp}-${randomSuffix}`,
          actorId: user.id,
          action: 'CONFIRM_RELOCATION',
          entityType: 'ROOM_BOOKING',
          entityId: bookingId,
          beforeJson: JSON.stringify({ roomId: oldRoomId }),
          afterJson: JSON.stringify({
            roomId: newRoomId,
            authorizedBy: user.name,
            reason: reason || 'Facility hazard relocation',
          }),
          createdAt: new Date(),
        },
      });

      // 5. Outbox Event
      await tx.outboxEvent.create({
        data: {
          id: `OBX-${timestamp}-${randomSuffix}`,
          eventKey: `${booking.id}-RELOCATED-${timestamp}-${randomSuffix}`,
          eventType: 'RELOCATION_CONFIRMED',
          payload: JSON.stringify({
            bookingId: booking.id,
            fromRoomId: oldRoomId,
            toRoomId: newRoomId,
            facultyId: booking.facultyId,
          }),
          status: 'PENDING',
          attempts: 0,
          createdAt: new Date(),
        },
      });

      return { updatedBooking, notification, auditLog };
    });

    res.json({
      success: true,
      data: {
        booking: transaction.updatedBooking,
        bookingId: transaction.updatedBooking.id,
        fromRoomId: oldRoomId,
        toRoomId: newRoomId,
        newRoomCode,
        facultyNotified: booking.faculty.name,
        notificationId: transaction.notification.id,
        auditLogId: transaction.auditLog.id,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to relocate room booking.', details: error.message },
    });
  }
});

export default router;
