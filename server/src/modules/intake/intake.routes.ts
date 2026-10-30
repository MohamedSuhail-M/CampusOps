import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../prisma';
import { authenticate } from '../../middleware/auth.middleware';
import { runOfflineTriage } from '../../services/triage.service';
import { detectIncidentCorrelation } from '../../services/incident_correlation.service';

const router = Router();

router.use(authenticate);

const submitIntakeSchema = z
  .object({
    originalText: z.string().optional(),
    message: z.string().optional(),
    channel: z.enum(['WEB', 'QR', 'EMAIL', 'VOICE']).default('WEB'),
    buildingId: z.string().optional().nullable(),
    roomId: z.string().optional().nullable(),
    assetTag: z.string().optional().nullable(),
    assetId: z.string().optional().nullable(),
  })
  .refine(
    (data) => (data.originalText && data.originalText.length >= 5) || (data.message && data.message.length >= 5),
    {
      message: 'Complaint description must be at least 5 characters.',
    }
  )
  .transform((data) => ({
    ...data,
    originalText: data.originalText || data.message || '',
    assetTag: data.assetTag || data.assetId || null,
  }));

// POST /api/intake/triage-preview (Real-time preview without persisting)
router.post('/triage-preview', async (req: Request, res: Response) => {
  const { originalText, buildingId, roomId, assetTag } = req.body;
  if (!originalText || typeof originalText !== 'string') {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'originalText required.' } });
    return;
  }

  const triage = runOfflineTriage(originalText, buildingId, roomId, assetTag);
  const correlation = await detectIncidentCorrelation(triage.category, buildingId, roomId);

  res.json({
    success: true,
    data: {
      triage,
      correlation,
    },
  });
});

const handleIntakeSubmission = async (req: Request, res: Response) => {
  const result = submitIntakeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({
      success: false,
      error: { code: 'VALIDATION_ERROR', message: result.error.errors[0]?.message || 'Invalid input.' },
    });
    return;
  }

  const { originalText, channel, buildingId: rawBuildingId, roomId: rawRoomId, assetTag } = result.data;
  const user = req.user!;

  try {
    let resolvedAssetId: string | null = null;
    let resolvedRoomId: string | null = rawRoomId || null;
    let resolvedBuildingId: string | null = rawBuildingId || null;

    // 1. If assetTag provided, resolve asset, room, and building
    if (assetTag) {
      const asset = await prisma.asset.findFirst({
        where: {
          OR: [{ assetTag: assetTag.trim() }, { id: assetTag.trim() }],
        },
        include: { room: true },
      });
      if (asset) {
        resolvedAssetId = asset.id;
        resolvedRoomId = asset.roomId;
        resolvedBuildingId = asset.room.buildingId;
      }
    }

    // 2. Run deterministic offline triage
    const triage = runOfflineTriage(originalText, resolvedBuildingId, resolvedRoomId, assetTag);

    // 3. If room wasn't provided, check if triage extracted a recognized room
    if (!resolvedRoomId && triage.extractedRoomCode) {
      const extractedRoom = await prisma.room.findFirst({
        where: {
          OR: [
            { code: triage.extractedRoomCode },
            { id: `RM-${triage.extractedRoomCode}` },
          ],
        },
      });
      if (extractedRoom) {
        resolvedRoomId = extractedRoom.id;
        resolvedBuildingId = extractedRoom.buildingId;
      }
    }

    // 4. Validate resolvedRoomId against DB to ensure valid foreign key and resolve genuine buildingId
    if (resolvedRoomId) {
      const dbRoom = await prisma.room.findFirst({
        where: {
          OR: [{ id: resolvedRoomId }, { code: resolvedRoomId }],
        },
      });
      if (dbRoom) {
        resolvedRoomId = dbRoom.id;
        resolvedBuildingId = dbRoom.buildingId;
      } else {
        resolvedRoomId = null;
      }
    }

    // 5. Validate resolvedBuildingId against DB
    if (resolvedBuildingId) {
      const dbBuilding = await prisma.building.findFirst({
        where: {
          OR: [{ id: resolvedBuildingId }, { code: resolvedBuildingId }],
        },
      });
      if (dbBuilding) {
        resolvedBuildingId = dbBuilding.id;
      } else {
        resolvedBuildingId = null;
      }
    }

    // 6. Check correlation / duplicate detection
    const correlation = await detectIncidentCorrelation(
      triage.category,
      resolvedBuildingId,
      resolvedRoomId,
      resolvedAssetId
    );

    // 7. Execute in transactional block to preserve consistency
    const transactionResult = await prisma.$transaction(async (tx) => {
      // Unique message ID
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const timestamp = Date.now();
      const messageId = `MSG-${timestamp}-${randomSuffix}`;

      const intakeMessage = await tx.intakeMessage.create({
        data: {
          id: messageId,
          channel,
          originalText,
          language: 'en',
          reporterId: user.id,
          receivedAt: new Date(),
        },
      });

      // Handle duplicate correlation vs new incident
      if (correlation.isDuplicate && correlation.matchedIncidentId) {
        const matchedIncident = await tx.incident.findUnique({
          where: { id: correlation.matchedIncidentId },
        });

        // Link complaint as RELATED
        await tx.incidentReport.create({
          data: {
            incidentId: correlation.matchedIncidentId,
            intakeMessageId: intakeMessage.id,
            relationshipType: 'RELATED',
          },
        });

        // Audit log for duplicate report linking
        await tx.auditLog.create({
          data: {
            id: `AUD-${timestamp}-${randomSuffix}`,
            actorId: user.id,
            action: 'LINK_DUPLICATE_REPORT',
            entityType: 'INCIDENT',
            entityId: correlation.matchedIncidentId,
            beforeJson: JSON.stringify({ reportsCount: 'existing' }),
            afterJson: JSON.stringify({
              newIntakeMessageId: intakeMessage.id,
              correlationReason: correlation.matchReason,
              confidence: correlation.confidence,
            }),
            createdAt: new Date(),
          },
        });

        return {
          intakeMessage,
          incident: matchedIncident,
          isDuplicate: true,
          matchReason: correlation.matchReason,
        };
      }

      // Create brand-new Incident
      const incidentId = `INC-${timestamp}-${randomSuffix}`;
      const reference = `INC-2026-${String(randomSuffix).padStart(4, '0')}`;
      const title = originalText.length > 60 ? `${originalText.substring(0, 57)}...` : originalText;

      const newIncident = await tx.incident.create({
        data: {
          id: incidentId,
          reference,
          title,
          category: triage.category,
          priority: triage.suggestedPriority,
          status: 'NEW',
          buildingId: resolvedBuildingId,
          roomId: resolvedRoomId,
          assetId: resolvedAssetId,
          createdAt: new Date(),
        },
      });

      // Link as PRIMARY report
      await tx.incidentReport.create({
        data: {
          incidentId: newIncident.id,
          intakeMessageId: intakeMessage.id,
          relationshipType: 'PRIMARY',
        },
      });

      // Outbox Event
      await tx.outboxEvent.create({
        data: {
          id: `OBX-${timestamp}-${randomSuffix}`,
          eventKey: `${newIncident.id}-CREATED-${timestamp}`,
          eventType: 'INCIDENT_CREATED',
          payload: JSON.stringify({
            incidentId: newIncident.id,
            reference: newIncident.reference,
            category: newIncident.category,
            priority: newIncident.priority,
            roomId: newIncident.roomId,
          }),
          status: 'PENDING',
          attempts: 0,
          createdAt: new Date(),
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          id: `AUD-${timestamp}-${randomSuffix}`,
          actorId: user.id,
          action: 'CREATE',
          entityType: 'INCIDENT',
          entityId: newIncident.id,
          beforeJson: null,
          afterJson: JSON.stringify({ status: 'NEW', priority: newIncident.priority, category: newIncident.category }),
          createdAt: new Date(),
        },
      });

      return {
        intakeMessage,
        incident: newIncident,
        isDuplicate: false,
        matchReason: null,
      };
    });

    res.status(201).json({
      success: true,
      data: {
        intakeMessageId: transactionResult.intakeMessage.id,
        incident: transactionResult.incident,
        incidentId: transactionResult.incident?.id,
        incidentReference: transactionResult.incident?.reference,
        isDuplicate: transactionResult.isDuplicate,
        matchReason: transactionResult.matchReason,
        category: transactionResult.incident?.category,
        priority: transactionResult.incident?.priority,
        status: transactionResult.incident?.status,
        triageSummary: triage,
        triage,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to process complaint intake.', details: error.message },
    });
  }
};

router.post('/', handleIntakeSubmission);
router.post('/submit', handleIntakeSubmission);

// GET /api/intake/my-complaints
router.get('/my-complaints', async (req: Request, res: Response) => {
  const user = req.user!;

  try {
    const messages = await prisma.intakeMessage.findMany({
      where: { reporterId: user.id },
      include: {
        incidentReports: {
          include: {
            incident: {
              include: {
                room: { include: { building: true } },
                workOrders: {
                  select: { id: true, status: true, assignee: { select: { name: true } } },
                },
              },
            },
          },
        },
      },
      orderBy: { receivedAt: 'desc' },
    });

    res.json({
      success: true,
      data: messages.map((m) => {
        const report = m.incidentReports[0];
        const inc = report?.incident;
        return {
          id: m.id,
          channel: m.channel,
          originalText: m.originalText,
          receivedAt: m.receivedAt,
          relationshipType: report?.relationshipType || 'PRIMARY',
          incident: inc
            ? {
                id: inc.id,
                reference: inc.reference,
                title: inc.title,
                category: inc.category,
                priority: inc.priority,
                status: inc.status,
                location: inc.room ? `${inc.room.building.code}-${inc.room.code}` : 'Campus wide',
                workOrders: inc.workOrders,
              }
            : null,
        };
      }),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch user complaints.', details: error.message },
    });
  }
});

export default router;
