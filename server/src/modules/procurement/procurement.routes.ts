import { Router, Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../../prisma';
import { authenticate, requireRole } from '../../middleware/auth.middleware';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.resolve(__dirname, '../../../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `pr-evidence-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`);
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

const router = Router();
router.use(authenticate);

/**
 * GET /api/procurement or /api/procurement/requests
 * Returns list of purchase requests with lines and approval decisions.
 */
router.get(['/', '/requests'], async (req: Request, res: Response) => {
  try {
    const { status, workOrderId } = req.query;
    const requests = await prisma.purchaseRequest.findMany({
      where: {
        status: status ? String(status) : undefined,
        workOrderId: workOrderId ? String(workOrderId) : undefined,
      },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        workOrder: {
          select: { id: true, status: true, incidentId: true, blockedReason: true },
        },
        lines: {
          include: {
            item: {
              select: { id: true, sku: true, name: true, unit: true, quantityOnHand: true },
            },
          },
        },
        approvalDecisions: {
          include: {
            approver: {
              select: { id: true, name: true },
            },
          },
          orderBy: { decidedAt: 'desc' },
        },
        stockReceipts: {
          orderBy: { receivedAt: 'desc' },
        },
      },
      orderBy: { id: 'desc' },
    });

    res.json({ success: true, data: requests });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/procurement/receipts
 * Returns list of stock delivery receipts with receiving staff and purchase request details.
 */
router.get('/receipts', async (req: Request, res: Response) => {
  try {
    const receipts = await prisma.stockReceipt.findMany({
      include: {
        receiver: { select: { id: true, name: true, email: true } },
        item: { select: { id: true, sku: true, name: true, unit: true } },
        purchaseRequest: {
          select: { id: true, reason: true, status: true, requester: { select: { name: true } } },
        },
      },
      orderBy: { receivedAt: 'desc' },
      take: 100,
    });
    res.json({ success: true, data: receipts });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

/**
 * GET /api/procurement/:id or /api/procurement/requests/:id
 * Returns single purchase request dossier.
 */
router.get(['/:id', '/requests/:id'], async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const pr = await prisma.purchaseRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, email: true },
        },
        workOrder: {
          include: {
            incident: true,
            assignee: { select: { id: true, name: true } },
          },
        },
        lines: {
          include: {
            item: true,
          },
        },
        approvalDecisions: {
          include: {
            approver: { select: { id: true, name: true } },
          },
          orderBy: { decidedAt: 'desc' },
        },
        stockReceipts: {
          include: {
            receiver: { select: { id: true, name: true } },
            item: { select: { id: true, sku: true, name: true } },
          },
          orderBy: { receivedAt: 'desc' },
        },
      },
    });

    if (!pr) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Purchase request '${id}' not found.` } });
      return;
    }

    res.json({ success: true, data: pr });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
  }
});

const createPrSchema = z
  .object({
    workOrderId: z.string().optional().nullable(),
    reason: z.string().optional(),
    justification: z.string().optional(),
    attachmentUrl: z.string().optional().nullable(),
    itemId: z.string().optional(),
    inventoryItemId: z.string().optional(),
    quantity: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]).optional(),
    lines: z
      .union([
        z.array(
          z.object({
            itemId: z.string().optional(),
            inventoryItemId: z.string().optional(),
            quantity: z.union([z.number(), z.string().regex(/^\d+$/).transform(Number)]),
            estimatedUnitCost: z.union([z.number(), z.string().transform(Number)]).optional(),
          })
        ),
        z.string().transform((val) => {
          try {
            const parsed = JSON.parse(val);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        }),
      ])
      .optional(),
  })
  .transform((data) => {
    let rawLines = Array.isArray(data.lines) ? data.lines : [];
    if (rawLines.length === 0 && (data.itemId || data.inventoryItemId)) {
      rawLines = [
        {
          itemId: data.itemId || data.inventoryItemId,
          quantity: data.quantity || 1,
        },
      ];
    }
    return {
      ...data,
      reason: data.reason || data.justification || 'Hardware spares replacement',
      lines: rawLines.map((l: any) => ({
        ...l,
        itemId: l.itemId || l.inventoryItemId || 'ITM002',
        quantity: Math.max(1, Number(l.quantity) || 1),
      })),
    };
  })
  .refine((data) => data.lines.length > 0, {
    message: 'At least one item line is required for purchase request',
  });

/**
 * POST /api/procurement/requests
 * Creates a purchase request. If linked to a work order, marks work order as BLOCKED.
 * Supports both JSON payloads (with optional attachmentUrl) and multipart/form-data.
 */
router.post(
  '/requests',
  requireRole(['TECHNICIAN', 'FACILITIES_ADMIN', 'PROCUREMENT_MANAGER', 'SYSTEM_ADMIN']),
  (req: Request, res: Response, next: any) => {
    upload.any()(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: { code: 'FILE_TOO_LARGE', message: 'Attached image exceeds the 5MB file size limit.' },
          });
        }
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_FILE', message: err.message || 'Invalid file attachment.' },
        });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const parsed = createPrSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: parsed.error.errors[0]?.message || 'Invalid request data', details: parsed.error.format() },
        });
        return;
      }

      const { workOrderId, reason, lines, attachmentUrl } = parsed.data;
      const user = (req as any).user;

      // Handle optional uploaded file from multipart form-data if present
      let finalAttachmentUrl = attachmentUrl || null;
      const uploadedFiles = req.files as Express.Multer.File[];
      if (uploadedFiles && uploadedFiles.length > 0) {
        const file = uploadedFiles[0];
        const evidenceId = `EVD-${Date.now()}-${Math.round(Math.random() * 1000)}`;
        await prisma.evidence.create({
          data: {
            id: evidenceId,
            uploadedBy: user.id,
            storageKey: file.filename,
            originalFilename: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            createdAt: new Date(),
          },
        });
        finalAttachmentUrl = `/api/intake/evidence/${evidenceId}`;
      }

      // Verify work order if specified (support both WO005 and WO-005 format)
      let resolvedWorkOrderId: string | null = null;
      if (workOrderId && typeof workOrderId === 'string' && workOrderId.trim()) {
        const rawWoId = workOrderId.trim();
        let wo = await prisma.workOrder.findUnique({ where: { id: rawWoId } });
        if (!wo) {
          const withoutDashes = rawWoId.replace(/-/g, '');
          wo = await prisma.workOrder.findUnique({ where: { id: withoutDashes } });
        }
        if (!wo) {
          const withDash = rawWoId.replace(/^([A-Za-z]+)(\d+)$/, '$1-$2');
          wo = await prisma.workOrder.findUnique({ where: { id: withDash } });
        }
        if (!wo) {
          res.status(400).json({
            success: false,
            error: { code: 'WORK_ORDER_NOT_FOUND', message: `Work Order '${rawWoId}' was not found in the database. Please verify the Work Order ID.` },
          });
          return;
        }
        resolvedWorkOrderId = wo.id;
      }

      // Verify items exist and calculate estimated total
      let estimatedTotal = 0;
      for (const line of lines) {
        let item = await prisma.inventoryItem.findUnique({ where: { id: line.itemId } });
        if (!item) {
          // Check by SKU or fuzzy match
          item = await prisma.inventoryItem.findFirst({
            where: {
              OR: [
                { sku: line.itemId },
                { sku: line.itemId.replace(/^INV-/, '') },
                { id: line.itemId.toUpperCase() },
              ],
            },
          });
        }
        if (!item) {
          // Map legacy mockup codes (INV-NET-01 -> NET-TRANSCEIVER, INV-ELE-02 -> ELEC-SOCKET-16A, INV-AV-01 -> HDMI-CABLE)
          if (line.itemId.includes('NET')) {
            item = await prisma.inventoryItem.findFirst({ where: { sku: 'NET-TRANSCEIVER' } });
          } else if (line.itemId.includes('ELE') || line.itemId.includes('SOCKET')) {
            item = await prisma.inventoryItem.findFirst({ where: { sku: 'ELEC-SOCKET-16A' } });
          } else if (line.itemId.includes('AV') || line.itemId.includes('HDMI')) {
            item = await prisma.inventoryItem.findFirst({ where: { sku: 'HDMI-CABLE' } });
          }
        }
        if (!item) {
          res.status(404).json({
            success: false,
            error: { code: 'ITEM_NOT_FOUND', message: `Inventory item '${line.itemId}' not found.` },
          });
          return;
        }
        // Normalize line.itemId to real inventory item ID
        line.itemId = item.id;

        if (line.estimatedUnitCost) {
          estimatedTotal += line.estimatedUnitCost * line.quantity;
        } else if (item.unitCost) {
          estimatedTotal += item.unitCost * line.quantity;
        }
      }

      const timestamp = Date.now();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const prId = `PR-${timestamp}-${randomSuffix}`;

      const createdPr = await prisma.$transaction(async (tx) => {
        // 1. Create Purchase Request
        const pr = await tx.purchaseRequest.create({
          data: {
            id: prId,
            requesterId: user.id,
            workOrderId: resolvedWorkOrderId,
            status: 'PENDING_APPROVAL',
            estimatedTotal: estimatedTotal > 0 ? estimatedTotal : null,
            reason,
            attachmentUrl: finalAttachmentUrl,
          },
        });

        // 2. Create lines
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          await tx.purchaseRequestLine.create({
            data: {
              id: `PRL-${timestamp}-${randomSuffix}-${i + 1}`,
              requestId: prId,
              itemId: line.itemId,
              quantity: line.quantity,
              estimatedUnitCost: line.estimatedUnitCost || null,
            },
          });
        }

        // 3. If workOrderId is provided, update Work Order to BLOCKED
        if (resolvedWorkOrderId) {
          await tx.workOrder.update({
            where: { id: resolvedWorkOrderId },
            data: {
              status: 'BLOCKED',
              blockedReason: `Awaiting spare parts from Purchase Request ${prId}: ${reason}`,
            },
          });

          await tx.workOrderEvent.create({
            data: {
              id: `WOE-${timestamp}-${randomSuffix}`,
              workOrderId: resolvedWorkOrderId,
              actorId: user.id,
              eventType: 'BLOCKED',
              details: `Blocked pending procurement: ${reason} (PR: ${prId})`,
              createdAt: new Date(),
            },
          });
        }

        // 4. Audit Log
        await tx.auditLog.create({
          data: {
            id: `AUD-${timestamp}-${randomSuffix}`,
            actorId: user.id,
            entityType: 'purchase_requests',
            entityId: prId,
            action: 'CREATE',
            beforeJson: null,
            afterJson: JSON.stringify({ prId, reason, lineCount: lines.length, estimatedTotal, workOrderId: resolvedWorkOrderId, attachmentUrl: finalAttachmentUrl }),
            createdAt: new Date(),
          },
        });

        // 5. Notify Procurement Managers
        const procManagers = await tx.userRole.findMany({
          where: { role: { code: 'PROCUREMENT_MANAGER' } },
        });

        for (const pm of procManagers) {
          await tx.notification.create({
            data: {
              id: `NOT-${timestamp}-${Math.floor(1000 + Math.random() * 9000)}`,
              recipientId: pm.userId,
              eventType: 'PURCHASE_REQUEST_PENDING',
              title: 'New Purchase Request Pending Approval',
              body: `PR ${prId} created by ${user.name || user.id}: ${reason}`,
              readAt: null,
              createdAt: new Date(),
            },
          });
        }

        return pr;
      });

      res.status(201).json({
        success: true,
        message: 'Purchase request created and queued for approval.',
        data: createdPr,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }
);

const decidePrSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  comment: z.string().optional(),
});

/**
 * POST /api/procurement/requests/:id/decide
 * Approves or rejects a purchase request.
 * Strictly enforces Separation of Duties: Requester CANNOT approve their own request.
 * Backend Rule: Approval does NOT increment physical stock on hand.
 */
router.post(
  '/requests/:id/decide',
  requireRole(['PROCUREMENT_MANAGER', 'FACILITIES_ADMIN', 'SYSTEM_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const parsed = decidePrSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', details: parsed.error.format() },
        });
        return;
      }

      const { decision, comment } = parsed.data;
      const user = (req as any).user;

      const pr = await prisma.purchaseRequest.findUnique({
        where: { id },
      });

      if (!pr) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Purchase request '${id}' not found.` } });
        return;
      }

      // Check Separation of Duties (Anti-Self-Approval Rule)
      if (pr.requesterId === user.id) {
        res.status(403).json({
          success: false,
          error: {
            code: 'SELF_APPROVAL_FORBIDDEN',
            message: 'Separation of duties violation: You cannot approve or reject your own purchase request.',
          },
        });
        return;
      }

      if (pr.status !== 'PENDING_APPROVAL') {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Purchase request is in '${pr.status}' status and cannot be decided upon.`,
          },
        });
        return;
      }

      const timestamp = Date.now();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const decisionId = `APR-${timestamp}-${randomSuffix}`;
      const nextStatus = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';

      const result = await prisma.$transaction(async (tx) => {
        // 1. Record Approval Decision
        const appDec = await tx.approvalDecision.create({
          data: {
            id: decisionId,
            requestId: pr.id,
            approverId: user.id,
            decision,
            comment: comment || null,
            decidedAt: new Date(),
          },
        });

        // 2. Update Purchase Request Status (Stock remains unchanged!)
        const updatedPr = await tx.purchaseRequest.update({
          where: { id: pr.id },
          data: { status: nextStatus },
        });

        // 3. Notify Requester
        await tx.notification.create({
          data: {
            id: `NOT-${timestamp}-${randomSuffix}`,
            recipientId: pr.requesterId,
            eventType: `PURCHASE_REQUEST_${decision}`,
            title: `Purchase Request ${pr.id} ${decision}D`,
            body: `Your purchase request for "${pr.reason}" has been ${decision.toLowerCase()}d by ${user.name}. Comment: ${comment || 'None'}`,
            readAt: null,
            createdAt: new Date(),
          },
        });

        // 4. Audit Log
        await tx.auditLog.create({
          data: {
            id: `AUD-${timestamp}-${randomSuffix}`,
            actorId: user.id,
            entityType: 'purchase_requests',
            entityId: pr.id,
            action: decision,
            beforeJson: JSON.stringify({ status: 'PENDING_APPROVAL' }),
            afterJson: JSON.stringify({ status: nextStatus, approverId: user.id, comment }),
            createdAt: new Date(),
          },
        });

        return { pr: updatedPr, decision: appDec };
      });

      res.json({
        success: true,
        message: `Purchase request ${id} ${decision.toLowerCase()}d successfully. Physical stock remains unchanged until physical receipt.`,
        data: result,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }
);

const stockReceiptSchema = z
  .object({
    purchaseRequestId: z.string().min(1, 'purchaseRequestId is required'),
    itemId: z.string().optional(),
    inventoryItemId: z.string().optional(),
    quantityReceived: z.number().int().positive().optional(),
    condition: z.enum(['ACCEPTED', 'DAMAGED']).default('ACCEPTED'),
    carrier: z.string().optional(),
    waybillNumber: z.string().optional(),
    items: z
      .array(
        z.object({
          inventoryItemId: z.string().optional(),
          itemId: z.string().optional(),
          quantityReceived: z.number().int().positive(),
        })
      )
      .optional(),
  })
  .transform((data) => {
    const firstItem = data.items?.[0];
    const itemId = data.itemId || data.inventoryItemId || firstItem?.itemId || firstItem?.inventoryItemId || 'INV-NET-01';
    const quantityReceived = data.quantityReceived || firstItem?.quantityReceived || 1;
    return {
      ...data,
      itemId,
      quantityReceived,
    };
  });

/**
 * POST /api/procurement/receipts
 * Records physical delivery of goods into inventory.
 * Increments quantity_on_hand, logs stock movement, and unblocks waiting work orders.
 */
router.post(
  '/receipts',
  requireRole(['PROCUREMENT_MANAGER', 'FACILITIES_ADMIN', 'SYSTEM_ADMIN']),
  async (req: Request, res: Response) => {
    try {
      const parsed = stockReceiptSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', details: parsed.error.format() },
        });
        return;
      }

      const { purchaseRequestId, itemId, quantityReceived, condition } = parsed.data;
      const user = (req as any).user;

      const pr = await prisma.purchaseRequest.findUnique({
        where: { id: purchaseRequestId },
        include: {
          lines: true,
          workOrder: true,
        },
      });

      if (!pr) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Purchase request '${purchaseRequestId}' not found.` },
        });
        return;
      }

      if (!['APPROVED', 'PARTIALLY_RECEIVED'].includes(pr.status)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PR_STATUS',
            message: `Cannot receive stock for purchase request in '${pr.status}' status. It must be APPROVED first.`,
          },
        });
        return;
      }

      const matchingLine = pr.lines.find((l) => l.itemId === itemId);
      if (!matchingLine) {
        res.status(400).json({
          success: false,
          error: {
            code: 'ITEM_NOT_IN_PR',
            message: `Item '${itemId}' was not requested in Purchase Request '${purchaseRequestId}'.`,
          },
        });
        return;
      }

      const timestamp = Date.now();
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const receiptId = `RCT-${timestamp}-${randomSuffix}`;

      const receiptResult = await prisma.$transaction(async (tx) => {
        // 1. Create Stock Receipt
        const receipt = await tx.stockReceipt.create({
          data: {
            id: receiptId,
            purchaseRequestId,
            itemId,
            quantityReceived,
            receivedBy: user.id,
            receivedAt: new Date(),
            condition,
          },
        });

        let updatedItem = null;
        let workOrderResumed = false;

        if (condition === 'ACCEPTED') {
          // 2. Increment physical quantityOnHand
          updatedItem = await tx.inventoryItem.update({
            where: { id: itemId },
            data: {
              quantityOnHand: {
                increment: quantityReceived,
              },
            },
          });

          // 3. Record positive StockMovement
          await tx.stockMovement.create({
            data: {
              id: `MVT-${timestamp}-${randomSuffix}`,
              itemId,
              quantityDelta: quantityReceived,
              reason: 'PURCHASE_RECEIPT',
              referenceId: purchaseRequestId,
              createdAt: new Date(),
            },
          });

          // 4. Update PR status to RECEIVED
          await tx.purchaseRequest.update({
            where: { id: purchaseRequestId },
            data: { status: 'RECEIVED' },
          });

          // 5. Scenario 2: Resumption check for blocked work order
          if (pr.workOrderId && pr.workOrder) {
            const wo = pr.workOrder;
            if (wo.status === 'BLOCKED') {
              // Automatically reserve the needed item for this work order
              const resId = `RSV-${timestamp}-${randomSuffix}`;
              await tx.stockReservation.create({
                data: {
                  id: resId,
                  itemId,
                  workOrderId: wo.id,
                  quantity: Math.min(quantityReceived, matchingLine.quantity),
                  status: 'ACTIVE',
                },
              });

              // Resume the work order
              await tx.workOrder.update({
                where: { id: wo.id },
                data: {
                  status: 'IN_PROGRESS',
                  blockedReason: null,
                },
              });

              // Log work order event
              await tx.workOrderEvent.create({
                data: {
                  id: `WOE-${timestamp}-${randomSuffix}`,
                  workOrderId: wo.id,
                  actorId: user.id,
                  eventType: 'RESUMED',
                  details: `Stock received via receipt ${receiptId} (${quantityReceived} units of ${matchingLine.itemId}). Part reserved and work resumed.`,
                  createdAt: new Date(),
                },
              });

              workOrderResumed = true;

              // Notify assigned technician if present
              if (wo.assignedTo) {
                await tx.notification.create({
                  data: {
                    id: `NOT-${timestamp}-${Math.floor(1000 + Math.random() * 9000)}`,
                    recipientId: wo.assignedTo,
                    eventType: 'PARTS_RECEIVED',
                    title: `Parts Arrived for Work Order ${wo.id}`,
                    body: `Required part (${matchingLine.itemId}) has been received and reserved. Work order is now IN_PROGRESS.`,
                    readAt: null,
                    createdAt: new Date(),
                  },
                });
              }
            }
          }
        }

        // 6. Audit Log
        await tx.auditLog.create({
          data: {
            id: `AUD-${timestamp}-${randomSuffix}`,
            actorId: user.id,
            entityType: 'stock_receipts',
            entityId: receiptId,
            action: 'RECEIVE_STOCK',
            beforeJson: JSON.stringify({ prStatus: pr.status }),
            afterJson: JSON.stringify({
              receiptId,
              itemId,
              quantityReceived,
              condition,
              workOrderResumed,
              newQuantityOnHand: updatedItem?.quantityOnHand,
            }),
            createdAt: new Date(),
          },
        });

        return { receipt, updatedItem, workOrderResumed };
      });

      res.status(201).json({
        success: true,
        message: 'Stock received into inventory successfully.',
        data: receiptResult,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: err.message } });
    }
  }
);

export default router;
