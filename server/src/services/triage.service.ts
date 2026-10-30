export interface TriageResult {
  category: string;
  suggestedPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  confidence: number;
  extractedBuildingCode: string | null;
  extractedRoomCode: string | null;
  extractedAssetType: string | null;
  missingInformation: string[];
  explanation: string;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ELECTRICAL: ['spark', 'sparking', 'electric', 'shock', 'power', 'socket', 'switch', 'mcb', 'wire', 'conduit', 'light', 'tube', 'blackout', 'short circuit'],
  NETWORK: ['wifi', 'wi-fi', 'internet', 'network', 'router', 'access point', 'transceiver', 'cable', 'cat6', 'ethernet', 'slow connection', 'offline', 'ping', 'dns', 'connectivity'],
  HVAC: ['ac', 'air conditioner', 'cooling', 'leak', 'water leak', 'compressor', 'heating', 'thermostat', 'chiller', 'fan coil', 'ventilation', 'temperature', 'humid'],
  PLUMBING: ['pipe', 'leak', 'drain', 'clog', 'clogged', 'toilet', 'flush', 'sink', 'faucet', 'valve', 'sewage', 'overflow', 'tap', 'water pressure'],
  AV: ['projector', 'screen', 'hdmi', 'mic', 'microphone', 'speaker', 'audio', 'sound', 'display', 'monitor', 'podium', 'av'],
};

const CRITICAL_KEYWORDS = ['spark', 'sparking', 'fire', 'smoke', 'shock', 'flood', 'flooding', 'hazard', 'explosion', 'danger', 'emergency', 'blackout'];
const HIGH_KEYWORDS = [
  'exam', 'exam hall', 'lecture', 'lab', 'practical',
  'no power', 'wifi down', 'no internet', 'network down', 'entire room',
  'offline', 'urgent', 'outage', 'completely down', 'connection is down',
  'internet is down', 'down in', 'disconnected', 'failed', 'failure', 'cut off'
];
const MEDIUM_KEYWORDS = ['slow', 'flicker', 'noise', 'dim', 'broken', 'not working', 'faucet leak', 'drips', 'ac hot', 'leak'];

export function runOfflineTriage(
  text: string,
  providedBuildingId?: string | null,
  providedRoomId?: string | null,
  providedAssetTag?: string | null
): TriageResult {
  const lowerText = text.toLowerCase();
  const missingInfo: string[] = [];

  // 1. Detect Category
  let detectedCategory = 'GENERAL';
  let maxMatches = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let matches = 0;
    for (const kw of keywords) {
      if (lowerText.includes(kw)) {
        matches++;
      }
    }
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedCategory = category;
    }
  }

  // 2. Detect Priority
  let suggestedPriority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
  let explanation = '';

  const hasCriticalKeyword = CRITICAL_KEYWORDS.some((kw) => lowerText.includes(kw));
  const hasHighKeyword = HIGH_KEYWORDS.some((kw) => lowerText.includes(kw));
  const hasMediumKeyword = MEDIUM_KEYWORDS.some((kw) => lowerText.includes(kw));

  // Network outage detection: wifi/internet/network/router + down/failed/disconnected/outage
  const isNetworkOutage =
    (lowerText.includes('wifi') || lowerText.includes('wi-fi') || lowerText.includes('internet') || lowerText.includes('network') || lowerText.includes('router')) &&
    (lowerText.includes('down') || lowerText.includes('failed') || lowerText.includes('disconnected') || lowerText.includes('outage'));

  if (hasCriticalKeyword) {
    suggestedPriority = 'CRITICAL';
    explanation = 'Elevated to CRITICAL due to safety hazards, electrical sparks, flood, or fire danger.';
  } else if (hasHighKeyword || isNetworkOutage || lowerText.includes('exam')) {
    suggestedPriority = 'HIGH';
    explanation = 'Elevated to HIGH due to classroom, academic lecture, or widespread network disruption.';
  } else if (hasMediumKeyword) {
    suggestedPriority = 'MEDIUM';
    explanation = 'Assigned MEDIUM priority for standard functional repair.';
  } else {
    suggestedPriority = 'LOW';
    explanation = 'Assigned standard LOW priority for routine maintenance.';
  }

  // 3. Extract Location from Text (e.g. "B-204", "Room 204", "Building B")
  let extractedBuildingCode: string | null = null;
  let extractedRoomCode: string | null = null;

  const roomPattern = /(?:rm-?|room\s*|#\s*)?([a-d])-?([0-9]{3})/i;
  const match = lowerText.match(roomPattern);
  if (match) {
    extractedBuildingCode = match[1].toUpperCase();
    extractedRoomCode = `${match[1].toUpperCase()}-${match[2]}`;
  }

  const buildingPattern = /building\s*([a-d])/i;
  const bldMatch = lowerText.match(buildingPattern);
  if (bldMatch && !extractedBuildingCode) {
    extractedBuildingCode = bldMatch[1].toUpperCase();
  }

  // 4. Asset Keyword Extraction
  let extractedAssetType: string | null = null;
  if (lowerText.includes('socket') || lowerText.includes('plug')) extractedAssetType = 'ELECTRICAL_PANEL';
  else if (lowerText.includes('wifi') || lowerText.includes('wi-fi') || lowerText.includes('router') || lowerText.includes('access point') || lowerText.includes('transceiver')) extractedAssetType = 'NETWORK_ACCESS_POINT';
  else if (lowerText.includes('projector')) extractedAssetType = 'PROJECTOR';
  else if (/\bac\b/i.test(lowerText) || lowerText.includes('air conditioner') || lowerText.includes('air conditioning') || lowerText.includes('cooling')) extractedAssetType = 'AC';
  else if (lowerText.includes('light') || lowerText.includes('bulb') || lowerText.includes('tube')) extractedAssetType = 'LIGHTING';

  // 5. Detect Missing Information
  if (!providedRoomId && !extractedRoomCode) {
    missingInfo.push('Room number or location is missing.');
  }
  if (!providedAssetTag && !extractedAssetType) {
    missingInfo.push('Specific equipment or asset tag not specified.');
  }

  const confidence = maxMatches > 2 ? 0.95 : maxMatches > 0 ? 0.85 : 0.60;

  return {
    category: detectedCategory,
    suggestedPriority,
    confidence,
    extractedBuildingCode,
    extractedRoomCode,
    extractedAssetType,
    missingInformation: missingInfo,
    explanation,
  };
}
