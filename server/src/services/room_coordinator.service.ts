import prisma from '../prisma';

export interface AlternativeRoomCandidate {
  roomId: string;
  roomCode: string;
  buildingCode: string;
  buildingName: string;
  capacity: number;
  roomType: string;
  isAvailable: boolean;
  meetsCapacity: boolean;
  meetsEquipment: boolean;
  timetableConflict: boolean;
  suitabilityScore: number;
  reason: string;
}

export async function detectRoomConflicts(roomId: string, targetDate?: Date) {
  const where: any = {
    roomId,
    status: 'CONFIRMED',
  };

  if (targetDate) {
    // Range for the entire target day
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    where.startsAt = { gte: startOfDay, lte: endOfDay };
  }

  return await prisma.roomBooking.findMany({
    where,
    include: {
      faculty: { select: { id: true, name: true, email: true } },
      department: true,
      requirements: true,
    },
    orderBy: { startsAt: 'asc' },
  });
}

export async function recommendAlternativeRooms(bookingId: string): Promise<{
  booking: any;
  recommendations: AlternativeRoomCandidate[];
}> {
  const booking = await prisma.roomBooking.findUnique({
    where: { id: bookingId },
    include: {
      room: { include: { building: true } },
      requirements: true,
      faculty: true,
      department: true,
    },
  });

  if (!booking) {
    throw new Error(`Booking '${bookingId}' not found.`);
  }

  // Parse required capacity and equipment
  const capacityReq = booking.requirements.find((r) => r.requirementType === 'CAPACITY');
  const requiredCapacity = capacityReq ? parseInt(capacityReq.value, 10) : 30;
  const requiresProjector = booking.requirements.some((r) => r.requirementType === 'PROJECTOR' && r.value.toUpperCase() === 'YES');
  const requiresAccessible = booking.requirements.some((r) => r.requirementType === 'ACCESSIBLE' && r.value.toUpperCase() === 'YES');
  const isExam = booking.purpose?.toLowerCase().includes('exam') || false;

  const bkgStart = new Date(booking.startsAt).getTime();
  const bkgEnd = new Date(booking.endsAt).getTime();

  // Query all candidate rooms
  const allRooms = await prisma.room.findMany({
    where: {
      status: 'ACTIVE',
      id: { not: booking.roomId }, // exclude current room
    },
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

  const candidates: AlternativeRoomCandidate[] = [];

  for (const rm of allRooms) {
    const hasOutage = rm.roomOutages.length > 0;
    const meetsCap = rm.capacity >= requiredCapacity;
    const meetsEquip = !hasOutage; // active room with functioning fixtures

    // Check timetable conflict
    const hasConflict = rm.roomBookings.some((b) => {
      const s = new Date(b.startsAt).getTime();
      const e = new Date(b.endsAt).getTime();
      return Math.max(s, bkgStart) < Math.min(e, bkgEnd);
    });

    let score = 0;
    let reason = '';

    if (hasOutage) {
      reason = 'Room currently under maintenance outage';
    } else if (hasConflict) {
      reason = 'Timetable conflict: Room booked for another session at this time';
    } else if (!meetsCap) {
      reason = `Insufficient capacity (${rm.capacity} seats, needed: ${requiredCapacity})`;
    } else {
      // Compliant candidate!
      score = 100 - (rm.capacity - requiredCapacity); // closer to required capacity is better
      if (booking.room?.buildingId && rm.buildingId === booking.room.buildingId) {
        score += 50; // Prioritize same-building classroom to minimize student transit
        // Same floor bonus (e.g. B-204 to B-206 on 2nd floor)
        const bookingFloor = booking.room.code.split('-')[1]?.[0];
        const candidateFloor = rm.code.split('-')[1]?.[0];
        if (bookingFloor && candidateFloor && bookingFloor === candidateFloor) {
          score += 60; // Immediate hallway relocation on same floor
        }
      }
      if (isExam && rm.roomType === 'SEMINAR') {
        score += 50; // Semester exams prioritize spacious seminar auditoriums
      }
      if (isExam && rm.capacity >= 80) {
        score += 30; // Examination spaced seating buffer
      }
      reason = `Excellent match: ${rm.capacity} seats, equipment ready, zero schedule conflicts`;
    }

    candidates.push({
      roomId: rm.id,
      roomCode: rm.code,
      buildingCode: rm.building.code,
      buildingName: rm.building.name,
      capacity: rm.capacity,
      roomType: rm.roomType,
      isAvailable: !hasOutage && !hasConflict && meetsCap,
      meetsCapacity: meetsCap,
      meetsEquipment: meetsEquip,
      timetableConflict: hasConflict,
      suitabilityScore: score,
      reason,
    });
  }

  // Sort available rooms first, then by score descending
  const sorted = candidates.sort((a, b) => {
    if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
    return b.suitabilityScore - a.suitabilityScore;
  });

  return {
    booking,
    recommendations: sorted,
  };
}
