import {
  normalizeComplaintInput,
  detectHighConfidenceSafetyHazards,
  runSemanticInference,
  classifyComplaint as classifyComplaintEngine,
  CATEGORY_TAXONOMY,
  canonicalizeCategory,
  ComplaintClassification,
} from './ai_classifier.service';

export interface TriageResult {
  category: string;
  suggestedPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  detectedLanguage: 'en' | 'ta' | 'hi';
  normalizedText: string;
  extractedBuildingCode: string | null;
  extractedRoomCode: string | null;
  extractedAssetType: string | null;
  missingInformation: string[];
  explanation: string;
  isSensitive?: boolean;
  recommendedTeam?: string;
  // Enriched AI context-aware fields
  subcategory?: string;
  department?: string;
  departmentId?: string;
  requiredSkillId?: string;
  requiredSkillName?: string;
  safety_flags?: string[];
  needs_clarification?: boolean;
  clarification_prompt?: string | null;
  reason?: string;
  secondary_categories?: Array<{
    category: string;
    subcategory?: string;
    reason: string;
  }>;
}

export const SENSITIVE_CATEGORIES = ['SAFETY_INCIDENT', 'SAFETY', 'STUDENT_MISCONDUCT', 'HARASSMENT'];

export function isSensitiveCategory(category: string): boolean {
  return SENSITIVE_CATEGORIES.includes(category.toUpperCase());
}

/**
 * Synchronous context-aware triage engine.
 * Applies Layer 1 (Normalization), Layer 2 (Safety escalation),
 * Layer 3 (Semantic Inference), Layer 4 (Validation), Layer 5 (Clarification).
 */
export function runOfflineTriage(
  text: string,
  providedBuildingId?: string | null,
  providedRoomId?: string | null,
  providedAssetTag?: string | null
): TriageResult {
  const normalized = normalizeComplaintInput(text);
  const safetyHazards = detectHighConfidenceSafetyHazards(normalized);
  const semantic = runSemanticInference(normalized, safetyHazards);

  let finalCategory = canonicalizeCategory(semantic.category);
  const taxonomy = CATEGORY_TAXONOMY[finalCategory];

  // Consistency: If electrical hazard, ensure category is ELECTRICAL
  if (safetyHazards.some((h) => h.flag.startsWith('ELECTRICAL') || h.flag === 'BURNING_ELECTRICAL_SMELL' || h.flag === 'EXPOSED_LIVE_WIRING') && finalCategory !== 'ELECTRICAL') {
    finalCategory = 'ELECTRICAL';
  }

  // Priority Escalation
  let suggestedPriority = semantic.priority;
  if (safetyHazards.some((h) => h.severity === 'CRITICAL')) {
    suggestedPriority = 'CRITICAL';
  } else if (safetyHazards.some((h) => h.severity === 'HIGH') && suggestedPriority === 'LOW') {
    suggestedPriority = 'HIGH';
  }

  // Subcategory
  let finalSubcategory = semantic.subcategory;
  if (!taxonomy.subcategories.includes(finalSubcategory)) {
    finalSubcategory = taxonomy.subcategories[0];
  }

  // Missing info
  const missingInfo: string[] = [];
  if (!providedRoomId && !normalized.extractedRoomCode) {
    missingInfo.push('Room number or location is missing.');
  }
  if (!providedAssetTag && !normalized.extractedAssetType) {
    missingInfo.push('Specific equipment or asset tag not specified.');
  }

  const roomTarget = normalized.extractedRoomCode || (providedRoomId ? `Room ${providedRoomId}` : 'Campus Facility');
  const assetTarget = normalized.extractedAssetType || taxonomy.displayName;
  const normalizedSummary = `${assetTarget} issue reported in ${roomTarget} [Priority: ${suggestedPriority}]: "${text.trim().substring(0, 140)}"`;

  const safetyFlags = safetyHazards.map((h) => h.flag);

  return {
    category: finalCategory,
    suggestedPriority,
    confidence: semantic.confidence,
    detectedLanguage: normalized.detectedLanguage,
    normalizedText: normalizedSummary,
    extractedBuildingCode: normalized.extractedBuildingCode,
    extractedRoomCode: normalized.extractedRoomCode,
    extractedAssetType: normalized.extractedAssetType,
    missingInformation: missingInfo,
    explanation: semantic.reason,
    isSensitive: taxonomy.isSensitive || isSensitiveCategory(finalCategory),
    recommendedTeam: `${taxonomy.departmentName} - ${taxonomy.requiredSkillName}`,
    subcategory: finalSubcategory,
    department: taxonomy.departmentName,
    departmentId: taxonomy.departmentId,
    requiredSkillId: taxonomy.requiredSkillId,
    requiredSkillName: taxonomy.requiredSkillName,
    safety_flags: safetyFlags,
    needs_clarification: semantic.needsClarification,
    clarification_prompt: semantic.clarificationPrompt || null,
    reason: semantic.reason,
    secondary_categories: semantic.secondaryIssues || [],
  };
}

/**
 * Asynchronous contextual AI classification endpoint.
 */
export async function classifyComplaint(
  text: string,
  providedBuildingId?: string | null,
  providedRoomId?: string | null,
  providedAssetTag?: string | null
): Promise<ComplaintClassification> {
  return classifyComplaintEngine(text, providedBuildingId, providedRoomId, providedAssetTag);
}
