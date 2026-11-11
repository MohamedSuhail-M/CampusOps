import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import authRouter from './modules/auth/auth.routes';
import directoryRouter from './modules/directory/directory.routes';
import intakeRouter from './modules/intake/intake.routes';
import incidentsRouter from './modules/incidents/incidents.routes';
import workOrdersRouter from './modules/work_orders/work_orders.routes';
import roomsRouter from './modules/rooms/rooms.routes';
import inventoryRouter from './modules/inventory/inventory.routes';
import procurementRouter from './modules/procurement/procurement.routes';
import slaNotificationsRouter from './modules/sla_notifications/sla_notifications.routes';
import adminRouter from './modules/admin/admin.routes';
import { authenticate, requireRole } from './middleware/auth.middleware';

// Load environment variables from root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      origin === CLIENT_URL ||
      origin.includes('localhost') ||
      origin.endsWith('.vercel.app') ||
      origin.includes('127.0.0.1')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'CampusOps Core API is online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

// Authentication routes
app.use('/api/auth', authRouter);

// Directory routes
app.use('/api/directory', directoryRouter);

// Intake routes
app.use('/api/intake', intakeRouter);

// Incidents routes
app.use('/api/incidents', incidentsRouter);

// Work Order routes
app.use('/api/work-orders', workOrdersRouter);

// Room & Relocation routes
app.use('/api/rooms', roomsRouter);

// Inventory routes
app.use('/api/inventory', inventoryRouter);

// Procurement routes
app.use('/api/procurement', procurementRouter);

// SLA & Notifications routes
app.use('/api/sla', slaNotificationsRouter);

// Admin & Audit routes
app.use('/api/admin', adminRouter);

// RBAC Test endpoints
app.get('/api/test/student-only', authenticate, requireRole(['STUDENT']), (req, res) => {
  res.json({ success: true, message: 'Welcome student!', user: req.user?.name });
});

app.get('/api/test/admin-only', authenticate, requireRole(['SYSTEM_ADMIN']), (req, res) => {
  res.json({ success: true, message: 'Welcome admin!', user: req.user?.name });
});

if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[CampusOps Server] Listening on http://localhost:${PORT}`);
  });
}

export default app;
