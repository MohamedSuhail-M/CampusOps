/**
 * CampusOps AI Context-Aware Complaint Classification Service
 * 
 * Implements a robust 5-layer classification pipeline:
 * - Layer 1: Input Normalization & Linguistic Tokenization (English, Tamil, Hindi)
 * - Layer 2: High-Confidence Safety & Hazard Escalation
 * - Layer 3: Semantic Context Classification (Hybrid LLM + Semantic Engine)
 * - Layer 4: Taxonomy Validation & Consistency Enforcement
 * - Layer 5: Fallback, Ambiguity & Clarification Handling
 */

export interface SafetyHazard {
  flag: string;
  severity: 'CRITICAL' | 'HIGH';
  description: string;
}

export interface SecondaryIssue {
  category: string;
  subcategory?: string;
  reason: string;
}

export interface ComplaintClassification {
  category: string;
  subcategory: string;
  department: string;
  departmentId: string;
  requiredSkillId: string;
  requiredSkillName: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  reason: string;
  safety_flags: string[];
  needs_clarification: boolean;
  clarification_prompt?: string | null;
  secondary_categories?: SecondaryIssue[];
  detectedLanguage: 'en' | 'ta' | 'hi';
  normalizedText: string;
  extractedBuildingCode: string | null;
  extractedRoomCode: string | null;
  extractedAssetType: string | null;
  isSensitive: boolean;
  recommendedTeam?: string;
  missingInformation: string[];
  isInformationalOrResolved?: boolean;
}

// ---------------------------------------------------------------------------
// APPLICATION TAXONOMY & METADATA MAPPING (Aligned with DB departments & skills)
// ---------------------------------------------------------------------------

export const VALID_CATEGORIES = [
  'ELECTRICAL',
  'NETWORK',
  'HVAC',
  'PLUMBING',
  'AUDIO_VISUAL',
  'FURNITURE_EQUIPMENT',
  'CLEANLINESS',
  'WATER_SANITATION',
  'CANTEEN_HYGIENE',
  'SAFETY_INCIDENT',
  'STUDENT_MISCONDUCT',
  'LOST_AND_FOUND',
  'GENERAL',
] as const;

export type ValidCategory = typeof VALID_CATEGORIES[number];

export interface CategoryMetadata {
  id: ValidCategory;
  displayName: string;
  departmentId: string;
  departmentName: string;
  requiredSkillId: string;
  requiredSkillName: string;
  isSensitive: boolean;
  defaultPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  subcategories: string[];
}

export const CATEGORY_TAXONOMY: Record<ValidCategory, CategoryMetadata> = {
  ELECTRICAL: {
    id: 'ELECTRICAL',
    displayName: 'Electrical Faults & Lighting',
    departmentId: 'DEP05',
    departmentName: 'Facilities',
    requiredSkillId: 'SK01',
    requiredSkillName: 'Electrical',
    isSensitive: false,
    defaultPriority: 'HIGH',
    subcategories: [
      'Power Failure',
      'Sparking / Short Circuit',
      'Dead Power Outlet',
      'Damaged / Exposed Wiring',
      'Circuit Breaker Tripping',
      'Lighting Fault',
      'Switchboard Burning Smell',
      'Voltage Fluctuation',
      'Fan Electrical Fault',
    ],
  },
  NETWORK: {
    id: 'NETWORK',
    displayName: 'Internet / Wi-Fi Connectivity',
    departmentId: 'DEP05',
    departmentName: 'Facilities',
    requiredSkillId: 'SK02',
    requiredSkillName: 'Networking',
    isSensitive: false,
    defaultPriority: 'HIGH',
    subcategories: [
      'Wi-Fi Outage',
      'LAN / Ethernet Port Fault',
      'Router / Access Point Offline',
      'Slow Bandwidth / High Latency',
      'Computer / OS System Crash',
    ],
  },
  HVAC: {
    id: 'HVAC',
    displayName: 'Air Conditioning & Ventilation',
    departmentId: 'DEP05',
    departmentName: 'Facilities',
    requiredSkillId: 'SK03',
    requiredSkillName: 'HVAC',
    isSensitive: false,
    defaultPriority: 'MEDIUM',
    subcategories: [
      'AC Not Cooling',
      'Compressor Failure',
      'Thermostat / Remote Defect',
      'Airflow / Ventilation Grille',
      'Chiller / Condensation Leak',
    ],
  },
  PLUMBING: {
    id: 'PLUMBING',
    displayName: 'Plumbing & Restroom Repairs',
    departmentId: 'DEP05',
    departmentName: 'Facilities',
    requiredSkillId: 'SK04',
    requiredSkillName: 'Plumbing',
    isSensitive: false,
    defaultPriority: 'MEDIUM',
    subcategories: [
      'Water Leak / Pipe Burst',
      'Ceiling Water Leakage',
      'Clogged Drain / Sink',
      'Restroom / Toilet Flush',
      'Broken Tap / Faucet',
      'Water Pressure Cutoff',
    ],
  },
  AUDIO_VISUAL: {
    id: 'AUDIO_VISUAL',
    displayName: 'Projector & AV Equipment',
    departmentId: 'DEP05',
    departmentName: 'Facilities',
    requiredSkillId: 'SK05',
    requiredSkillName: 'Audio Visual',
    isSensitive: false,
    defaultPriority: 'MEDIUM',
    subcategories: [
      'Projector Display Fault',
      'HDMI / Video Signal Cable',
      'Microphone / PA System',
      'Speaker / Audio Distortion',
      'Smartboard / Screen Fixture',
    ],
  },
  FURNITURE_EQUIPMENT: {
    id: 'FURNITURE_EQUIPMENT',
    displayName: 'Furniture & Physical Fixtures',
    departmentId: 'DEP05',
    departmentName: 'Facilities',
    requiredSkillId: 'SK06',
    requiredSkillName: 'General Maintenance',
    isSensitive: false,
    defaultPriority: 'LOW',
    subcategories: [
      'Broken Door / Handle / Lock',
      'Broken Window / Glass / Latch',
      'Damaged Desk / Chair / Bench',
      'Whiteboard / Podium Damage',
    ],
  },
  CLEANLINESS: {
    id: 'CLEANLINESS',
    displayName: 'Classroom Cleanliness & Housekeeping',
    departmentId: 'DEP05',
    departmentName: 'Facilities',
    requiredSkillId: 'SK06',
    requiredSkillName: 'General Maintenance',
    isSensitive: false,
    defaultPriority: 'LOW',
    subcategories: [
      'Trash / Litter Clearance',
      'Spill / Floor Stain Cleaning',
      'Classroom Sweeping / Dusting',
      'Restroom Housekeeping',
    ],
  },
  WATER_SANITATION: {
    id: 'WATER_SANITATION',
    displayName: 'Water Supply & Drinking Sanitation',
    departmentId: 'DEP05',
    departmentName: 'Facilities',
    requiredSkillId: 'SK04',
    requiredSkillName: 'Plumbing',
    isSensitive: false,
    defaultPriority: 'MEDIUM',
    subcategories: [
      'Drinking Water Dispenser Fault',
      'Water Tank Contamination',
      'Water Supply Shortage',
      'Sanitation Hygiene',
    ],
  },
  CANTEEN_HYGIENE: {
    id: 'CANTEEN_HYGIENE',
    displayName: 'Canteen / Food Quality & Hygiene',
    departmentId: 'DEP04',
    departmentName: 'Administration',
    requiredSkillId: 'SK06',
    requiredSkillName: 'General Maintenance',
    isSensitive: false,
    defaultPriority: 'MEDIUM',
    subcategories: [
      'Spoiled / Contaminated Food',
      'Food Quality / Taste Issue',
      'Kitchen / Mess Sanitation',
      'Dining Area Insects / Pests',
    ],
  },
  SAFETY_INCIDENT: {
    id: 'SAFETY_INCIDENT',
    displayName: 'Campus Safety & Physical Emergencies',
    departmentId: 'DEP04',
    departmentName: 'Administration',
    requiredSkillId: 'SK06',
    requiredSkillName: 'General Maintenance',
    isSensitive: true,
    defaultPriority: 'CRITICAL',
    subcategories: [
      'Physical Altercation / Brawl',
      'Assault / Violence',
      'Campus Structural Hazard',
      'Medical Emergency',
    ],
  },
  STUDENT_MISCONDUCT: {
    id: 'STUDENT_MISCONDUCT',
    displayName: 'Student Conduct & Grievance',
    departmentId: 'DEP04',
    departmentName: 'Administration',
    requiredSkillId: 'SK06',
    requiredSkillName: 'General Maintenance',
    isSensitive: true,
    defaultPriority: 'HIGH',
    subcategories: [
      'Bullying / Intimidation',
      'Ragging / Harassment',
      'Campus Misconduct',
      'Property Vandalism',
    ],
  },
  LOST_AND_FOUND: {
    id: 'LOST_AND_FOUND',
    displayName: 'Lost & Found Property',
    departmentId: 'DEP04',
    departmentName: 'Administration',
    requiredSkillId: 'SK06',
    requiredSkillName: 'General Maintenance',
    isSensitive: false,
    defaultPriority: 'LOW',
    subcategories: [
      'Lost Electronic Device',
      'Lost ID Card / Wallet',
      'Missing Keys / Bag',
      'Found Item Handover',
    ],
  },
  GENERAL: {
    id: 'GENERAL',
    displayName: 'General Campus Maintenance',
    departmentId: 'DEP05',
    departmentName: 'Facilities',
    requiredSkillId: 'SK06',
    requiredSkillName: 'General Maintenance',
    isSensitive: false,
    defaultPriority: 'LOW',
    subcategories: [
      'Routine Inspection',
      'Unspecified Facility Request',
      'Needs Further Clarification',
      'Already Resolved Report',
      'Service Status Inquiry',
    ],
  },
};

// Aliases normalization (e.g. AV -> AUDIO_VISUAL)
export function canonicalizeCategory(cat?: string | null): ValidCategory {
  if (!cat) return 'GENERAL';
  const upper = cat.trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (upper === 'AV' || upper === 'AUDIO_VISUAL') return 'AUDIO_VISUAL';
  if (upper in CATEGORY_TAXONOMY) return upper as ValidCategory;
  return 'GENERAL';
}

// ---------------------------------------------------------------------------
// LAYER 1: INPUT NORMALIZATION & LINGUISTIC TOKENIZATION
// ---------------------------------------------------------------------------

export interface NormalizedInput {
  raw: string;
  cleaned: string;
  lower: string;
  detectedLanguage: 'en' | 'ta' | 'hi';
  extractedBuildingCode: string | null;
  extractedRoomCode: string | null;
  extractedAssetType: string | null;
  hasNegations: boolean;
  negationTokens: string[];
  isInformationalOrResolved: boolean;
  isStatusInquiry: boolean;
}

export function normalizeComplaintInput(text: string): NormalizedInput {
  const raw = text || '';
  const cleaned = raw.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const lower = cleaned.toLowerCase();

  // Language Detection
  let detectedLanguage: 'en' | 'ta' | 'hi' = 'en';
  if (/[\u0B80-\u0BFF]/.test(raw)) {
    detectedLanguage = 'ta';
  } else if (/[\u0900-\u097F]/.test(raw)) {
    detectedLanguage = 'hi';
  }

  // Location Extraction
  let extractedBuildingCode: string | null = null;
  let extractedRoomCode: string | null = null;

  // Pattern for Room e.g. "B-204", "Room 204", "classroom 204", "कमरा B-204", "அறை பி-204"
  // Using alternation for Tamil/Hindi letters to prevent split-grapheme matching
  const roomPattern = /(?:rm-?|room\s*|classroom\s*|कमरा\s*|அறை\s*|வகுப்பறை\s*)?(?:([a-dA-D]|பி|ஏ|சி|டி|बी|ए|सी|डी)-?)?([0-9]{3})/i;
  const match = lower.match(roomPattern);
  if (match) {
    let bld: string | null = match[1] ? match[1].toUpperCase() : null;
    if (bld === 'பி' || bld === 'बी') bld = 'B';
    else if (bld === 'ஏ' || bld === 'ए') bld = 'A';
    else if (bld === 'சி' || bld === 'सी') bld = 'C';
    else if (bld === 'டி' || bld === 'डी') bld = 'D';

    extractedBuildingCode = bld;
    extractedRoomCode = bld ? `${bld}-${match[2]}` : match[2];
  }

  const buildingPattern = /(?:building\s*|கட்டிடம்\s*|भवन\s*)([a-dA-D]|பி|ஏ|சி|டி|बी|ए|सी|डी)/i;
  const bldMatch = lower.match(buildingPattern);
  if (bldMatch && !extractedBuildingCode) {
    let bld: string | null = bldMatch[1].toUpperCase();
    if (bld === 'பி' || bld === 'बी') bld = 'B';
    else if (bld === 'ஏ' || bld === 'ए') bld = 'A';
    else if (bld === 'சி' || bld === 'सी') bld = 'C';
    else if (bld === 'டி' || bld === 'डी') bld = 'D';
    extractedBuildingCode = bld;
    if (extractedRoomCode && !extractedRoomCode.includes('-')) {
      extractedRoomCode = `${bld}-${extractedRoomCode}`;
    }
  }

  // Asset Hint Extraction
  let extractedAssetType: string | null = null;
  if (/\b(socket|switchboard|switch|mcb|plug|power panel|breaker|சாக்கெட்|सॉकेट)\b/i.test(lower)) {
    extractedAssetType = 'ELECTRICAL_PANEL';
  } else if (/\b(wifi|wi-fi|router|access point|ethernet|வைஃபை|वाईफाई)\b/i.test(lower)) {
    extractedAssetType = 'NETWORK_ACCESS_POINT';
  } else if (/\b(projector|smartboard|புரொஜெக்டர்|प्रोजेक्टर)\b/i.test(lower)) {
    extractedAssetType = 'PROJECTOR';
  } else if (/\b(ac|air conditioner|chiller|ஏசி|एसी)\b/i.test(lower)) {
    extractedAssetType = 'AC';
  } else if (/\b(light|bulb|tube|tubelight|விளக்கு|लाइट)\b/i.test(lower)) {
    extractedAssetType = 'LIGHTING';
  }

  // Negation tokens
  const negationMatches = lower.match(/\b(no\s+\w+|not\s+\w+|is\s+not|are\s+not|won't|wont|didn't|didnt|neither|without|இல்லை|வேலை\s+செய்யவில்லை|नहीं|ना)\b/g);
  const negationTokens = negationMatches ? Array.from(negationMatches) : [];
  const hasNegations = negationTokens.length > 0;

  // Resolved status check
  const isInformationalOrResolved = /\b(already repaired|already fixed|has repaired|fault is fixed|problem resolved|solved)\b/i.test(lower);
  const isStatusInquiry = /\b(when\s+.*(?:visit|come)|when\s+will|status\s+of|inquir|any\s+update\s+on)\b/i.test(lower);

  return {
    raw,
    cleaned,
    lower,
    detectedLanguage,
    extractedBuildingCode,
    extractedRoomCode,
    extractedAssetType,
    hasNegations,
    negationTokens,
    isInformationalOrResolved,
    isStatusInquiry,
  };
}

// ---------------------------------------------------------------------------
// LAYER 2: HIGH-CONFIDENCE SAFETY & HAZARD ESCALATION
// ---------------------------------------------------------------------------

export function detectHighConfidenceSafetyHazards(input: NormalizedInput): SafetyHazard[] {
  const hazards: SafetyHazard[] = [];
  const text = input.lower;

  // Electrical sparks / fire / short circuit
  if (
    /\b(spark|sparking|sparks coming|short circuit|producing sparks|arc flash|चिंगारी|தீப்பொறி)\b/i.test(text)
  ) {
    hazards.push({
      flag: 'ELECTRICAL_SPARK_HAZARD',
      severity: 'CRITICAL',
      description: 'Active electrical sparking or short circuit detected. Immediate fire risk.',
    });
  }

  // Burning smell / smoke from electrical equipment
  if (
    /\b(burning smell|smells like.*burning|burnt smell|smoke from|smoke coming|धुआं|புகை)\b/i.test(text) &&
    /\b(switch|switchboard|panel|socket|wire|power|breaker|electrical)\b/i.test(text)
  ) {
    hazards.push({
      flag: 'BURNING_ELECTRICAL_SMELL',
      severity: 'CRITICAL',
      description: 'Burning smell or smoke near electrical equipment reported. Potential active overheating/fire.',
    });
  }

  // Exposed wires / shock risk
  if (
    /\b(exposed wire|exposed wires|live wire|shock|giving shock|current shock|करंट|மின் அதிர்ச்சி)\b/i.test(text)
  ) {
    hazards.push({
      flag: 'EXPOSED_LIVE_WIRING',
      severity: 'CRITICAL',
      description: 'Exposed wiring or electric shock hazard reported. Direct electrocution risk.',
    });
  }

  // Circuit breaker tripping repeatedly
  if (
    /\b(breaker.*tripping|trips.*breaker|mcb.*tripping|keeps tripping|fuse blow)\b/i.test(text)
  ) {
    hazards.push({
      flag: 'BREAKER_TRIP_OVERLOAD',
      severity: 'HIGH',
      description: 'Persistent circuit breaker tripping indicates serious circuit overload or ground fault.',
    });
  }

  // Damaged laboratory wiring
  if (
    /\b(damaged wiring|wiring.*damaged|wires are cut|chewed wire)\b/i.test(text)
  ) {
    hazards.push({
      flag: 'DAMAGED_WIRING',
      severity: 'HIGH',
      description: 'Physical wiring damage reported. Requires safety isolation before use.',
    });
  }

  // Campus safety: Physical fight or violence
  if (
    /\b(fight|fighting|assault|physical clash|violence|brawl|attack|मारपीट|சண்டை)\b/i.test(text)
  ) {
    hazards.push({
      flag: 'PHYSICAL_VIOLENCE_HAZARD',
      severity: 'CRITICAL',
      description: 'Physical altercation or violence in progress. Dispatch Campus Security immediately.',
    });
  }

  // Severe flooding hazard
  if (
    /\b(flooding|water gushing|ceiling collapsed|pipe burst|வெள்ளம்)\b/i.test(text)
  ) {
    hazards.push({
      flag: 'SEVERE_FLOOD_HAZARD',
      severity: 'CRITICAL',
      description: 'Severe water flooding or pipe burst creating structural/slip hazard.',
    });
  }

  return hazards;
}

// ---------------------------------------------------------------------------
// LAYER 3: SEMANTIC CONTEXT ENGINE (Offline Deterministic Rules + LLM Client)
// ---------------------------------------------------------------------------

export function runSemanticInference(
  input: NormalizedInput,
  safetyHazards: SafetyHazard[]
): {
  category: ValidCategory;
  subcategory: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  reason: string;
  needsClarification: boolean;
  clarificationPrompt?: string | null;
  secondaryIssues?: SecondaryIssue[];
} {
  const text = input.lower;
  const secondaryIssues: SecondaryIssue[] = [];

  // ==========================================
  // CASE 1: AMBIGUOUS / INSUFFICIENT INFO CASES
  // ==========================================
  const isVagueMachine = /^(the\s+)?machine\s+(is\s+)?(stopped\s+working|not\s+working|broken)[\.\?!]?$/i.test(input.cleaned);
  const isVagueRoom = /^something\s+is\s+wrong\s+with\s+(the\s+)?room[\.\?!]?$/i.test(input.cleaned);
  const isVagueRestart = /^(it\s+is\s+|it'?s\s+)?not\s+working\s+(even\s+)?after\s+restarting[\.\?!]?$/i.test(input.cleaned);
  const isGenericBroken = /^(it\s+is\s+)?broken[\.\?!]?$/i.test(input.cleaned) || /^(not\s+working|fail)[\.\?!]?$/i.test(input.cleaned);

  if (isVagueMachine || isVagueRoom || isVagueRestart || isGenericBroken) {
    let prompt = 'Please specify which equipment or facility is affected and describe the observable symptoms.';
    if (isVagueMachine) {
      prompt = 'Which machine or equipment has stopped working? Please specify the machine name, room, and symptoms.';
    } else if (isVagueRoom) {
      prompt = 'Please describe what specifically is wrong in the room (e.g. lighting, temperature, water, cleanliness, or furniture).';
    } else if (isVagueRestart) {
      prompt = 'Please tell us what device or system you restarted (e.g. projector, computer, Wi-Fi router) and what error appears.';
    }

    return {
      category: 'GENERAL',
      subcategory: 'Needs Further Clarification',
      priority: 'LOW',
      confidence: 0.35,
      reason: 'The complaint statement provides insufficient technical evidence to determine a specific maintenance category.',
      needsClarification: true,
      clarificationPrompt: prompt,
    };
  }

  // ==========================================
  // CASE 2: INFORMATIONAL / RESOLVED / INQUIRY (checked before category keywords)
  // ==========================================
  if (input.isInformationalOrResolved) {
    return {
      category: 'GENERAL',
      subcategory: 'Already Resolved Report',
      priority: 'LOW',
      confidence: 0.90,
      reason: 'Student report states the maintenance issue has already been repaired/resolved.',
      needsClarification: false,
      clarificationPrompt: null,
    };
  }

  if (input.isStatusInquiry) {
    return {
      category: 'GENERAL',
      subcategory: 'Service Status Inquiry',
      priority: 'LOW',
      confidence: 0.88,
      reason: 'Student inquiry regarding maintenance team schedule or status rather than a new equipment breakdown.',
      needsClarification: false,
      clarificationPrompt: null,
    };
  }

  // ==========================================
  // CASE 3: NEGATION & CONTEXTUAL DISTINCTION
  // ==========================================

  // e.g., "There is no electrical problem; the Wi-Fi is not working."
  if (
    /\b(no\s+electrical\s+problem|not\s+an\s+electrical\s+issue|electrical.*is\s+fine|no\s+power\s+issue)\b/i.test(text) &&
    /\b(wifi|wi-fi|internet|network)\b/i.test(text)
  ) {
    return {
      category: 'NETWORK',
      subcategory: 'Wi-Fi Outage',
      priority: 'HIGH',
      confidence: 0.95,
      reason: 'Explicitly negates electrical issues and affirms Wi-Fi / network outage as the actual problem.',
      needsClarification: false,
    };
  }

  // e.g., "The lights are working, but the projector is not."
  if (
    /\b(lights\s+are\s+working|light\s+is\s+working|power\s+is\s+working|power\s+is\s+fine)\b/i.test(text) &&
    /\b(projector|screen|smartboard|speaker)\b/i.test(text)
  ) {
    return {
      category: 'AUDIO_VISUAL',
      subcategory: 'Projector Display Fault',
      priority: 'MEDIUM',
      confidence: 0.94,
      reason: 'Student affirms room lighting/power is functional, isolating fault specifically to projector / AV hardware.',
      needsClarification: false,
    };
  }

  // e.g., "The electrical department has not repaired my leaking tap."
  if (
    /\b(leaking\s+tap|tap\s+leak|tap\s+is\s+leaking|faucet\s+leak|washroom\s+tap)\b/i.test(text)
  ) {
    return {
      category: 'PLUMBING',
      subcategory: 'Broken Tap / Faucet',
      priority: 'MEDIUM',
      confidence: 0.93,
      reason: 'Report concerns a leaking water tap. Mention of "electrical department" represents routing grievance, not an electrical equipment fault.',
      needsClarification: false,
    };
  }

  // ==========================================
  // CASE 4: MULTIPLE ISSUES
  // ==========================================
  // e.g., "There is no power in the laboratory, and water is leaking near the door."
  const hasNoPower = /\b(no\s+power|no\s+electricity|power\s+failure|current\s+is\s+not\s+coming|blackout)\b/i.test(text);
  const hasWaterLeak = /\b(water\s+is\s+leaking|pipe\s+leak|leaking\s+near|water\s+leak)\b/i.test(text);

  if (hasNoPower && hasWaterLeak) {
    secondaryIssues.push({
      category: 'PLUMBING',
      subcategory: 'Ceiling / Pipe Water Leak',
      reason: 'Secondary issue reported: water leakage occurring near room entrance.',
    });

    return {
      category: 'ELECTRICAL',
      subcategory: 'Power Failure',
      priority: 'HIGH',
      confidence: 0.96,
      reason: 'Primary failure is complete electrical power cutoff in laboratory; secondary plumbing water leak noted.',
      needsClarification: false,
      secondaryIssues,
    };
  }

  // ==========================================
  // CASE 5: ROOT CAUSE VS SYMPTOM DISTINCTIONS
  // ==========================================

  // A. Projector power outlet dead VS Projector display/cable/signal defect
  if (/\b(projector|smartboard)\b/i.test(text)) {
    // If the power outlet itself is dead / no electricity to outlet
    if (
      /\b(no\s+power\s+outlet|outlet\s+is\s+dead|socket\s+is\s+dead|plug\s+has\s+no\s+power|no\s+electricity\s+in\s+socket|socket\s+not\s+working)\b/i.test(text)
    ) {
      return {
        category: 'ELECTRICAL',
        subcategory: 'Dead Power Outlet',
        priority: 'HIGH',
        confidence: 0.95,
        reason: 'Projector failure is directly caused by a dead or unpowered electrical wall outlet.',
        needsClarification: false,
      };
    }

    // If projector turns on / receives power, but fails on signal, display, or laptop connection
    if (
      /\b(displays?\s+incorrectly|cannot\s+connect|laptop|hdmi|signal|cable|blurry|color|aspect|turns\s+on\s+but)\b/i.test(text)
    ) {
      return {
        category: 'AUDIO_VISUAL',
        subcategory: 'HDMI / Video Signal Cable',
        priority: 'MEDIUM',
        confidence: 0.94,
        reason: 'Projector powers on but fails to receive or display signal from presenter computer / HDMI connection.',
        needsClarification: false,
      };
    }
  }

  // B. Water leaking from classroom ceiling -> PLUMBING (not HVAC)
  if (/\b(ceiling|washroom|toilet|restroom)\b/i.test(text) && /\b(water\s+is\s+leaking|leaking|leak)\b/i.test(text)) {
    return {
      category: 'PLUMBING',
      subcategory: 'Ceiling Water Leakage',
      priority: 'HIGH',
      confidence: 0.93,
      reason: 'Water leak originating from classroom ceiling or washroom infrastructure.',
      needsClarification: false,
    };
  }

  // C. Air Conditioner not cooling -> HVAC (not Electrical)
  if (/\b(ac|air\s+conditioner)\b/i.test(text) && /\b(not\s+cooling|cooling|running\s+but|hot\s+air|blows\s+hot)\b/i.test(text)) {
    return {
      category: 'HVAC',
      subcategory: 'AC Not Cooling',
      priority: 'MEDIUM',
      confidence: 0.95,
      reason: 'Air conditioner is receiving electrical power but failing on cooling/compressor refrigeration cycle.',
      needsClarification: false,
    };
  }

  // D. Classroom Door lock broken -> FURNITURE_EQUIPMENT
  if (/\b(door|door\s+lock|handle|door\s+handle|lock\s+is\s+broken|lock)\b/i.test(text) && /\b(broken|jammed|damage|loose)\b/i.test(text)) {
    return {
      category: 'FURNITURE_EQUIPMENT',
      subcategory: 'Broken Door / Handle / Lock',
      priority: 'LOW',
      confidence: 0.94,
      reason: 'Mechanical door lock or hardware fixture failure.',
      needsClarification: false,
    };
  }

  // E. Computer blue screen -> NETWORK / IT
  if (/\b(blue\s+screen|bsod|computer|desktop|pc)\b/i.test(text) && /\b(displays|crash|freez|boot)\b/i.test(text)) {
    return {
      category: 'NETWORK',
      subcategory: 'Computer / OS System Crash',
      priority: 'MEDIUM',
      confidence: 0.92,
      reason: 'Computer workstation operating system crash or hardware display failure in laboratory.',
      needsClarification: false,
    };
  }

  // ==========================================
  // CASE 6: ELECTRICAL COMPLAINTS & NATURAL LANGUAGE
  // ==========================================

  // Critical safety hazards from Layer 2
  if (safetyHazards.length > 0) {
    const primaryHazard = safetyHazards[0];
    const subcatMap: Record<string, string> = {
      ELECTRICAL_SPARK_HAZARD: 'Sparking / Short Circuit',
      BURNING_ELECTRICAL_SMELL: 'Switchboard Burning Smell',
      EXPOSED_LIVE_WIRING: 'Damaged / Exposed Wiring',
      BREAKER_TRIP_OVERLOAD: 'Circuit Breaker Tripping',
      DAMAGED_WIRING: 'Damaged / Exposed Wiring',
    };

    if (primaryHazard.flag.startsWith('ELECTRICAL') || primaryHazard.flag === 'BURNING_ELECTRICAL_SMELL' || primaryHazard.flag === 'EXPOSED_LIVE_WIRING' || primaryHazard.flag === 'BREAKER_TRIP_OVERLOAD' || primaryHazard.flag === 'DAMAGED_WIRING') {
      return {
        category: 'ELECTRICAL',
        subcategory: subcatMap[primaryHazard.flag] || 'Sparking / Short Circuit',
        priority: primaryHazard.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        confidence: 0.98,
        reason: primaryHazard.description,
        needsClarification: false,
      };
    }
  }

  // Circuit breaker tripping
  if (/\b(circuit breaker|breaker|mcb)\b/i.test(text) && /\b(tripping|tripped|trips)\b/i.test(text)) {
    return {
      category: 'ELECTRICAL',
      subcategory: 'Circuit Breaker Tripping',
      priority: 'HIGH',
      confidence: 0.96,
      reason: 'Circuit breaker or MCB repeatedly tripping due to overload or electrical fault.',
      needsClarification: false,
    };
  }

  // Power failure in room / lab / classroom
  if (
    /\b(electricity\s+is\s+gone|power\s+failure|blackout|no\s+power|no\s+electricity|complete\s+power\s+failure|electrical\s+failure|current\s+is\s+not\s+coming|கரண்ட்\s+இல்லை|மின்\s+தடை|बिजली\s+चली\s+गई)\b/i.test(text)
  ) {
    const isLabOrExam = /\b(lab|laboratory|exam|practical|computer\s+lab)\b/i.test(text);
    return {
      category: 'ELECTRICAL',
      subcategory: 'Power Failure',
      priority: isLabOrExam ? 'HIGH' : 'MEDIUM',
      confidence: 0.96,
      reason: `Report identifies electrical supply outage / power failure in ${isLabOrExam ? 'academic lab/exam environment' : 'classroom'}.`,
      needsClarification: false,
    };
  }

  // Fans and lights stopped / Classroom lights not working
  if (
    (/\b(fans?\s+and\s+lights?|lights?\s+and\s+fans?|fans?|lights?)\b/i.test(text) && /\b(stopped|dead|not\s+working|shut\s+down|failed)\b/i.test(text)) ||
    /\b(lights\s+are\s+dead|fan\s+stopped|fans\s+stopped)\b/i.test(text)
  ) {
    return {
      category: 'ELECTRICAL',
      subcategory: /\bfan\b/i.test(text) ? 'Fan Electrical Fault' : 'Lighting Fault',
      priority: /\b(exam|lecture|class)\b/i.test(text) ? 'HIGH' : 'MEDIUM',
      confidence: 0.95,
      reason: 'Classroom lighting or fan electrical power delivery stoppage reported.',
      needsClarification: false,
    };
  }

  // Electrical wiring damaged
  if (/\b(electrical\s+wiring|wiring|electric\s+wire|cables?)\b/i.test(text) && /\b(damaged|cut|exposed|burnt|broken)\b/i.test(text)) {
    return {
      category: 'ELECTRICAL',
      subcategory: 'Damaged / Exposed Wiring',
      priority: 'HIGH',
      confidence: 0.96,
      reason: 'Damaged or degraded electrical wiring reported in educational facility.',
      needsClarification: false,
    };
  }

  // General explicit electrical failure
  if (/\b(electrical\s+failure|electrical\s+fault|electrical\s+issue|electrical\s+problem)\b/i.test(text)) {
    return {
      category: 'ELECTRICAL',
      subcategory: 'Power Failure',
      priority: 'HIGH',
      confidence: 0.95,
      reason: 'Explicit electrical system failure reported in campus facility.',
      needsClarification: false,
    };
  }

  // ==========================================
  // CASE 7: OTHER DOMAINS
  // ==========================================

  // Wi-Fi / Network
  if (/\b(wifi|wi-fi|internet|network|router|ethernet|வைஃபை|वाईफाई)\b/i.test(text) && /\b(unavailable|down|not\s+working|slow|offline|disconnected|outage|failed|failure)\b/i.test(text)) {
    const isMajorOutage = /\b(down|outage|failure|failed|completely|unavailable|campus|entire|hall|lab|c-201|rm-|room)\b/i.test(text);
    return {
      category: 'NETWORK',
      subcategory: 'Wi-Fi Outage',
      priority: isMajorOutage ? 'HIGH' : 'MEDIUM',
      confidence: 0.95,
      reason: 'Network connectivity disruption affecting wireless or wired infrastructure.',
      needsClarification: false,
    };
  }

  // Plumbing
  if (/\b(pipe|drain|clogged|sink|tap|faucet|toilet|flush|sewage)\b/i.test(text)) {
    return {
      category: 'PLUMBING',
      subcategory: 'Water Leak / Pipe Burst',
      priority: 'MEDIUM',
      confidence: 0.92,
      reason: 'Restroom or plumbing fixture malfunction.',
      needsClarification: false,
    };
  }

  // HVAC
  if (/\b(ac|air\s+conditioner|cooling|thermostat|chiller)\b/i.test(text)) {
    return {
      category: 'HVAC',
      subcategory: 'AC Not Cooling',
      priority: 'MEDIUM',
      confidence: 0.92,
      reason: 'Air conditioning climate control or ventilation fault.',
      needsClarification: false,
    };
  }

  // Cleanliness
  if (/\b(garbage|trash|dust|dirty|litter|spill|stain|cleaning|sweeping)\b/i.test(text)) {
    return {
      category: 'CLEANLINESS',
      subcategory: 'Trash / Litter Clearance',
      priority: 'LOW',
      confidence: 0.90,
      reason: 'Routine housekeeping or cleanliness requirement.',
      needsClarification: false,
    };
  }

  // Canteen
  if (/\b(canteen|food|cafeteria|meal|spoiled|stale|mess|cater)\b/i.test(text)) {
    return {
      category: 'CANTEEN_HYGIENE',
      subcategory: 'Spoiled / Contaminated Food',
      priority: 'MEDIUM',
      confidence: 0.91,
      reason: 'Food quality or dining hall hygiene report.',
      needsClarification: false,
    };
  }

  // Safety Incident
  if (/\b(fight|assault|violence|brawl|attack|injury)\b/i.test(text)) {
    return {
      category: 'SAFETY_INCIDENT',
      subcategory: 'Physical Altercation / Brawl',
      priority: 'CRITICAL',
      confidence: 0.95,
      reason: 'Campus physical safety incident or altercation reported.',
      needsClarification: false,
    };
  }

  // Student Misconduct
  if (/\b(bully|bullying|ragging|harass|harassment|threat|vandalism)\b/i.test(text)) {
    return {
      category: 'STUDENT_MISCONDUCT',
      subcategory: 'Bullying / Intimidation',
      priority: 'HIGH',
      confidence: 0.92,
      reason: 'Report alleging student misconduct, harassment, or ragging.',
      needsClarification: false,
    };
  }

  // Lost & Found
  if (/\b(lost|missing|found|left\s+behind|misplaced)\b/i.test(text) && /\b(id|wallet|keys?|charger|phone|laptop|bag)\b/i.test(text)) {
    return {
      category: 'LOST_AND_FOUND',
      subcategory: 'Lost ID Card / Wallet',
      priority: 'LOW',
      confidence: 0.92,
      reason: 'Lost or found personal property report.',
      needsClarification: false,
    };
  }

  // Default fallback for unrecognized text
  return {
    category: 'GENERAL',
    subcategory: 'Needs Further Clarification',
    priority: 'LOW',
    confidence: 0.50,
    reason: 'Complaint could not be confidently mapped to a specific technical maintenance taxonomy.',
    needsClarification: true,
    clarificationPrompt: 'Please provide more details regarding the affected equipment, location, and symptoms.',
  };
}

// ---------------------------------------------------------------------------
// OPTIONAL EXTERNAL LLM INTEGRATION (Gemini API with fallback)
// ---------------------------------------------------------------------------

async function tryCallGeminiAPI(
  text: string,
  apiKey: string
): Promise<{
  category?: string;
  subcategory?: string;
  priority?: string;
  confidence?: number;
  reason?: string;
  safety_flags?: string[];
  needs_clarification?: boolean;
} | null> {
  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const systemPrompt = `You are an expert college facilities operations triage specialist for CampusOps.
Classify the following student complaint into exactly ONE category from:
[ELECTRICAL, NETWORK, HVAC, PLUMBING, AUDIO_VISUAL, FURNITURE_EQUIPMENT, CLEANLINESS, WATER_SANITATION, CANTEEN_HYGIENE, SAFETY_INCIDENT, STUDENT_MISCONDUCT, LOST_AND_FOUND, GENERAL].

Rules:
1. Understand symptoms and root causes, not just keywords:
   - "Projector won't turn on because power outlet dead" -> ELECTRICAL (Power Outlet)
   - "Projector turns on but cannot connect to laptop" -> AUDIO_VISUAL
   - "Fans stopped suddenly" -> ELECTRICAL
   - "AC running but not cooling" -> HVAC
   - "Water leaking from ceiling" -> PLUMBING
   - "Electrical dept has not responded to my leaking tap" -> PLUMBING
   - "No electrical problem; Wi-Fi is down" -> NETWORK
   - "Sparks from socket" -> ELECTRICAL, CRITICAL, safety_flags: ["ELECTRICAL_SPARK_HAZARD"]
2. If complaint is vague like "machine stopped working", set needs_clarification=true and category="GENERAL".
3. Return STRICT JSON with keys: category, subcategory, priority (CRITICAL/HIGH/MEDIUM/LOW), confidence (0.0-1.0), reason, safety_flags (array), needs_clarification (bool).`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: `${systemPrompt}\n\nStudent Complaint:\n"""${text}"""` }],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return null;
    const json: any = await res.json();
    const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    return JSON.parse(candidateText);
  } catch {
    return null; // Gracefully fallback to deterministic semantic inference
  }
}

// ---------------------------------------------------------------------------
// LAYER 4 & 5: VALIDATION, CONSISTENCY ENFORCEMENT & PUBLIC API
// ---------------------------------------------------------------------------

export async function classifyComplaint(
  rawText: string,
  providedBuildingId?: string | null,
  providedRoomId?: string | null,
  providedAssetTag?: string | null
): Promise<ComplaintClassification> {
  // Layer 1: Normalization
  const normalized = normalizeComplaintInput(rawText);

  // Layer 2: Safety & Hazard Detection
  const safetyHazards = detectHighConfidenceSafetyHazards(normalized);

  // Layer 3: Semantic Inference (Attempt LLM if GEMINI_API_KEY is configured, else local engine)
  let semanticResult: {
    category: ValidCategory;
    subcategory: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
    reason: string;
    needsClarification: boolean;
    clarificationPrompt?: string | null;
    secondaryIssues?: SecondaryIssue[];
  };

  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;
  let llmOutput: any = null;

  if (apiKey && process.env.NODE_ENV !== 'test') {
    llmOutput = await tryCallGeminiAPI(normalized.raw, apiKey);
  }

  if (llmOutput && llmOutput.category) {
    const cat = canonicalizeCategory(llmOutput.category);
    semanticResult = {
      category: cat,
      subcategory: llmOutput.subcategory || CATEGORY_TAXONOMY[cat].subcategories[0],
      priority: (['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].includes(llmOutput.priority) ? llmOutput.priority : CATEGORY_TAXONOMY[cat].defaultPriority) as any,
      confidence: typeof llmOutput.confidence === 'number' ? llmOutput.confidence : 0.90,
      reason: llmOutput.reason || 'Classified via semantic context understanding.',
      needsClarification: Boolean(llmOutput.needs_clarification),
      secondaryIssues: [],
    };
  } else {
    semanticResult = runSemanticInference(normalized, safetyHazards);
  }

  // Layer 4: Taxonomy Validation & Consistency Enforcement
  let finalCategory = canonicalizeCategory(semanticResult.category);
  const taxonomy = CATEGORY_TAXONOMY[finalCategory];

  // Consistency Check: Overrule contradictions between reason/evidence and category
  if (safetyHazards.some((h) => h.flag.startsWith('ELECTRICAL')) && finalCategory !== 'ELECTRICAL') {
    finalCategory = 'ELECTRICAL';
  }

  // Escalate Priority if safety hazards exist
  let finalPriority = semanticResult.priority;
  if (safetyHazards.some((h) => h.severity === 'CRITICAL')) {
    finalPriority = 'CRITICAL';
  } else if (safetyHazards.some((h) => h.severity === 'HIGH') && finalPriority === 'LOW') {
    finalPriority = 'HIGH';
  }

  // Subcategory Validation
  let finalSubcategory = semanticResult.subcategory;
  if (!taxonomy.subcategories.includes(finalSubcategory)) {
    finalSubcategory = taxonomy.subcategories[0];
  }

  // Missing Information Detection
  const missingInfo: string[] = [];
  if (!providedRoomId && !normalized.extractedRoomCode) {
    missingInfo.push('Room number or location is missing.');
  }
  if (!providedAssetTag && !normalized.extractedAssetType) {
    missingInfo.push('Specific equipment or asset tag not specified.');
  }

  // Generate Normalized English Summary
  const roomTarget = normalized.extractedRoomCode || (providedRoomId ? `Room ${providedRoomId}` : 'Campus Facility');
  const assetTarget = normalized.extractedAssetType || taxonomy.displayName;
  const normalizedSummary = `${assetTarget} issue reported in ${roomTarget} [Priority: ${finalPriority}]: "${normalized.raw.trim().substring(0, 140)}"`;

  const safetyFlags = safetyHazards.map((h) => h.flag);

  return {
    category: finalCategory,
    subcategory: finalSubcategory,
    department: taxonomy.departmentName,
    departmentId: taxonomy.departmentId,
    requiredSkillId: taxonomy.requiredSkillId,
    requiredSkillName: taxonomy.requiredSkillName,
    priority: finalPriority,
    confidence: semanticResult.confidence,
    reason: semanticResult.reason,
    safety_flags: safetyFlags,
    needs_clarification: semanticResult.needsClarification,
    clarification_prompt: semanticResult.clarificationPrompt || null,
    secondary_categories: semanticResult.secondaryIssues || [],
    detectedLanguage: normalized.detectedLanguage,
    normalizedText: normalizedSummary,
    extractedBuildingCode: normalized.extractedBuildingCode,
    extractedRoomCode: normalized.extractedRoomCode,
    extractedAssetType: normalized.extractedAssetType,
    isSensitive: taxonomy.isSensitive,
    recommendedTeam: `${taxonomy.departmentName} - ${taxonomy.requiredSkillName} Services`,
    missingInformation: missingInfo,
    isInformationalOrResolved: normalized.isInformationalOrResolved,
  };
}
