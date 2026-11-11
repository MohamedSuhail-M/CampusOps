import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

function resolveDatabaseUrl(): string {
  // If user provided a remote or explicit database URL (e.g. Postgres / Turso / remote SQLite)
  if (
    process.env.DATABASE_URL &&
    !process.env.DATABASE_URL.includes('./dev.db') &&
    !process.env.DATABASE_URL.includes('file:dev.db') &&
    !process.env.DATABASE_URL.endsWith('/dev.db')
  ) {
    return process.env.DATABASE_URL;
  }

  // If running in Vercel Serverless Function, file system is read-only except /tmp
  if (process.env.VERCEL) {
    const tmpDbPath = '/tmp/dev.db';
    const needCopy = !fs.existsSync(tmpDbPath) || fs.statSync(tmpDbPath).size < 10000;
    if (needCopy) {
      const candidates = [
        path.join(process.cwd(), 'prisma', 'dev.db'),
        path.join(process.cwd(), 'prisma', 'dev.db.backup'),
        '/var/task/prisma/dev.db',
        '/var/task/prisma/dev.db.backup',
        path.resolve(__dirname, '../../prisma/dev.db'),
        path.resolve(__dirname, '../../../prisma/dev.db'),
        path.resolve(__dirname, '../prisma/dev.db'),
        path.resolve(__dirname, 'prisma/dev.db'),
        path.resolve(__dirname, 'dev.db'),
        path.resolve(__dirname, 'dev.db.backup'),
      ];

      for (const p of candidates) {
        if (fs.existsSync(p)) {
          try {
            const stat = fs.statSync(p);
            if (stat.size > 10000) {
              fs.copyFileSync(p, tmpDbPath);
              console.log(`[CampusOps] Successfully copied SQLite database to ${tmpDbPath} from ${p} (${stat.size} bytes)`);
              break;
            }
          } catch (err) {
            console.error(`[CampusOps] Error copying database from ${p}:`, err);
          }
        }
      }
    }
    return 'file:/tmp/dev.db';
  }

  return process.env.DATABASE_URL || 'file:./dev.db';
}

const resolvedDbUrl = resolveDatabaseUrl();
process.env.DATABASE_URL = resolvedDbUrl;

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: resolvedDbUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
