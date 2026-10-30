import { Request, Response, NextFunction } from 'express';
import { verifySession } from '../modules/auth/auth.utils';
import prisma from '../prisma';

export interface AuthenticatedUser {
  id: string;
  loginId: string;
  name: string;
  email: string;
  departmentId: string;
  departmentName: string;
  status: string;
  roles: { id: string; code: string; name: string }[];
  activeRole: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      activeRole?: string;
    }
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.campusops_session;

  if (!token) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Please log in.' },
    });
    return;
  }

  const session = verifySession(token);
  if (!session) {
    res.clearCookie('campusops_session');
    res.status(401).json({
      success: false,
      error: { code: 'SESSION_EXPIRED', message: 'Session expired or invalid. Please log in again.' },
    });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        department: true,
        userRoles: {
          include: { role: true },
        },
      },
    });

    if (!user || user.status !== 'ACTIVE') {
      res.clearCookie('campusops_session');
      res.status(403).json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'User account is inactive or not found.' },
      });
      return;
    }

    const roles = user.userRoles.map((ur) => ({
      id: ur.role.id,
      code: ur.role.code,
      name: ur.role.name,
    }));

    // Verify active role is still valid for this user
    const hasActiveRole = roles.some((r) => r.code === session.activeRole);
    const activeRole = hasActiveRole ? session.activeRole : roles[0]?.code || 'STUDENT';

    req.user = {
      id: user.id,
      loginId: user.loginId,
      name: user.name,
      email: user.email,
      departmentId: user.departmentId,
      departmentName: user.department.name,
      status: user.status,
      roles,
      activeRole,
    };
    req.activeRole = activeRole;

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Authentication service error.', details: error.message },
    });
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.activeRole) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' },
      });
      return;
    }

    // Backend-enforced RBAC: verify that activeRole is allowed AND user actually has it
    const userRoleCodes = req.user.roles.map((r) => r.code);
    const isRoleAuthorized = userRoleCodes.includes(req.activeRole);
    const isRoleAllowedForAction = allowedRoles.includes(req.activeRole);

    if (!isRoleAuthorized || !isRoleAllowedForAction) {
      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Action requires one of: [${allowedRoles.join(', ')}]. Current active role: '${req.activeRole}'. Access denied.`,
        },
      });
      return;
    }

    next();
  };
}
