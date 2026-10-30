import { Router, Request, Response } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import prisma from '../../prisma';
import { authenticate } from '../../middleware/auth.middleware';
import { runOfflineTriage, isSensitiveCategory } from '../../services/triage.service';
import { detectIncidentCorrelation } from '../../services/incident_correlation.service';

const router = Router();

router.use(authenticate);

// Configure Uploads directory for photo evidence
const uploadsDir = path.resolve(__dirname, '../../../../data/uploads/evidence');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `evidence-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max per image
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed.'));
    }
  },
});

const submitIntakeSchema = z
  .object({
    title: z.string().optional().nullable(),
    category: z.string().optional().nullable(),
    incidentDate: z.string().optional().nullable(),
    originalText: z.string().optional(),
    message: z.string().optional(),
    channel: z.enum(['WEB', 'QR', 'EMAIL', 'VOICE']).default('WEB'),
    language: z.string().optional(),
    inputMethod: z.string().optional(),
    evidenceIds: z.array(z.string()).optional().default([]),
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

// POST /api/intake/evidence (Multipart photo upload)
router.post('/evidence', upload.array('photos', 3), async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, error: { code: 'NO_FILES', message: 'No photo files uploaded.' } });
      return;
    }

    const user = req.user!;
    const createdEvidences = [];

    for (const f of files) {
      const evidenceId = `EVD-${Date.now()}-${Math.round(Math.random() * 1000)}`;
      const record = await prisma.evidence.create({
        data: {
          id: evidenceId,
          uploadedBy: user.id,
          storageKey: f.filename,
          originalFilename: f.originalname,
          mimeType: f.mimetype,
          fileSize: f.size,
          createdAt: new Date(),
        },
      });
      createdEvidences.push(record);
    }

    res.status(201).json({
      success: true,
      data: createdEvidences,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: error.message || 'Failed to upload photo evidence.' },
    });
  }
});

// GET /api/intake/evidence/:id (Secure photo retrieval with path traversal safety)
router.get('/evidence/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const evidence = await prisma.evidence.findUnique({
      where: { id },
    });

    if (!evidence) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Evidence not found.' } });
      return;
    }

    // Path traversal safety: extract basename only
    const safeFilename = path.basename(evidence.storageKey);
    const filePath = path.join(uploadsDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: { code: 'FILE_NOT_FOUND', message: 'Attachment file not found on disk.' } });
      return;
    }

    res.setHeader('Content-Type', evidence.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(evidence.originalFilename)}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'ERROR', message: error.message } });
  }
});

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

  const {
    title: userTitle,
    category: userProvidedCategory,
    originalText,
    channel,
    language: providedLang,
    inputMethod: providedMethod,
    evidenceIds,
    buildingId: rawBuildingId,
    roomId: rawRoomId,
    assetTag,
  } = result.data;
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

    // 2. Run deterministic multilingual offline triage
    const triage = runOfflineTriage(originalText, resolvedBuildingId, resolvedRoomId, assetTag);

    const finalCategory = userProvidedCategory && userProvidedCategory !== 'AI_SUGGESTED' ? userProvidedCategory : triage.category;
    const isSensitive = isSensitiveCategory(finalCategory) || Boolean(triage.isSensitive);

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

    // 4. Validate resolvedRoomId against DB
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
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const timestamp = Date.now();
      const messageId = `MSG-${timestamp}-${randomSuffix}`;

      const intakeMessage = await tx.intakeMessage.create({
        data: {
          id: messageId,
          channel,
          originalText,
          language: triage.detectedLanguage || providedLang || 'en',
          inputMethod: providedMethod || (channel === 'VOICE' ? 'VOICE' : channel === 'QR' ? 'QR_TEXT' : 'TEXT'),
          normalizedText: triage.normalizedText || null,
          aiMetadata: JSON.stringify({
            ...triage,
            aiSuggestedCategory: triage.category,
            finalCategory,
            isSensitive,
          }),
          reporterId: user.id,
          receivedAt: new Date(),
        },
      });

      // Link any uploaded evidence to this intake message
      if (evidenceIds && evidenceIds.length > 0) {
        await tx.evidence.updateMany({
          where: { id: { in: evidenceIds } },
          data: { intakeMessageId: intakeMessage.id },
        });
      }

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

      // Create NEW Incident
      const incidentId = `INC-${timestamp}-${randomSuffix}`;
      const reference = `INC-2026-${randomSuffix}`;

      // Title Generation
      let title = userTitle || `${finalCategory}: Reported in ${resolvedRoomId ? 'Room' : 'Campus'}`;
      if (!userTitle && triage.extractedAssetType) {
        title = `${triage.extractedAssetType} issue in ${triage.extractedRoomCode || 'campus'}`;
      } else if (!userTitle) {
        const words = originalText.trim().split(/\s+/).slice(0, 6).join(' ');
        title = words.length > 0 ? `${words}...` : `${finalCategory} Issue`;
      }

      const newIncident = await tx.incident.create({
        data: {
          id: incidentId,
          reference,
          title,
          category: finalCategory,
          priority: triage.suggestedPriority,
          status: 'NEW',
          isSensitive,
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
        evidence: true,
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
          language: m.language,
          inputMethod: m.inputMethod,
          originalText: m.originalText,
          normalizedText: m.normalizedText,
          receivedAt: m.receivedAt,
          relationshipType: report?.relationshipType || 'PRIMARY',
          evidence: m.evidence,
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

// GET /api/intake/:id (Detailed complaint fetch)
router.get('/:id', async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const message = await prisma.intakeMessage.findFirst({
      where: {
        OR: [
          { id },
          { incidentReports: { some: { incident: { reference: id } } } },
        ],
      },
      include: {
        evidence: true,
        incidentReports: {
          include: {
            incident: {
              include: {
                room: { include: { building: true } },
                asset: true,
                building: true,
                workOrders: {
                  include: {
                    assignee: true,
                    events: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!message) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Complaint record not found.' } });
      return;
    }

    const report = message.incidentReports[0];
    const inc = report?.incident;

    res.json({
      success: true,
      data: {
        id: message.id,
        channel: message.channel,
        originalText: message.originalText,
        language: message.language,
        inputMethod: message.inputMethod,
        normalizedText: message.normalizedText,
        aiMetadata: message.aiMetadata ? JSON.parse(message.aiMetadata) : null,
        receivedAt: message.receivedAt,
        evidence: message.evidence,
        incident: inc
          ? {
              id: inc.id,
              reference: inc.reference,
              title: inc.title,
              category: inc.category,
              priority: inc.priority,
              status: inc.status,
              room: inc.room,
              building: inc.building || inc.room?.building,
              asset: inc.asset,
              workOrders: inc.workOrders,
            }
          : null,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'ERROR', message: error.message } });
  }
});

export default router;
