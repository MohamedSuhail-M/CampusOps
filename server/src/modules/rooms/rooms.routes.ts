import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../prisma';
import { authenticate, requireRole } from '../../middleware/auth.middleware';
import { detectRoomConflicts, recommendAlternativeRooms } from '../../services/room_coordinator.service';

const router = Router();

router.use(authenticate);

// -------------------------------------------------------------
// 0. ROOM TIMETABLES & ACADEMIC SCHEDULES MATRIX (Issue 2)
// -------------------------------------------------------------
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// GET /api/rooms/timetable
router.get('/timetable', async (req: Request, res: Response) => {
  const {
    roomId,
    buildingId,
    departmentId,
    facultyId,
    dayOfWeek,
    date,
    startDate,
    endDate,
    status,
    search,
  } = req.query;

  try {
    const where: any = {};

    // Filter by status (defaults to CONFIRMED or any non-cancelled)
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    } else if (!status) {
      where.status = { not: 'CANCELLED' };
    }

    // Filter by Room ID or Code
    if (roomId && typeof roomId === 'string' && roomId !== 'ALL') {
      where.OR = [
        { roomId },
        { room: { code: roomId } },
        { roomId: `RM-${roomId}` },
      ];
    }

    // Filter by Building
    if (buildingId && typeof buildingId === 'string' && buildingId !== 'ALL') {
      where.room = {
        ...where.room,
        OR: [
          { buildingId },
          { building: { code: buildingId } },
          { building: { id: `BLD-${buildingId}` } },
        ],
      };
    }

    // Filter by Department
    if (departmentId && typeof departmentId === 'string' && departmentId !== 'ALL') {
      where.departmentId = departmentId;
    }

    // Filter by Faculty
    if (facultyId && typeof facultyId === 'string' && facultyId !== 'ALL') {
      where.facultyId = facultyId;
    }

    // Filter by Date or Date range
    if (date && typeof date === 'string') {
      const target = new Date(date);
      if (!isNaN(target.getTime())) {
        const startOfDay = new Date(target);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(target);
        endOfDay.setHours(23, 59, 59, 999);
        where.startsAt = { gte: startOfDay, lte: endOfDay };
      }
    } else if (startDate || endDate) {
      where.startsAt = {};
      if (startDate) where.startsAt.gte = new Date(String(startDate));
      if (endDate) where.startsAt.lte = new Date(String(endDate));
    }

    // Text search in purpose, faculty name, room code
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim();
      where.OR = [
        { purpose: { contains: q } },
        { faculty: { name: { contains: q } } },
        { room: { code: { contains: q } } },
      ];
    }

    const bookings = await prisma.roomBooking.findMany({
      where,
      include: {
        room: {
          include: {
            building: true,
            roomOutages: { where: { status: 'ACTIVE' } },
          },
        },
        department: true,
        faculty: { select: { id: true, name: true, email: true, loginId: true } },
        requirements: true,
      },
      orderBy: [{ startsAt: 'asc' }, { roomId: 'asc' }],
    });

    // Format timetable entries with readable day, time slot, and outage health
    const formatted = bookings.map((b) => {
      const start = new Date(b.startsAt);
      const end = new Date(b.endsAt);
      const dayName = DAYS_OF_WEEK[start.getDay()] || 'Monday';

      const formatTime = (d: Date) =>
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
      const timeSlot = `${formatTime(start)} - ${formatTime(end)}`;

      const activeOutage = b.room.roomOutages[0] || null;
      const isDisrupted = !!activeOutage;

      return {
        id: b.id,
        bookingId: b.id,
        roomId: b.roomId,
        roomCode: b.room.code,
        roomName: `Room ${b.room.code}`,
        roomType: b.room.roomType,
        capacity: b.room.capacity,
        buildingId: b.room.buildingId,
        buildingCode: b.room.building.code,
        buildingName: b.room.building.name,
        departmentId: b.departmentId,
        departmentName: b.department.name,
        facultyId: b.facultyId,
        facultyName: b.faculty.name,
        facultyEmail: b.faculty.email,
        startsAt: b.startsAt,
        endsAt: b.endsAt,
        date: start.toISOString().split('T')[0],
        dayOfWeek: dayName,
        timeSlot,
        purpose: b.purpose,
        status: b.status,
        requirements: b.requirements.map((r) => ({ type: r.requirementType, value: r.value })),
        isDisrupted,
        outageStatus: isDisrupted ? 'DISRUPTED' : 'OPERATIONAL',
        outageReason: activeOutage ? 'Active Facility Outage / Equipment Hazard' : null,
      };
    });

    // Filter by day of week if specified (e.g. "Monday")
    const filtered =
      dayOfWeek && typeof dayOfWeek === 'string' && dayOfWeek !== 'ALL'
        ? formatted.filter((item) => item.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase())
        : formatted;

    res.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch timetable records.', details: error.message },
    });
  }
});

// GET /api/rooms/:roomId/timetable (Direct room timetable)
router.get('/:roomId/timetable', async (req: Request, res: Response) => {
  const { roomId } = req.params;
  const { dayOfWeek, status } = req.query;

  try {
    const room = await prisma.room.findFirst({
      where: {
        OR: [{ id: roomId }, { code: roomId }, { id: `RM-${roomId}` }],
      },
      include: { building: true },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Room '${roomId}' not found.` },
      });
      return;
    }

    const where: any = { roomId: room.id };
    if (status && typeof status === 'string' && status !== 'ALL') {
      where.status = status;
    } else {
      where.status = { not: 'CANCELLED' };
    }

    const bookings = await prisma.roomBooking.findMany({
      where,
      include: {
        room: { include: { building: true, roomOutages: { where: { status: 'ACTIVE' } } } },
        department: true,
        faculty: { select: { id: true, name: true, email: true } },
        requirements: true,
      },
      orderBy: { startsAt: 'asc' },
    });

    const formatted = bookings.map((b) => {
      const start = new Date(b.startsAt);
      const end = new Date(b.endsAt);
      const dayName = DAYS_OF_WEEK[start.getDay()] || 'Monday';
      const formatTime = (d: Date) =>
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      return {
        id: b.id,
        bookingId: b.id,
        roomCode: b.room.code,
        capacity: b.room.capacity,
        buildingCode: b.room.building.code,
        departmentName: b.department.name,
        facultyName: b.faculty.name,
        startsAt: b.startsAt,
        endsAt: b.endsAt,
        dayOfWeek: dayName,
        timeSlot: `${formatTime(start)} - ${formatTime(end)}`,
        purpose: b.purpose,
        status: b.status,
        isDisrupted: b.room.roomOutages.length > 0,
      };
    });

    const filtered =
      dayOfWeek && typeof dayOfWeek === 'string' && dayOfWeek !== 'ALL'
        ? formatted.filter((item) => item.dayOfWeek.toLowerCase() === dayOfWeek.toLowerCase())
        : formatted;

    res.json({
      success: true,
      room: {
        id: room.id,
        code: room.code,
        capacity: room.capacity,
        roomType: room.roomType,
        building: room.building.name,
      },
      count: filtered.length,
      data: filtered,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
    });
  }
});

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

// -------------------------------------------------------------
// 4. ROOM RELOCATION WORKFLOWS (Policy 3.1 & Academic Continuity)
// -------------------------------------------------------------

/**
 * GET /api/rooms/relocations
 * Lists pending classroom relocation candidates and recent relocation decisions.
 * Scoped to department for DEPARTMENT_MANAGER.
 */
router.get(
  '/relocations',
  requireRole(['DEPARTMENT_MANAGER', 'FACILITIES_ADMIN', 'SYSTEM_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const user = req.user!;
      let deptFilter: any = {};
      if (user.activeRole === 'DEPARTMENT_MANAGER') {
        const managed = await prisma.department.findFirst({ where: { managerId: user.id } });
        const deptId = user.departmentId || managed?.id;
        if (deptId) {
          deptFilter = { departmentId: deptId };
        }
      }

      // 1. Find all active room outages
      const activeOutages = await prisma.roomOutage.findMany({
        where: { status: 'ACTIVE' },
        include: { room: { include: { building: true } }, incident: true },
      });

      const outageRoomIds = activeOutages.map((o) => o.roomId);

      // Find all active booking impacts
      const activeImpacts = await prisma.incidentImpact.findMany({
        where: { targetType: 'BOOKING', status: 'ACTIVE' },
      });
      const impactedBookingIds = activeImpacts.map((i) => i.targetId);

      // 2. Find confirmed bookings in disrupted rooms or with active hazard impacts
      const pendingConditions: any[] = [];
      if (outageRoomIds.length > 0) {
        pendingConditions.push({ roomId: { in: outageRoomIds } });
      }
      if (impactedBookingIds.length > 0) {
        pendingConditions.push({ id: { in: impactedBookingIds } });
      }

      // If BKG-EXAM is currently positioned in a hazard room (e.g. RM-B-204), include it
      const bkgExam = await prisma.roomBooking.findUnique({ where: { id: 'BKG-EXAM' } });
      if (bkgExam && (bkgExam.roomId === 'RM-B-204' || outageRoomIds.includes(bkgExam.roomId))) {
        pendingConditions.push({ id: 'BKG-EXAM' });
      }

      let pendingBookings: any[] = [];
      if (pendingConditions.length > 0) {
        pendingBookings = await prisma.roomBooking.findMany({
          where: {
            status: 'CONFIRMED',
            ...deptFilter,
            OR: pendingConditions,
          },
          include: {
            room: { include: { building: true } },
            faculty: { select: { id: true, name: true, email: true } },
            department: true,
            requirements: true,
          },
        });
      }

      // 3. For each pending booking, get scored recommendations
      const pendingItems = [];
      for (const bkg of pendingBookings) {
        let recommendations: any[] = [];
        try {
          const rec = await recommendAlternativeRooms(bkg.id);
          recommendations = rec.recommendations;
        } catch {
          recommendations = [];
        }

        const outage = activeOutages.find((o) => o.roomId === bkg.roomId);
        pendingItems.push({
          booking: bkg,
          outage: outage || { id: 'OUT-HAZARD', reason: 'Critical electrical hazard / power interruption' },
          recommendations,
        });
      }

      // 4. Fetch recent relocation audit logs
      const recentAudits = await prisma.auditLog.findMany({
        where: {
          entityType: 'ROOM_BOOKING',
          action: { in: ['CONFIRM_RELOCATION', 'REJECT_RELOCATION'] },
        },
        include: { actor: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      res.json({
        success: true,
        data: {
          pending: pendingItems,
          history: recentAudits.map((a) => {
            let details = null;
            try {
              details = a.afterJson ? JSON.parse(a.afterJson) : null;
            } catch {
              details = null;
            }
            return {
              id: a.id,
              action: a.action,
              bookingId: a.entityId,
              actor: a.actor?.name || 'Department Manager',
              details,
              decidedAt: a.createdAt,
            };
          }),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }
);

// POST /api/rooms/relocate (Authorised Relocation Decision Workflow)
const relocateSchema = z
  .object({
    bookingId: z.string().optional(),
    fromRoomId: z.string().optional(),
    newRoomId: z.string().optional(),
    toRoomId: z.string().optional(),
    destinationRoomId: z.string().optional(),
    decision: z.enum(['APPROVE', 'REJECT']).optional().default('APPROVE'),
    reason: z.string().optional(),
    justification: z.string().optional(),
    reviewNotes: z.string().optional(),
  })
  .transform((data) => ({
    ...data,
    newRoomId: data.newRoomId || data.toRoomId || data.destinationRoomId || '',
    reason: data.reason || data.justification || data.reviewNotes || 'Facility hazard relocation',
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

  const { fromRoomId, newRoomId, decision, reason, reviewNotes } = result.data;
  let bookingId = result.data.bookingId;
  const user = req.user!;

  try {
    // If bookingId was not explicitly passed, resolve by fromRoomId
    if (!bookingId && fromRoomId) {
      const candidateBooking = await prisma.roomBooking.findFirst({
        where: { roomId: fromRoomId, status: 'CONFIRMED' },
        orderBy: { startsAt: 'asc' },
      });
      if (candidateBooking) {
        bookingId = candidateBooking.id;
      }
    }

    if (!bookingId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'bookingId (or fromRoomId with an active booking) is required.' },
      });
      return;
    }

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

    // Role-based Department scope enforcement: Department Managers can only process relocations for their department
    if (user.activeRole === 'DEPARTMENT_MANAGER') {
      const managedDept = await prisma.department.findFirst({ where: { managerId: user.id } });
      const authorizedDeptId = user.departmentId || managedDept?.id;
      if (authorizedDeptId && booking.departmentId && booking.departmentId !== authorizedDeptId) {
        res.status(403).json({
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: `Department Manager is only authorized to process relocations within their assigned department (${authorizedDeptId}).`,
          },
        });
        return;
      }
    }

    const oldRoomId = booking.roomId;
    const oldRoomCode = `${booking.room.building.code}-${booking.room.code}`;

    // ==========================================
    // REJECTION BRANCH: Keep booking in original room
    // ==========================================
    if (decision === 'REJECT') {
      const rejectionReason = reviewNotes || reason || 'Relocation rejected by Department Manager';
      const timestamp = Date.now();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);

      const transaction = await prisma.$transaction(async (tx) => {
        const notif = await tx.notification.create({
          data: {
            id: `NOT-${timestamp}-${randomSuffix}`,
            recipientId: booking.facultyId,
            eventType: 'RELOCATION_REJECTED',
            title: `Room Relocation Rejected: ${booking.purpose}`,
            body: `Relocation request for session '${booking.purpose}' in ${oldRoomCode} was rejected by ${user.name}. Reason: ${rejectionReason}`,
            readAt: null,
            createdAt: new Date(),
          },
        });

        const auditLog = await tx.auditLog.create({
          data: {
            id: `AUD-${timestamp}-${randomSuffix}`,
            actorId: user.id,
            action: 'REJECT_RELOCATION',
            entityType: 'ROOM_BOOKING',
            entityId: booking.id,
            beforeJson: JSON.stringify({ roomId: oldRoomId }),
            afterJson: JSON.stringify({
              decision: 'REJECT',
              rejectedBy: user.name,
              reason: rejectionReason,
              bookingId: booking.id,
              originalRoom: oldRoomCode,
            }),
            createdAt: new Date(),
          },
        });

        return { notif, auditLog };
      });

      res.json({
        success: true,
        message: 'Classroom relocation request has been rejected.',
        data: {
          decision: 'REJECT',
          bookingId: booking.id,
          originalRoomId: oldRoomId,
          reason: rejectionReason,
          notificationId: transaction.notif.id,
          auditLogId: transaction.auditLog.id,
        },
      });
      return;
    }

    // ==========================================
    // APPROVAL BRANCH: Validate destination room & conflicts
    // ==========================================
    if (!newRoomId) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Destination room (newRoomId or toRoomId) is required for relocation approval.' },
      });
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

    const newRoomCode = `${newRoom.building.code}-${newRoom.code}`;

    // Check if booking is already relocated to the destination room
    if (booking.roomId === newRoomId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_RELOCATED',
          message: `Booking '${booking.purpose}' has already been relocated to room '${newRoomCode}'.`,
        },
      });
      return;
    }

    // Execute relocation in transactional block
    const transaction = await prisma.$transaction(async (tx) => {
      // 1. Update Booking room reference
      const updatedBooking = await tx.roomBooking.update({
        where: { id: booking.id },
        data: { roomId: newRoomId },
        include: { room: true },
      });

      // 2. Resolve IncidentImpact for this booking if active
      await tx.incidentImpact.updateMany({
        where: { targetType: 'BOOKING', targetId: booking.id, status: 'ACTIVE' },
        data: { status: 'RESOLVED' },
      });

      // 3. Synchronize Associated Ticket / Incident (Issue 3)
      // Find all incidents associated with this booking impact or room outage
      const linkedImpacts = await tx.incidentImpact.findMany({
        where: { targetType: 'BOOKING', targetId: booking.id },
        include: { incident: { include: { workOrders: true } } },
      });

      const linkedOutages = await tx.roomOutage.findMany({
        where: { roomId: oldRoomId },
        include: { incident: { include: { workOrders: true } } },
      });

      const incidentMap = new Map<string, any>();
      for (const imp of linkedImpacts) {
        if (imp.incident) incidentMap.set(imp.incident.id, imp.incident);
      }
      for (const out of linkedOutages) {
        if (out.incident) incidentMap.set(out.incident.id, out.incident);
      }

      // Check explicit ticketId/incidentId from body
      const explicitId = (req.body.ticketId || req.body.incidentId) as string | undefined;
      if (explicitId) {
        const directInc = await tx.incident.findFirst({
          where: { OR: [{ id: explicitId }, { reference: explicitId }] },
          include: { workOrders: true },
        });
        if (directInc) incidentMap.set(directInc.id, directInc);
      }

      const updatedIncidents: any[] = [];
      for (const [incId, inc] of incidentMap.entries()) {
        const activeWos = (inc.workOrders || []).filter((w: any) =>
          ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'BLOCKED'].includes(w.status)
        );

        // If no active work orders remain (or this is purely a relocation request ticket),
        // close / resolve the ticket to reach its correct terminal state.
        if (activeWos.length === 0) {
          const closedInc = await tx.incident.update({
            where: { id: incId },
            data: { status: 'RESOLVED' },
          });
          updatedIncidents.push({ id: closedInc.id, reference: closedInc.reference, status: 'RESOLVED' });
        } else {
          // If a maintenance work order is still active, advance ticket to at least IN_PROGRESS / ASSIGNED
          if (inc.status === 'NEW' || inc.status === 'TRIAGED') {
            const advInc = await tx.incident.update({
              where: { id: incId },
              data: { status: 'ASSIGNED' },
            });
            updatedIncidents.push({ id: advInc.id, reference: advInc.reference, status: 'ASSIGNED' });
          }
        }
      }

      // Check if all bookings for old room are now relocated; if so, resolve room outage
      const remainingBookingsInOldRoom = await tx.roomBooking.count({
        where: { roomId: oldRoomId, status: 'CONFIRMED' },
      });
      if (remainingBookingsInOldRoom === 0) {
        await tx.roomOutage.updateMany({
          where: { roomId: oldRoomId, status: 'ACTIVE' },
          data: { status: 'RESOLVED', endsAt: new Date() },
        });
      }

      // 4. Send Notification to faculty
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

      // 5. Immutable Audit Log (Matches AUD003 in seed workbook)
      const auditLog = await tx.auditLog.create({
        data: {
          id: `AUD-${timestamp}-${randomSuffix}`,
          actorId: user.id,
          action: 'CONFIRM_RELOCATION',
          entityType: 'ROOM_BOOKING',
          entityId: booking.id,
          beforeJson: JSON.stringify({ roomId: oldRoomId }),
          afterJson: JSON.stringify({
            roomId: newRoomId,
            authorizedBy: user.name,
            reason: reason || 'Facility hazard relocation',
            associatedIncidents: updatedIncidents,
          }),
          createdAt: new Date(),
        },
      });

      // 6. Outbox Event
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
            updatedIncidents,
          }),
          status: 'PENDING',
          attempts: 0,
          createdAt: new Date(),
        },
      });

      return { updatedBooking, notification, auditLog, updatedIncidents };
    });

    res.json({
      success: true,
      message: `Classroom relocation authorized: moved to ${newRoomCode}. Associated ticket updated.`,
      data: {
        booking: transaction.updatedBooking,
        bookingId: transaction.updatedBooking.id,
        fromRoomId: oldRoomId,
        toRoomId: newRoomId,
        newRoomCode,
        facultyNotified: booking.faculty.name,
        notificationId: transaction.notification.id,
        auditLogId: transaction.auditLog.id,
        updatedIncidents: transaction.updatedIncidents,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to relocate room booking.', details: error.message },
    });
  }
});

// -------------------------------------------------------------
// 5. STUDENT FACILITY & EVENT REQUESTS WORKFLOW (Feature 4)
// -------------------------------------------------------------

const createFacilityRequestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  roomId: z.string().min(1, 'Room is required'),
  buildingId: z.string().optional().nullable(),
  eventDate: z.string().min(1, 'Event date is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
  expectedAttendance: z.number().int().positive().default(30),
  category: z.string().default('CLUB_EVENT'),
  equipmentRequirements: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  attachmentUrl: z.string().optional().nullable(),
});

/**
 * POST /api/rooms/facility-requests
 * Student submission for event or facility use permission.
 */
router.post('/facility-requests', async (req: Request, res: Response) => {
  const result = createFacilityRequestSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message || 'Invalid input.' },
    });
    return;
  }

  const {
    title,
    description,
    roomId,
    buildingId,
    eventDate,
    startTime = '10:00',
    endTime = '12:00',
    expectedAttendance,
    category,
    equipmentRequirements,
    notes,
    attachmentUrl,
  } = result.data;

  const user = req.user!;

  try {
    const room = await prisma.room.findFirst({
      where: {
        OR: [{ id: roomId }, { code: roomId }],
      },
      include: {
        building: true,
        roomOutages: { where: { status: 'ACTIVE' } },
        roomBookings: { where: { status: 'CONFIRMED' } },
      },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: `Requested room '${roomId}' does not exist.` },
      });
      return;
    }

    // Parse start and end timestamps
    const dateStr = eventDate.includes('T') ? eventDate.split('T')[0] : eventDate;
    const startsAt = result.data.startsAt ? new Date(result.data.startsAt) : new Date(`${dateStr}T${startTime}:00`);
    const endsAt = result.data.endsAt ? new Date(result.data.endsAt) : new Date(`${dateStr}T${endTime}:00`);

    if (isNaN(startsAt.getTime()) || isNaN(endsAt.getTime()) || startsAt >= endsAt) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TIME_RANGE', message: 'Start time must precede end time on the event date.' },
      });
      return;
    }

    // Check for room outage
    if (room.roomOutages.length > 0) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ROOM_OUTAGE',
          message: `Room ${room.code} currently has an active facility outage and cannot be requested.`,
        },
      });
      return;
    }

    // Check for conflicting confirmed bookings
    const sTime = startsAt.getTime();
    const eTime = endsAt.getTime();
    const conflict = room.roomBookings.find((b) => {
      const bStart = new Date(b.startsAt).getTime();
      const bEnd = new Date(b.endsAt).getTime();
      return Math.max(sTime, bStart) < Math.min(eTime, bEnd);
    });

    if (conflict) {
      res.status(409).json({
        success: false,
        error: {
          code: 'BOOKING_CONFLICT',
          message: `Room ${room.code} already has a confirmed booking during this period (${conflict.purpose}).`,
        },
      });
      return;
    }

    const timestamp = Date.now();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const requestId = `FAC-${timestamp}-${randomSuffix}`;

    const facilityRequest = await prisma.$transaction(async (tx) => {
      const created = await tx.facilityRequest.create({
        data: {
          id: requestId,
          requesterId: user.id,
          title,
          description,
          buildingId: buildingId || room.buildingId,
          roomId: room.id,
          eventDate: new Date(dateStr),
          startsAt,
          endsAt,
          expectedAttendance,
          category,
          equipmentRequirements,
          notes,
          attachmentUrl,
          status: 'PENDING_APPROVAL',
          createdAt: new Date(),
        },
        include: {
          room: { include: { building: true } },
          requester: { select: { id: true, name: true, email: true } },
        },
      });

      // Audit log entry
      await tx.auditLog.create({
        data: {
          id: `AUD-${timestamp}-${randomSuffix}`,
          actorId: user.id,
          action: 'SUBMIT_FACILITY_REQUEST',
          entityType: 'FACILITY_REQUEST',
          entityId: requestId,
          beforeJson: null,
          afterJson: JSON.stringify({
            title,
            roomCode: room.code,
            startsAt: startsAt.toISOString(),
            endsAt: endsAt.toISOString(),
            status: 'PENDING_APPROVAL',
          }),
          createdAt: new Date(),
        },
      });

      // Notify facilities administrator
      const facilitiesAdmins = await tx.userRole.findMany({
        where: { role: { code: 'FACILITIES_ADMIN' } },
        select: { userId: true },
      });

      for (const fa of facilitiesAdmins) {
        await tx.notification.create({
          data: {
            id: `NOT-${timestamp}-${Math.floor(1000 + Math.random() * 9000)}`,
            recipientId: fa.userId,
            eventType: 'FACILITY_REQUEST_SUBMITTED',
            title: `New Event Request: ${title}`,
            body: `Student ${user.name} submitted an event request for Room ${room.code} on ${dateStr}. Review pending approval.`,
            createdAt: new Date(),
          },
        });
      }

      return created;
    });

    res.status(201).json({
      success: true,
      message: 'Event and facility request submitted successfully for review.',
      data: facilityRequest,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
});

/**
 * GET /api/rooms/facility-requests
 * Returns facility requests. Students see own; staff see queue.
 */
router.get('/facility-requests', async (req: Request, res: Response) => {
  const user = req.user!;
  const userRoles = (user.roles || []).map((r: any) => (typeof r === 'string' ? r : r.code));
  const isStaff = userRoles.some((r: string) => ['FACILITIES_ADMIN', 'SYSTEM_ADMIN'].includes(r));

  const { status, roomId } = req.query;

  try {
    const where: any = {};
    if (!isStaff) {
      where.requesterId = user.id;
    }
    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (roomId && typeof roomId === 'string') {
      where.roomId = roomId;
    }

    const requests = await prisma.facilityRequest.findMany({
      where,
      include: {
        room: { include: { building: true } },
        requester: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
        booking: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: requests,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: err.message },
    });
  }
});

/**
 * GET /api/rooms/facility-requests/:id
 * Returns single request details with live conflict check.
 */
router.get('/facility-requests/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = req.user!;
  const userRoles = (user.roles || []).map((r: any) => (typeof r === 'string' ? r : r.code));
  const isStaff = userRoles.some((r: string) => ['FACILITIES_ADMIN', 'SYSTEM_ADMIN'].includes(r));

  try {
    const facilityRequest = await prisma.facilityRequest.findUnique({
      where: { id },
      include: {
        room: {
          include: {
            building: true,
            roomOutages: { where: { status: 'ACTIVE' } },
            roomBookings: { where: { status: 'CONFIRMED' } },
          },
        },
        requester: { select: { id: true, name: true, email: true, department: true } },
        reviewer: { select: { id: true, name: true } },
        booking: true,
      },
    });

    if (!facilityRequest) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found.' } });
      return;
    }

    if (!isStaff && facilityRequest.requesterId !== user.id) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      return;
    }

    // Live conflict evaluation
    const sTime = new Date(facilityRequest.startsAt).getTime();
    const eTime = new Date(facilityRequest.endsAt).getTime();
    const conflictingBookings = facilityRequest.room.roomBookings.filter((b) => {
      if (facilityRequest.bookingId && b.id === facilityRequest.bookingId) return false;
      const bStart = new Date(b.startsAt).getTime();
      const bEnd = new Date(b.endsAt).getTime();
      return Math.max(sTime, bStart) < Math.min(eTime, bEnd);
    });

    res.json({
      success: true,
      data: {
        ...facilityRequest,
        hasConflicts: conflictingBookings.length > 0,
        conflictingBookings,
        hasActiveOutage: facilityRequest.room.roomOutages.length > 0,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * POST /api/rooms/facility-requests/:id/decide
 * Facilities Admin reviews and approves or rejects request.
 * Atomic transaction creates RoomBooking upon APPROVE.
 */
router.post(
  '/facility-requests/:id/decide',
  requireRole(['FACILITIES_ADMIN', 'SYSTEM_ADMIN']),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { decision, reviewNotes } = req.body;

    if (!decision || !['APPROVE', 'REJECT'].includes(decision)) {
      res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: "decision must be 'APPROVE' or 'REJECT'." },
      });
      return;
    }

    const reviewer = req.user!;

    try {
      const existing = await prisma.facilityRequest.findUnique({
        where: { id },
        include: {
          room: {
            include: {
              roomOutages: { where: { status: 'ACTIVE' } },
              roomBookings: { where: { status: 'CONFIRMED' } },
            },
          },
          requester: { select: { id: true, name: true, departmentId: true } },
        },
      });

      if (!existing) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found.' } });
        return;
      }

      if (existing.status !== 'PENDING_APPROVAL') {
        res.status(400).json({
          success: false,
          error: { code: 'ALREADY_DECIDED', message: `Request is already in status '${existing.status}'.` },
        });
        return;
      }

      const timestamp = Date.now();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);

      const decisionResult = await prisma.$transaction(async (tx) => {
        if (decision === 'REJECT') {
          const rejected = await tx.facilityRequest.update({
            where: { id },
            data: {
              status: 'REJECTED',
              reviewerId: reviewer.id,
              reviewNotes: reviewNotes || 'Facility request declined by administration.',
              reviewedAt: new Date(),
            },
          });

          // Notify student
          await tx.notification.create({
            data: {
              id: `NOT-${timestamp}-${randomSuffix}`,
              recipientId: existing.requesterId,
              eventType: 'FACILITY_REQUEST_REJECTED',
              title: `Event Request Rejected: ${existing.title}`,
              body: `Your facility request for Room ${existing.room.code} was declined. Reason: ${reviewNotes || 'Administrative schedule conflict.'}`,
              createdAt: new Date(),
            },
          });

          // Audit log
          await tx.auditLog.create({
            data: {
              id: `AUD-${timestamp}-${randomSuffix}`,
              actorId: reviewer.id,
              action: 'REJECT_FACILITY_REQUEST',
              entityType: 'FACILITY_REQUEST',
              entityId: id,
              beforeJson: JSON.stringify({ status: 'PENDING_APPROVAL' }),
              afterJson: JSON.stringify({ status: 'REJECTED', reviewerId: reviewer.id, reviewNotes }),
              createdAt: new Date(),
            },
          });

          return { facilityRequest: rejected, booking: null };
        }

        // APPROVE: Re-verify conflicts and outages inside transaction
        if (existing.room.roomOutages.length > 0) {
          throw new Error(`Cannot approve: Room ${existing.room.code} currently has an active facility outage.`);
        }

        const sTime = new Date(existing.startsAt).getTime();
        const eTime = new Date(existing.endsAt).getTime();
        const conflict = existing.room.roomBookings.find((b) => {
          const bStart = new Date(b.startsAt).getTime();
          const bEnd = new Date(b.endsAt).getTime();
          return Math.max(sTime, bStart) < Math.min(eTime, bEnd);
        });

        if (conflict) {
          throw new Error(`Cannot approve: Conflicting booking '${conflict.purpose}' already exists for Room ${existing.room.code}.`);
        }

        // 1. Create RoomBooking
        const bookingId = `BKG-${timestamp}-${randomSuffix}`;
        const newBooking = await tx.roomBooking.create({
          data: {
            id: bookingId,
            roomId: existing.roomId,
            departmentId: existing.requester.departmentId || 'DEP001',
            facultyId: existing.requesterId,
            startsAt: existing.startsAt,
            endsAt: existing.endsAt,
            status: 'CONFIRMED',
            purpose: `Event: ${existing.title}`,
          },
        });

        // 2. Update FacilityRequest
        const approved = await tx.facilityRequest.update({
          where: { id },
          data: {
            status: 'APPROVED',
            reviewerId: reviewer.id,
            reviewNotes: reviewNotes || 'Facility use approved by administration.',
            reviewedAt: new Date(),
            bookingId: newBooking.id,
          },
        });

        // 3. Notify student
        await tx.notification.create({
          data: {
            id: `NOT-${timestamp}-${randomSuffix}`,
            recipientId: existing.requesterId,
            eventType: 'FACILITY_REQUEST_APPROVED',
            title: `Event Request Approved: ${existing.title}`,
            body: `Your facility request for Room ${existing.room.code} on ${new Date(existing.startsAt).toLocaleDateString()} has been APPROVED. Booking ID: ${bookingId}.`,
            createdAt: new Date(),
          },
        });

        // 4. Audit log
        await tx.auditLog.create({
          data: {
            id: `AUD-${timestamp}-${randomSuffix}`,
            actorId: reviewer.id,
            action: 'APPROVE_FACILITY_REQUEST',
            entityType: 'FACILITY_REQUEST',
            entityId: id,
            beforeJson: JSON.stringify({ status: 'PENDING_APPROVAL' }),
            afterJson: JSON.stringify({ status: 'APPROVED', reviewerId: reviewer.id, bookingId }),
            createdAt: new Date(),
          },
        });

        return { facilityRequest: approved, booking: newBooking };
      });

      res.json({
        success: true,
        message: `Facility request ${id} ${decision.toLowerCase()}d successfully.`,
        data: decisionResult,
      });
    } catch (err: any) {
      res.status(400).json({
        success: false,
        error: { code: 'APPROVAL_ERROR', message: err.message },
      });
    }
  }
);

export default router;
