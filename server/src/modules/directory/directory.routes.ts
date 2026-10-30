import { Router, Request, Response } from 'express';
import prisma from '../../prisma';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Apply authentication to directory endpoints
router.use(authenticate);

// 1. GET /api/directory/departments
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: { id: true, name: true, email: true, loginId: true },
        },
        _count: {
          select: { users: true, roomBookings: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    res.json({
      success: true,
      data: departments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch departments.', details: error.message },
    });
  }
});

// 2. GET /api/directory/buildings
router.get('/buildings', async (req: Request, res: Response) => {
  try {
    const buildings = await prisma.building.findMany({
      include: {
        _count: {
          select: { rooms: true, incidents: true },
        },
      },
      orderBy: { code: 'asc' },
    });

    res.json({
      success: true,
      data: buildings,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch buildings.', details: error.message },
    });
  }
});

// 3. GET /api/directory/rooms
router.get('/rooms', async (req: Request, res: Response) => {
  const { buildingId, type, status } = req.query;

  try {
    const where: any = {};
    if (buildingId && typeof buildingId === 'string') where.buildingId = buildingId;
    if (type && typeof type === 'string') where.roomType = type;
    if (status && typeof status === 'string') where.status = status;

    const rooms = await prisma.room.findMany({
      where,
      include: {
        building: { select: { id: true, code: true, name: true } },
        _count: {
          select: { assets: true, roomBookings: true, roomOutages: true },
        },
      },
      orderBy: [{ buildingId: 'asc' }, { code: 'asc' }],
    });

    res.json({
      success: true,
      data: rooms,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch rooms.', details: error.message },
    });
  }
});

// 4. GET /api/directory/rooms/:id
router.get('/rooms/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        building: true,
        assets: true,
        roomOutages: {
          where: { status: 'ACTIVE' },
        },
        roomBookings: {
          take: 5,
          orderBy: { startsAt: 'desc' },
          include: {
            faculty: { select: { id: true, name: true } },
            requirements: true,
          },
        },
      },
    });

    if (!room) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `Room with ID '${id}' not found.` },
      });
      return;
    }

    res.json({
      success: true,
      data: room,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch room details.', details: error.message },
    });
  }
});

// 5. GET /api/directory/assets
router.get('/assets', async (req: Request, res: Response) => {
  const { roomId, type, status } = req.query;

  try {
    const where: any = {};
    if (roomId && typeof roomId === 'string') where.roomId = roomId;
    if (type && typeof type === 'string') where.type = type;
    if (status && typeof status === 'string') where.status = status;

    const assets = await prisma.asset.findMany({
      where,
      include: {
        room: {
          include: { building: true },
        },
      },
      orderBy: { assetTag: 'asc' },
    });

    res.json({
      success: true,
      data: assets,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch assets.', details: error.message },
    });
  }
});

// 6. GET /api/directory/assets/lookup?qr=:tag
router.get('/assets/lookup', async (req: Request, res: Response) => {
  const qrTag = req.query.qr;

  if (!qrTag || typeof qrTag !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'QR tag parameter (?qr=...) is required.' },
    });
    return;
  }

  let cleanTag = qrTag.trim();
  if (cleanTag.includes('/')) {
    const parts = cleanTag.split('/');
    cleanTag = parts[parts.length - 1];
  }
  if (cleanTag.includes('=')) {
    const parts = cleanTag.split('=');
    cleanTag = parts[parts.length - 1];
  }

  try {
    const asset = await prisma.asset.findFirst({
      where: {
        OR: [
          { assetTag: cleanTag },
          { id: cleanTag },
          { assetTag: { contains: cleanTag } },
          { id: { contains: cleanTag } },
        ],
      },
      include: {
        room: {
          include: { building: true },
        },
        maintenanceHistory: {
          take: 5,
          orderBy: { completedAt: 'desc' },
        },
        incidents: {
          where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
          select: { id: true, reference: true, title: true, priority: true, status: true },
        },
      },
    });

    if (!asset) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: `No asset found matching QR tag '${qrTag}'.` },
      });
      return;
    }

    res.json({
      success: true,
      data: asset,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to lookup asset by QR tag.', details: error.message },
    });
  }
});

// 7. GET /api/directory/users
router.get('/users', async (req: Request, res: Response) => {
  const { roleCode, departmentId } = req.query;

  try {
    const where: any = { status: 'ACTIVE' };
    if (departmentId && typeof departmentId === 'string') {
      where.departmentId = departmentId;
    }
    if (roleCode && typeof roleCode === 'string') {
      where.userRoles = {
        some: { role: { code: roleCode } },
      };
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        loginId: true,
        name: true,
        email: true,
        department: { select: { id: true, name: true } },
        userRoles: {
          select: { role: { select: { id: true, code: true, name: true } } },
        },
        technicianSkills: {
          select: { level: true, skill: { select: { id: true, name: true } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        loginId: u.loginId,
        name: u.name,
        email: u.email,
        department: u.department,
        roles: u.userRoles.map((ur) => ur.role),
        skills: u.technicianSkills.map((ts) => ({ skill: ts.skill.name, level: ts.level })),
      })),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch directory users.', details: error.message },
    });
  }
});

export default router;
