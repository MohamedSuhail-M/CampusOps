import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import xlsx from 'xlsx';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const prisma = new PrismaClient();

const WORKBOOK_PATH = path.resolve(__dirname, '../../data/source/CampusOps_Complete_Fictional_Database_Dataset.xlsx');
const REPORTS_DIR = path.resolve(__dirname, '../../data/import-reports');

interface ImportStats {
  table: string;
  totalRows: number;
  inserted: number;
  updated: number;
  unchanged: number;
  rejected: number;
  errors: string[];
}

function parseDate(val: any): Date | null {
  if (!val) return null;
  const d = new Date(val);
  if (isNaN(d.getTime())) {
    return null;
  }
  return d;
}

function parseRequiredDate(val: any, fallbackStr: string = '2026-11-01T00:00:00'): Date {
  const d = parseDate(val);
  if (!d) return new Date(fallbackStr);
  return d;
}

async function main() {
  console.log('=================================================================');
  console.log('       CAMPUSOPS — REPEATABLE EXCEL DATABASE IMPORTER            ');
  console.log('=================================================================');

  if (!fs.existsSync(WORKBOOK_PATH)) {
    throw new Error(`Workbook not found at: ${WORKBOOK_PATH}`);
  }

  const demoPassword = process.env.DEMO_PASSWORD || 'password123';
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  console.log(`[Auth Setup] Generating bcrypt hash for demo password (cost factor: ${saltRounds})...`);
  const hashedDemoPassword = await bcrypt.hash(demoPassword, saltRounds);
  console.log(`[Auth Setup] Demo password hashed successfully.`);

  const wb = xlsx.readFile(WORKBOOK_PATH, { cellDates: true });
  console.log(`[Workbook] Successfully read 35 sheets from source workbook.`);

  function getSheetData(name: string): any[] {
    const sheet = wb.Sheets[name];
    if (!sheet) {
      console.warn(`[Warning] Sheet ${name} not found in workbook.`);
      return [];
    }
    return xlsx.utils.sheet_to_json(sheet, { raw: false, defval: null });
  }

  const report: Record<string, ImportStats> = {};

  function initStats(table: string, count: number): ImportStats {
    const s: ImportStats = {
      table,
      totalRows: count,
      inserted: 0,
      updated: 0,
      unchanged: 0,
      rejected: 0,
      errors: [],
    };
    report[table] = s;
    return s;
  }

  // -------------------------------------------------------------
  // LEVEL 0: INDEPENDENT MASTER DATA
  // -------------------------------------------------------------
  console.log('\n--- Importing Level 0: Master Lookup Data ---');

  // 1. Roles
  const rolesData = getSheetData('roles');
  const roleStats = initStats('roles', rolesData.length);
  for (const r of rolesData) {
    try {
      await prisma.role.upsert({
        where: { id: String(r.id) },
        update: { code: String(r.code), name: String(r.name) },
        create: { id: String(r.id), code: String(r.code), name: String(r.name) },
      });
      roleStats.inserted++;
    } catch (e: any) {
      roleStats.rejected++;
      roleStats.errors.push(`Role ${r.id}: ${e.message}`);
    }
  }

  // 2. Buildings
  const buildingsData = getSheetData('buildings');
  const bldStats = initStats('buildings', buildingsData.length);
  for (const b of buildingsData) {
    try {
      await prisma.building.upsert({
        where: { id: String(b.id) },
        update: { code: String(b.code), name: String(b.name), floors: Number(b.floors), status: String(b.status || 'ACTIVE') },
        create: { id: String(b.id), code: String(b.code), name: String(b.name), floors: Number(b.floors), status: String(b.status || 'ACTIVE') },
      });
      bldStats.inserted++;
    } catch (e: any) {
      bldStats.rejected++;
      bldStats.errors.push(`Building ${b.id}: ${e.message}`);
    }
  }

  // 3. Skills
  const skillsData = getSheetData('skills');
  const skillStats = initStats('skills', skillsData.length);
  for (const s of skillsData) {
    try {
      await prisma.skill.upsert({
        where: { id: String(s.id) },
        update: { name: String(s.name) },
        create: { id: String(s.id), name: String(s.name) },
      });
      skillStats.inserted++;
    } catch (e: any) {
      skillStats.rejected++;
      skillStats.errors.push(`Skill ${s.id}: ${e.message}`);
    }
  }

  // 4. Inventory Items
  const itemsData = getSheetData('inventory_items');
  const itemStats = initStats('inventory_items', itemsData.length);
  for (const itm of itemsData) {
    try {
      await prisma.inventoryItem.upsert({
        where: { id: String(itm.id) },
        update: {
          sku: String(itm.sku),
          name: String(itm.name),
          unit: String(itm.unit),
          quantityOnHand: Number(itm.quantity_on_hand),
          reorderLevel: Number(itm.reorder_level),
        },
        create: {
          id: String(itm.id),
          sku: String(itm.sku),
          name: String(itm.name),
          unit: String(itm.unit),
          quantityOnHand: Number(itm.quantity_on_hand),
          reorderLevel: Number(itm.reorder_level),
        },
      });
      itemStats.inserted++;
    } catch (e: any) {
      itemStats.rejected++;
      itemStats.errors.push(`Item ${itm.id}: ${e.message}`);
    }
  }

  // 5. SLA Policies
  const slaData = getSheetData('sla_policies');
  const slaStats = initStats('sla_policies', slaData.length);
  for (const sla of slaData) {
    try {
      await prisma.slaPolicy.upsert({
        where: { id: String(sla.id) },
        update: {
          priority: String(sla.priority),
          responseMinutes: Number(sla.response_minutes),
          resolutionMinutes: Number(sla.resolution_minutes),
        },
        create: {
          id: String(sla.id),
          priority: String(sla.priority),
          responseMinutes: Number(sla.response_minutes),
          resolutionMinutes: Number(sla.resolution_minutes),
        },
      });
      slaStats.inserted++;
    } catch (e: any) {
      slaStats.rejected++;
      slaStats.errors.push(`SLA ${sla.id}: ${e.message}`);
    }
  }

  // 6. Idempotency Keys
  const idemData = getSheetData('idempotency_keys');
  const idemStats = initStats('idempotency_keys', idemData.length);
  for (const idk of idemData) {
    try {
      await prisma.idempotencyKey.upsert({
        where: { key: String(idk.key) },
        update: {
          operation: String(idk.operation),
          requestHash: String(idk.request_hash),
          resultJson: String(idk.result_json),
          createdAt: parseRequiredDate(idk.created_at),
        },
        create: {
          key: String(idk.key),
          operation: String(idk.operation),
          requestHash: String(idk.request_hash),
          resultJson: String(idk.result_json),
          createdAt: parseRequiredDate(idk.created_at),
        },
      });
      idemStats.inserted++;
    } catch (e: any) {
      idemStats.rejected++;
      idemStats.errors.push(`IdemKey ${idk.key}: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // LEVEL 1: DIRECTORY CORE (RESOLVING CIRCULAR DEPARTMENTS <-> USERS)
  // -------------------------------------------------------------
  console.log('\n--- Importing Level 1: Directory Core ---');

  // Step 1a: Insert departments with managerId = null
  const deptsData = getSheetData('departments');
  const deptStats = initStats('departments', deptsData.length);
  for (const d of deptsData) {
    try {
      await prisma.department.upsert({
        where: { id: String(d.id) },
        update: { name: String(d.name) },
        create: { id: String(d.id), name: String(d.name), managerId: null },
      });
      deptStats.inserted++;
    } catch (e: any) {
      deptStats.rejected++;
      deptStats.errors.push(`Dept pass 1 ${d.id}: ${e.message}`);
    }
  }

  // Step 1b: Rooms
  const roomsData = getSheetData('rooms');
  const roomStats = initStats('rooms', roomsData.length);
  for (const rm of roomsData) {
    try {
      await prisma.room.upsert({
        where: { id: String(rm.id) },
        update: {
          buildingId: String(rm.building_id),
          code: String(rm.code),
          capacity: Number(rm.capacity),
          roomType: String(rm.room_type),
          status: String(rm.status || 'ACTIVE'),
        },
        create: {
          id: String(rm.id),
          buildingId: String(rm.building_id),
          code: String(rm.code),
          capacity: Number(rm.capacity),
          roomType: String(rm.room_type),
          status: String(rm.status || 'ACTIVE'),
        },
      });
      roomStats.inserted++;
    } catch (e: any) {
      roomStats.rejected++;
      roomStats.errors.push(`Room ${rm.id}: ${e.message}`);
    }
  }

  // Step 1c: Users (with hashed demo password)
  const usersData = getSheetData('users');
  const userStats = initStats('users', usersData.length);
  for (const u of usersData) {
    try {
      await prisma.user.upsert({
        where: { id: String(u.id) },
        update: {
          loginId: String(u.login_id),
          passwordHash: hashedDemoPassword,
          name: String(u.name),
          email: String(u.email),
          departmentId: String(u.department_id),
          status: String(u.status || 'ACTIVE'),
        },
        create: {
          id: String(u.id),
          loginId: String(u.login_id),
          passwordHash: hashedDemoPassword,
          name: String(u.name),
          email: String(u.email),
          departmentId: String(u.department_id),
          status: String(u.status || 'ACTIVE'),
        },
      });
      userStats.inserted++;
    } catch (e: any) {
      userStats.rejected++;
      userStats.errors.push(`User ${u.id}: ${e.message}`);
    }
  }

  // Step 1d: Update departments with managerId
  for (const d of deptsData) {
    if (d.manager_id) {
      try {
        await prisma.department.update({
          where: { id: String(d.id) },
          data: { managerId: String(d.manager_id) },
        });
      } catch (e: any) {
        deptStats.errors.push(`Dept pass 2 update manager for ${d.id}: ${e.message}`);
      }
    }
  }

  // -------------------------------------------------------------
  // LEVEL 2: STAFF, BOOKINGS & MESSAGES
  // -------------------------------------------------------------
  console.log('\n--- Importing Level 2: Staff, Bookings, & Messages ---');

  // User Roles
  const userRolesData = getSheetData('user_roles');
  const urStats = initStats('user_roles', userRolesData.length);
  for (const ur of userRolesData) {
    try {
      await prisma.userRole.upsert({
        where: { userId_roleId: { userId: String(ur.user_id), roleId: String(ur.role_id) } },
        update: { assignedBy: ur.assigned_by ? String(ur.assigned_by) : null },
        create: {
          userId: String(ur.user_id),
          roleId: String(ur.role_id),
          assignedBy: ur.assigned_by ? String(ur.assigned_by) : null,
        },
      });
      urStats.inserted++;
    } catch (e: any) {
      urStats.rejected++;
      urStats.errors.push(`UserRole ${ur.user_id}-${ur.role_id}: ${e.message}`);
    }
  }

  // Assets
  const assetsData = getSheetData('assets');
  const astStats = initStats('assets', assetsData.length);
  for (const a of assetsData) {
    try {
      await prisma.asset.upsert({
        where: { id: String(a.id) },
        update: {
          assetTag: String(a.asset_tag),
          roomId: String(a.room_id),
          type: String(a.type),
          status: String(a.status || 'ACTIVE'),
          installedAt: parseRequiredDate(a.installed_at),
        },
        create: {
          id: String(a.id),
          assetTag: String(a.asset_tag),
          roomId: String(a.room_id),
          type: String(a.type),
          status: String(a.status || 'ACTIVE'),
          installedAt: parseRequiredDate(a.installed_at),
        },
      });
      astStats.inserted++;
    } catch (e: any) {
      astStats.rejected++;
      astStats.errors.push(`Asset ${a.id}: ${e.message}`);
    }
  }

  // Technician Skills
  const techSkillsData = getSheetData('technician_skills');
  const tsStats = initStats('technician_skills', techSkillsData.length);
  for (const ts of techSkillsData) {
    try {
      await prisma.technicianSkill.upsert({
        where: { userId_skillId: { userId: String(ts.user_id), skillId: String(ts.skill_id) } },
        update: { level: Number(ts.level) },
        create: { userId: String(ts.user_id), skillId: String(ts.skill_id), level: Number(ts.level) },
      });
      tsStats.inserted++;
    } catch (e: any) {
      tsStats.rejected++;
      tsStats.errors.push(`TechSkill ${ts.user_id}-${ts.skill_id}: ${e.message}`);
    }
  }

  // Staff Shifts
  const shiftsData = getSheetData('staff_shifts');
  const shiftStats = initStats('staff_shifts', shiftsData.length);
  for (const sh of shiftsData) {
    try {
      await prisma.staffShift.upsert({
        where: { id: String(sh.id) },
        update: {
          userId: String(sh.user_id),
          startsAt: parseRequiredDate(sh.starts_at),
          endsAt: parseRequiredDate(sh.ends_at),
        },
        create: {
          id: String(sh.id),
          userId: String(sh.user_id),
          startsAt: parseRequiredDate(sh.starts_at),
          endsAt: parseRequiredDate(sh.ends_at),
        },
      });
      shiftStats.inserted++;
    } catch (e: any) {
      shiftStats.rejected++;
      shiftStats.errors.push(`Shift ${sh.id}: ${e.message}`);
    }
  }

  // Staff Leave
  const leaveData = getSheetData('staff_leave');
  const leaveStats = initStats('staff_leave', leaveData.length);
  for (const lv of leaveData) {
    try {
      await prisma.staffLeave.upsert({
        where: { id: String(lv.id) },
        update: {
          userId: String(lv.user_id),
          startsAt: parseRequiredDate(lv.starts_at),
          endsAt: parseRequiredDate(lv.ends_at),
          status: String(lv.status),
        },
        create: {
          id: String(lv.id),
          userId: String(lv.user_id),
          startsAt: parseRequiredDate(lv.starts_at),
          endsAt: parseRequiredDate(lv.ends_at),
          status: String(lv.status),
        },
      });
      leaveStats.inserted++;
    } catch (e: any) {
      leaveStats.rejected++;
      leaveStats.errors.push(`Leave ${lv.id}: ${e.message}`);
    }
  }

  // Room Bookings
  const bookingsData = getSheetData('room_bookings');
  const bkgStats = initStats('room_bookings', bookingsData.length);
  for (const bkg of bookingsData) {
    try {
      await prisma.roomBooking.upsert({
        where: { id: String(bkg.id) },
        update: {
          roomId: String(bkg.room_id),
          departmentId: String(bkg.department_id),
          facultyId: String(bkg.faculty_id),
          startsAt: parseRequiredDate(bkg.starts_at),
          endsAt: parseRequiredDate(bkg.ends_at),
          status: String(bkg.status),
          purpose: String(bkg.purpose),
        },
        create: {
          id: String(bkg.id),
          roomId: String(bkg.room_id),
          departmentId: String(bkg.department_id),
          facultyId: String(bkg.faculty_id),
          startsAt: parseRequiredDate(bkg.starts_at),
          endsAt: parseRequiredDate(bkg.ends_at),
          status: String(bkg.status),
          purpose: String(bkg.purpose),
        },
      });
      bkgStats.inserted++;
    } catch (e: any) {
      bkgStats.rejected++;
      bkgStats.errors.push(`Booking ${bkg.id}: ${e.message}`);
    }
  }

  // Intake Messages
  const msgData = getSheetData('intake_messages');
  const msgStats = initStats('intake_messages', msgData.length);
  for (const m of msgData) {
    try {
      await prisma.intakeMessage.upsert({
        where: { id: String(m.id) },
        update: {
          channel: String(m.channel),
          originalText: String(m.original_text),
          language: String(m.language || 'en'),
          reporterId: m.reporter_id ? String(m.reporter_id) : null,
          externalMessageId: m.external_message_id ? String(m.external_message_id) : null,
          receivedAt: parseRequiredDate(m.received_at),
        },
        create: {
          id: String(m.id),
          channel: String(m.channel),
          originalText: String(m.original_text),
          language: String(m.language || 'en'),
          reporterId: m.reporter_id ? String(m.reporter_id) : null,
          externalMessageId: m.external_message_id ? String(m.external_message_id) : null,
          receivedAt: parseRequiredDate(m.received_at),
        },
      });
      msgStats.inserted++;
    } catch (e: any) {
      msgStats.rejected++;
      msgStats.errors.push(`Message ${m.id}: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // LEVEL 3: REQUIREMENTS & INCIDENTS
  // -------------------------------------------------------------
  console.log('\n--- Importing Level 3: Requirements & Incidents ---');

  // Room Requirements
  const reqData = getSheetData('room_requirements');
  const reqStats = initStats('room_requirements', reqData.length);
  for (const req of reqData) {
    try {
      await prisma.roomRequirement.upsert({
        where: {
          bookingId_requirementType: {
            bookingId: String(req.booking_id),
            requirementType: String(req.requirement_type),
          },
        },
        update: { value: String(req.value) },
        create: {
          bookingId: String(req.booking_id),
          requirementType: String(req.requirement_type),
          value: String(req.value),
        },
      });
      reqStats.inserted++;
    } catch (e: any) {
      reqStats.rejected++;
      reqStats.errors.push(`Requirement ${req.booking_id}-${req.requirement_type}: ${e.message}`);
    }
  }

  // Incidents
  const incData = getSheetData('incidents');
  const incStats = initStats('incidents', incData.length);
  for (const inc of incData) {
    try {
      await prisma.incident.upsert({
        where: { id: String(inc.id) },
        update: {
          reference: String(inc.reference),
          title: String(inc.title),
          category: String(inc.category),
          priority: String(inc.priority),
          status: String(inc.status),
          buildingId: inc.building_id ? String(inc.building_id) : null,
          roomId: inc.room_id ? String(inc.room_id) : null,
          assetId: inc.asset_id ? String(inc.asset_id) : null,
          createdAt: parseRequiredDate(inc.created_at),
        },
        create: {
          id: String(inc.id),
          reference: String(inc.reference),
          title: String(inc.title),
          category: String(inc.category),
          priority: String(inc.priority),
          status: String(inc.status),
          buildingId: inc.building_id ? String(inc.building_id) : null,
          roomId: inc.room_id ? String(inc.room_id) : null,
          assetId: inc.asset_id ? String(inc.asset_id) : null,
          createdAt: parseRequiredDate(inc.created_at),
        },
      });
      incStats.inserted++;
    } catch (e: any) {
      incStats.rejected++;
      incStats.errors.push(`Incident ${inc.id}: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // LEVEL 4: OUTAGES, REPORTS, LINKS, IMPACTS & WORK ORDERS
  // -------------------------------------------------------------
  console.log('\n--- Importing Level 4: Outages, Links & Work Orders ---');

  // Room Outages
  const outData = getSheetData('room_outages');
  const outStats = initStats('room_outages', outData.length);
  for (const out of outData) {
    try {
      await prisma.roomOutage.upsert({
        where: { id: String(out.id) },
        update: {
          roomId: String(out.room_id),
          incidentId: out.incident_id ? String(out.incident_id) : null,
          startsAt: parseRequiredDate(out.starts_at),
          endsAt: parseDate(out.ends_at),
          status: String(out.status),
        },
        create: {
          id: String(out.id),
          roomId: String(out.room_id),
          incidentId: out.incident_id ? String(out.incident_id) : null,
          startsAt: parseRequiredDate(out.starts_at),
          endsAt: parseDate(out.ends_at),
          status: String(out.status),
        },
      });
      outStats.inserted++;
    } catch (e: any) {
      outStats.rejected++;
      outStats.errors.push(`Outage ${out.id}: ${e.message}`);
    }
  }

  // Incident Reports
  const incRepData = getSheetData('incident_reports');
  const incRepStats = initStats('incident_reports', incRepData.length);
  for (const rep of incRepData) {
    try {
      await prisma.incidentReport.upsert({
        where: {
          incidentId_intakeMessageId: {
            incidentId: String(rep.incident_id),
            intakeMessageId: String(rep.intake_message_id),
          },
        },
        update: { relationshipType: String(rep.relationship_type || 'PRIMARY') },
        create: {
          incidentId: String(rep.incident_id),
          intakeMessageId: String(rep.intake_message_id),
          relationshipType: String(rep.relationship_type || 'PRIMARY'),
        },
      });
      incRepStats.inserted++;
    } catch (e: any) {
      incRepStats.rejected++;
      incRepStats.errors.push(`IncidentReport ${rep.incident_id}-${rep.intake_message_id}: ${e.message}`);
    }
  }

  // Incident Links
  const linkData = getSheetData('incident_links');
  const linkStats = initStats('incident_links', linkData.length);
  for (const lnk of linkData) {
    try {
      await prisma.incidentLink.upsert({
        where: { id: String(lnk.id) },
        update: {
          sourceIncidentId: String(lnk.source_incident_id),
          targetIncidentId: String(lnk.target_incident_id),
          relation: String(lnk.relation),
          confidence: Number(lnk.confidence || 1.0),
          reviewStatus: String(lnk.review_status || 'PENDING'),
        },
        create: {
          id: String(lnk.id),
          sourceIncidentId: String(lnk.source_incident_id),
          targetIncidentId: String(lnk.target_incident_id),
          relation: String(lnk.relation),
          confidence: Number(lnk.confidence || 1.0),
          reviewStatus: String(lnk.review_status || 'PENDING'),
        },
      });
      linkStats.inserted++;
    } catch (e: any) {
      linkStats.rejected++;
      linkStats.errors.push(`IncidentLink ${lnk.id}: ${e.message}`);
    }
  }

  // Incident Impacts
  const impData = getSheetData('incident_impacts');
  const impStats = initStats('incident_impacts', impData.length);
  for (const imp of impData) {
    try {
      await prisma.incidentImpact.upsert({
        where: { id: String(imp.id) },
        update: {
          incidentId: String(imp.incident_id),
          targetType: String(imp.target_type),
          targetId: String(imp.target_id),
          impactType: String(imp.impact_type),
          status: String(imp.status || 'ACTIVE'),
        },
        create: {
          id: String(imp.id),
          incidentId: String(imp.incident_id),
          targetType: String(imp.target_type),
          targetId: String(imp.target_id),
          impactType: String(imp.impact_type),
          status: String(imp.status || 'ACTIVE'),
        },
      });
      impStats.inserted++;
    } catch (e: any) {
      impStats.rejected++;
      impStats.errors.push(`IncidentImpact ${imp.id}: ${e.message}`);
    }
  }

  // Work Orders
  const woData = getSheetData('work_orders');
  const woStats = initStats('work_orders', woData.length);
  for (const wo of woData) {
    try {
      await prisma.workOrder.upsert({
        where: { id: String(wo.id) },
        update: {
          incidentId: String(wo.incident_id),
          assignedTo: wo.assigned_to ? String(wo.assigned_to) : null,
          status: String(wo.status),
          requiredSkillId: wo.required_skill_id ? String(wo.required_skill_id) : null,
          dueAt: parseDate(wo.due_at),
          blockedReason: wo.blocked_reason ? String(wo.blocked_reason) : null,
        },
        create: {
          id: String(wo.id),
          incidentId: String(wo.incident_id),
          assignedTo: wo.assigned_to ? String(wo.assigned_to) : null,
          status: String(wo.status),
          requiredSkillId: wo.required_skill_id ? String(wo.required_skill_id) : null,
          dueAt: parseDate(wo.due_at),
          blockedReason: wo.blocked_reason ? String(wo.blocked_reason) : null,
        },
      });
      woStats.inserted++;
    } catch (e: any) {
      woStats.rejected++;
      woStats.errors.push(`WorkOrder ${wo.id}: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // LEVEL 5: WORK EVENTS, MAINTENANCE, RESERVATIONS, PURCHASE REQUESTS
  // -------------------------------------------------------------
  console.log('\n--- Importing Level 5: Events, Spares & Purchase Requests ---');

  // Work Order Events
  const woeData = getSheetData('work_order_events');
  const woeStats = initStats('work_order_events', woeData.length);
  for (const woe of woeData) {
    try {
      await prisma.workOrderEvent.upsert({
        where: { id: String(woe.id) },
        update: {
          workOrderId: String(woe.work_order_id),
          actorId: woe.actor_id ? String(woe.actor_id) : null,
          eventType: String(woe.event_type),
          details: woe.details ? String(woe.details) : null,
          createdAt: parseRequiredDate(woe.created_at),
        },
        create: {
          id: String(woe.id),
          workOrderId: String(woe.work_order_id),
          actorId: woe.actor_id ? String(woe.actor_id) : null,
          eventType: String(woe.event_type),
          details: woe.details ? String(woe.details) : null,
          createdAt: parseRequiredDate(woe.created_at),
        },
      });
      woeStats.inserted++;
    } catch (e: any) {
      woeStats.rejected++;
      woeStats.errors.push(`WorkOrderEvent ${woe.id}: ${e.message}`);
    }
  }

  // Maintenance History
  const mntData = getSheetData('maintenance_history');
  const mntStats = initStats('maintenance_history', mntData.length);
  for (const m of mntData) {
    try {
      await prisma.maintenanceHistory.upsert({
        where: { id: String(m.id) },
        update: {
          assetId: String(m.asset_id),
          workOrderId: m.work_order_id ? String(m.work_order_id) : null,
          faultType: String(m.fault_type),
          resolution: String(m.resolution),
          completedAt: parseRequiredDate(m.completed_at),
        },
        create: {
          id: String(m.id),
          assetId: String(m.asset_id),
          workOrderId: m.work_order_id ? String(m.work_order_id) : null,
          faultType: String(m.fault_type),
          resolution: String(m.resolution),
          completedAt: parseRequiredDate(m.completed_at),
        },
      });
      mntStats.inserted++;
    } catch (e: any) {
      mntStats.rejected++;
      mntStats.errors.push(`MaintenanceHistory ${m.id}: ${e.message}`);
    }
  }

  // Stock Reservations
  const rsvData = getSheetData('stock_reservations');
  const rsvStats = initStats('stock_reservations', rsvData.length);
  for (const r of rsvData) {
    try {
      await prisma.stockReservation.upsert({
        where: { id: String(r.id) },
        update: {
          itemId: String(r.item_id),
          workOrderId: String(r.work_order_id),
          quantity: Number(r.quantity),
          status: String(r.status || 'ACTIVE'),
        },
        create: {
          id: String(r.id),
          itemId: String(r.item_id),
          workOrderId: String(r.work_order_id),
          quantity: Number(r.quantity),
          status: String(r.status || 'ACTIVE'),
        },
      });
      rsvStats.inserted++;
    } catch (e: any) {
      rsvStats.rejected++;
      rsvStats.errors.push(`StockReservation ${r.id}: ${e.message}`);
    }
  }

  // Purchase Requests
  const prData = getSheetData('purchase_requests');
  const prStats = initStats('purchase_requests', prData.length);
  for (const pr of prData) {
    try {
      await prisma.purchaseRequest.upsert({
        where: { id: String(pr.id) },
        update: {
          requesterId: String(pr.requester_id),
          workOrderId: pr.work_order_id ? String(pr.work_order_id) : null,
          status: String(pr.status || 'PENDING_APPROVAL'),
          estimatedTotal: pr.estimated_total ? Number(pr.estimated_total) : null,
          reason: String(pr.reason),
        },
        create: {
          id: String(pr.id),
          requesterId: String(pr.requester_id),
          workOrderId: pr.work_order_id ? String(pr.work_order_id) : null,
          status: String(pr.status || 'PENDING_APPROVAL'),
          estimatedTotal: pr.estimated_total ? Number(pr.estimated_total) : null,
          reason: String(pr.reason),
        },
      });
      prStats.inserted++;
    } catch (e: any) {
      prStats.rejected++;
      prStats.errors.push(`PurchaseRequest ${pr.id}: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // LEVEL 6: PROCUREMENT DETAILS & LEDGER MOVEMENTS
  // -------------------------------------------------------------
  console.log('\n--- Importing Level 6: Procurement Lines & Stock Ledger ---');

  // Stock Movements
  const movData = getSheetData('stock_movements');
  const movStats = initStats('stock_movements', movData.length);
  for (const mov of movData) {
    try {
      await prisma.stockMovement.upsert({
        where: { id: String(mov.id) },
        update: {
          itemId: String(mov.item_id),
          quantityDelta: Number(mov.quantity_delta),
          reason: String(mov.reason),
          referenceId: mov.reference_id ? String(mov.reference_id) : null,
          createdAt: parseRequiredDate(mov.created_at),
        },
        create: {
          id: String(mov.id),
          itemId: String(mov.item_id),
          quantityDelta: Number(mov.quantity_delta),
          reason: String(mov.reason),
          referenceId: mov.reference_id ? String(mov.reference_id) : null,
          createdAt: parseRequiredDate(mov.created_at),
        },
      });
      movStats.inserted++;
    } catch (e: any) {
      movStats.rejected++;
      movStats.errors.push(`StockMovement ${mov.id}: ${e.message}`);
    }
  }

  // Purchase Request Lines
  const prlData = getSheetData('purchase_request_lines');
  const prlStats = initStats('purchase_request_lines', prlData.length);
  for (const prl of prlData) {
    try {
      await prisma.purchaseRequestLine.upsert({
        where: { id: String(prl.id) },
        update: {
          requestId: String(prl.request_id),
          itemId: String(prl.item_id),
          quantity: Number(prl.quantity),
          estimatedUnitCost: prl.estimated_unit_cost ? Number(prl.estimated_unit_cost) : null,
        },
        create: {
          id: String(prl.id),
          requestId: String(prl.request_id),
          itemId: String(prl.item_id),
          quantity: Number(prl.quantity),
          estimatedUnitCost: prl.estimated_unit_cost ? Number(prl.estimated_unit_cost) : null,
        },
      });
      prlStats.inserted++;
    } catch (e: any) {
      prlStats.rejected++;
      prlStats.errors.push(`PurchaseRequestLine ${prl.id}: ${e.message}`);
    }
  }

  // Approval Decisions
  const appData = getSheetData('approval_decisions');
  const appStats = initStats('approval_decisions', appData.length);
  for (const ap of appData) {
    try {
      await prisma.approvalDecision.upsert({
        where: { id: String(ap.id) },
        update: {
          requestId: String(ap.request_id),
          approverId: String(ap.approver_id),
          decision: String(ap.decision),
          comment: ap.comment ? String(ap.comment) : null,
          decidedAt: parseRequiredDate(ap.decided_at),
        },
        create: {
          id: String(ap.id),
          requestId: String(ap.request_id),
          approverId: String(ap.approver_id),
          decision: String(ap.decision),
          comment: ap.comment ? String(ap.comment) : null,
          decidedAt: parseRequiredDate(ap.decided_at),
        },
      });
      appStats.inserted++;
    } catch (e: any) {
      appStats.rejected++;
      appStats.errors.push(`ApprovalDecision ${ap.id}: ${e.message}`);
    }
  }

  // Stock Receipts
  const recData = getSheetData('stock_receipts');
  const recStats = initStats('stock_receipts', recData.length);
  for (const rc of recData) {
    try {
      await prisma.stockReceipt.upsert({
        where: { id: String(rc.id) },
        update: {
          purchaseRequestId: String(rc.purchase_request_id),
          itemId: String(rc.item_id),
          quantityReceived: Number(rc.quantity_received),
          receivedBy: String(rc.received_by),
          receivedAt: parseRequiredDate(rc.received_at),
          condition: String(rc.condition || 'ACCEPTED'),
        },
        create: {
          id: String(rc.id),
          purchaseRequestId: String(rc.purchase_request_id),
          itemId: String(rc.item_id),
          quantityReceived: Number(rc.quantity_received),
          receivedBy: String(rc.received_by),
          receivedAt: parseRequiredDate(rc.received_at),
          condition: String(rc.condition || 'ACCEPTED'),
        },
      });
      recStats.inserted++;
    } catch (e: any) {
      recStats.rejected++;
      recStats.errors.push(`StockReceipt ${rc.id}: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // LEVEL 7: OPERATIONS, NOTIFICATIONS & AUDIT TRAIL
  // -------------------------------------------------------------
  console.log('\n--- Importing Level 7: Notifications, Outbox & Audit Logs ---');

  // Notifications
  const notData = getSheetData('notifications');
  const notStats = initStats('notifications', notData.length);
  for (const n of notData) {
    try {
      await prisma.notification.upsert({
        where: { id: String(n.id) },
        update: {
          recipientId: String(n.recipient_id),
          eventType: String(n.event_type),
          title: String(n.title),
          body: String(n.body),
          readAt: parseDate(n.read_at),
          createdAt: new Date('2026-11-03T09:20:00'),
        },
        create: {
          id: String(n.id),
          recipientId: String(n.recipient_id),
          eventType: String(n.event_type),
          title: String(n.title),
          body: String(n.body),
          readAt: parseDate(n.read_at),
          createdAt: new Date('2026-11-03T09:20:00'),
        },
      });
      notStats.inserted++;
    } catch (e: any) {
      notStats.rejected++;
      notStats.errors.push(`Notification ${n.id}: ${e.message}`);
    }
  }

  // Outbox Events
  const obxData = getSheetData('outbox_events');
  const obxStats = initStats('outbox_events', obxData.length);
  for (const ob of obxData) {
    try {
      await prisma.outboxEvent.upsert({
        where: { id: String(ob.id) },
        update: {
          eventKey: String(ob.event_key),
          eventType: String(ob.event_type),
          payload: String(ob.payload),
          status: String(ob.status || 'PENDING'),
          attempts: Number(ob.attempts || 0),
          createdAt: new Date('2026-11-03T09:23:00'),
        },
        create: {
          id: String(ob.id),
          eventKey: String(ob.event_key),
          eventType: String(ob.event_type),
          payload: String(ob.payload),
          status: String(ob.status || 'PENDING'),
          attempts: Number(ob.attempts || 0),
          createdAt: new Date('2026-11-03T09:23:00'),
        },
      });
      obxStats.inserted++;
    } catch (e: any) {
      obxStats.rejected++;
      obxStats.errors.push(`OutboxEvent ${ob.id}: ${e.message}`);
    }
  }

  // Audit Logs
  const audData = getSheetData('audit_logs');
  const audStats = initStats('audit_logs', audData.length);
  for (const aud of audData) {
    try {
      await prisma.auditLog.upsert({
        where: { id: String(aud.id) },
        update: {
          actorId: aud.actor_id ? String(aud.actor_id) : null,
          action: String(aud.action),
          entityType: String(aud.entity_type),
          entityId: String(aud.entity_id),
          beforeJson: aud.before_json ? String(aud.before_json) : null,
          afterJson: aud.after_json ? String(aud.after_json) : null,
          createdAt: parseRequiredDate(aud.created_at),
        },
        create: {
          id: String(aud.id),
          actorId: aud.actor_id ? String(aud.actor_id) : null,
          action: String(aud.action),
          entityType: String(aud.entity_type),
          entityId: String(aud.entity_id),
          beforeJson: aud.before_json ? String(aud.before_json) : null,
          afterJson: aud.after_json ? String(aud.after_json) : null,
          createdAt: parseRequiredDate(aud.created_at),
        },
      });
      audStats.inserted++;
    } catch (e: any) {
      audStats.rejected++;
      audStats.errors.push(`AuditLog ${aud.id}: ${e.message}`);
    }
  }

  // -------------------------------------------------------------
  // VALIDATION & SUMMARY REPORT
  // -------------------------------------------------------------
  console.log('\n=================================================================');
  console.log('                 DATABASE IMPORT SUMMARY REPORT                  ');
  console.log('=================================================================');
  console.log(
    'Table Name'.padEnd(26) +
    'Total'.padStart(8) +
    'Inserted'.padStart(10) +
    'Rejected'.padStart(10) +
    'Status'.padStart(10)
  );
  console.log('-'.repeat(65));

  let totalAllRows = 0;
  let totalInserted = 0;
  let totalRejected = 0;

  for (const [tbl, s] of Object.entries(report)) {
    totalAllRows += s.totalRows;
    totalInserted += s.inserted;
    totalRejected += s.rejected;
    const status = s.rejected === 0 ? 'SUCCESS' : 'ERRORS';
    console.log(
      tbl.padEnd(26) +
      String(s.totalRows).padStart(8) +
      String(s.inserted).padStart(10) +
      String(s.rejected).padStart(10) +
      status.padStart(10)
    );
    if (s.errors.length > 0) {
      for (const err of s.errors.slice(0, 3)) {
        console.error(`   -> ${err}`);
      }
    }
  }

  console.log('='.repeat(65));
  console.log(
    'TOTAL'.padEnd(26) +
    String(totalAllRows).padStart(8) +
    String(totalInserted).padStart(10) +
    String(totalRejected).padStart(10) +
    (totalRejected === 0 ? 'CLEAN' : 'HAS ERRORS').padStart(10)
  );

  // Write JSON report
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }
  const reportFile = path.join(REPORTS_DIR, `import_report_${Date.now()}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n[Report Generated] Saved detailed audit report to:\n${reportFile}`);

  // Test Authentication Verification
  console.log('\n--- Verifying Demo Authentication ---');
  const demoUser = await prisma.user.findUnique({
    where: { loginId: 'campus001' },
    include: { userRoles: { include: { role: true } } },
  });
  if (demoUser) {
    const isPasswordValid = await bcrypt.compare(demoPassword, demoUser.passwordHash);
    console.log(`User campus001 (${demoUser.name}) login test: ${isPasswordValid ? 'PASS (Password verified)' : 'FAIL'}`);
    console.log(`User roles: ${demoUser.userRoles.map((ur) => ur.role.name).join(', ')}`);
  } else {
    console.error('FAIL: User campus001 not found.');
  }

  console.log('\nImport process completed successfully.');
}

main()
  .catch((e) => {
    console.error('Fatal error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
