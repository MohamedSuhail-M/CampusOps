import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../../prisma';
import { signSession } from './auth.utils';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

const loginSchema = z.object({
  loginId: z.string().min(1, 'Login ID is required'),
  password: z.string().min(1, 'Password is required'),
  requestedRole: z.string().optional(),
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message || 'Invalid input' },
    });
    return;
  }

  const { loginId, password, requestedRole } = result.data;

  try {
    const user = await prisma.user.findUnique({
      where: { loginId },
      include: {
        department: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid Login ID or password.' },
      });
      return;
    }

    // Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid Login ID or password.' },
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Your account is inactive. Please contact administration.' },
      });
      return;
    }

    const authorizedRoles = user.userRoles.map((ur) => ({
      id: ur.role.id,
      code: ur.role.code,
      name: ur.role.name,
    }));

    let activeRole: string;

    if (requestedRole) {
      const isRoleAllowed = authorizedRoles.some((r) => r.code === requestedRole);
      if (!isRoleAllowed) {
        res.status(403).json({
          success: false,
          error: {
            code: 'ROLE_NOT_AUTHORIZED',
            message: `User '${user.name}' is not authorized for the role '${requestedRole}'. Assigned roles: [${authorizedRoles.map(r => r.name).join(', ')}]`,
          },
        });
        return;
      }
      activeRole = requestedRole;
    } else {
      activeRole = authorizedRoles[0]?.code || 'STUDENT';
    }

    // Sign session token
    const token = signSession(user.id, user.loginId, activeRole);

    // Set secure HTTP-only cookie
    res.cookie('campusops_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 86400000, // 24 hours
      path: '/',
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          loginId: user.loginId,
          name: user.name,
          email: user.email,
          department: {
            id: user.department.id,
            name: user.department.name,
          },
          status: user.status,
          roles: authorizedRoles,
          activeRole,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to process login.', details: error.message },
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('campusops_session', { path: '/' });
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req: Request, res: Response) => {
  res.json({
    success: true,
    data: req.user,
  });
});

// POST /api/auth/active-role
router.post('/active-role', authenticate, (req: Request, res: Response) => {
  const { roleCode } = req.body;
  if (!roleCode || typeof roleCode !== 'string') {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: 'roleCode string is required.' },
    });
    return;
  }

  const user = req.user!;
  const isAuthorized = user.roles.some((r) => r.code === roleCode);

  if (!isAuthorized) {
    res.status(403).json({
      success: false,
      error: {
        code: 'ROLE_NOT_AUTHORIZED',
        message: `You are not authorized to switch to role '${roleCode}'.`,
      },
    });
    return;
  }

  const token = signSession(user.id, user.loginId, roleCode);

  res.cookie('campusops_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400000,
    path: '/',
  });

  res.json({
    success: true,
    data: {
      ...user,
      activeRole: roleCode,
    },
  });
});

// GET /api/auth/demo-users
router.get('/demo-users', async (req: Request, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      include: {
        userRoles: {
          include: {
            user: {
              include: { department: true },
            },
          },
          take: 2,
        },
      },
    });

    const demoUsers = roles.map((r) => ({
      roleCode: r.code,
      roleName: r.name,
      sampleUsers: r.userRoles.map((ur) => ({
        id: ur.user.id,
        loginId: ur.user.loginId,
        name: ur.user.name,
        department: ur.user.department.name,
      })),
    }));

    res.json({
      success: true,
      data: demoUsers,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve demo users.', details: error.message },
    });
  }
});

export default router;
