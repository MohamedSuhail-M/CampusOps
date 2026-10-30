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
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  ELECTRICAL: [
    'spark', 'sparking', 'electric', 'shock', 'power', 'socket', 'switch', 'mcb', 'wire', 'conduit', 'light', 'tube', 'blackout', 'short circuit',
    // Tamil
    'மின்சாரம்', 'தீப்பொறி', 'பிளக்', 'சாக்கெட்', 'சுவிட்ச்', 'மின் கம்பி', 'மின் தடை', 'விளக்கு', 'மின்கசிவு', 'ஷாக்',
    // Hindi
    'बिजली', 'स्पार्क', 'चिंगारी', 'प्लग', 'सॉकेट', 'स्विच', 'तार', 'ब्लैकआउट', 'बत्ती', 'लाइट', 'करंट'
  ],
  NETWORK: [
    'wifi', 'wi-fi', 'internet', 'network', 'router', 'access point', 'transceiver', 'cable', 'cat6', 'ethernet', 'slow connection', 'offline', 'ping', 'dns', 'connectivity',
    // Tamil
    'வைஃபை', 'இணையம்', 'இன்டர்நெட்', 'திசைவி', 'நெட்வொர்க்', 'இணைப்பு',
    // Hindi
    'वाईफाई', 'इंटरनेट', 'राउटर', 'नेटवर्क', 'धीमा'
  ],
  HVAC: [
    'ac', 'air conditioner', 'cooling', 'leak', 'water leak', 'compressor', 'heating', 'thermostat', 'chiller', 'fan coil', 'ventilation', 'temperature', 'humid',
    // Tamil
    'ஏசி', 'குளிர்சாதனம்', 'காற்றோட்டம்', 'சூடு',
    // Hindi
    'एसी', 'कूलिंग', 'गर्म', 'हवा'
  ],
  PLUMBING: [
    'pipe', 'leak', 'drain', 'clog', 'clogged', 'toilet', 'flush', 'sink', 'faucet', 'valve', 'sewage', 'overflow', 'tap', 'water pressure',
    // Tamil
    'குழாய்', 'கசிவு', 'தண்ணீர்', 'அடைப்பு', 'கழிவறை', 'தொட்டி',
    // Hindi
    'पाइप', 'लीक', 'रिसाव', 'पानी', 'जाम', 'शौचालय', 'नल'
  ],
  AV: [
    'projector', 'screen', 'hdmi', 'mic', 'microphone', 'speaker', 'audio', 'sound', 'display', 'monitor', 'podium', 'av',
    // Tamil
    'புரொஜெக்டர்', 'ப்ரொஜெக்டர்', 'ஒலிபெருக்கி', 'மைக்', 'திரை',
    // Hindi
    'प्रोजेक्टर', 'माइक', 'स्पीकर', 'स्क्रीन', 'ऑडियो'
  ],
};

const CRITICAL_KEYWORDS = [
  'spark', 'sparking', 'fire', 'smoke', 'shock', 'flood', 'flooding', 'hazard', 'explosion', 'danger', 'emergency', 'blackout',
  // Tamil
  'தீப்பொறி', 'தீ', 'நெருப்பு', 'புகை', 'ஆபத்து', 'அதிர்ச்சி', 'வெள்ளம்', 'வெடிப்பு',
  // Hindi
  'चिंगारी', 'आग', 'धुआं', 'खतरा', 'धमाका', 'करंट', 'आपातकाल'
];

const HIGH_KEYWORDS = [
  'exam', 'exam hall', 'lecture', 'lab', 'practical',
  'no power', 'wifi down', 'no internet', 'network down', 'entire room',
  'offline', 'urgent', 'outage', 'completely down', 'connection is down',
  'internet is down', 'down in', 'disconnected', 'failed', 'failure', 'cut off',
  // Tamil
  'தேர்வு', 'பரீட்சை', 'வகுப்பு', 'வேலை செய்யவில்லை', 'முழுமையாக முடங்கியது',
  // Hindi
  'परीक्षा', 'इम्तिहान', 'कमरा', 'काम नहीं कर रहा', 'पूरी तरह बंद'
];

const MEDIUM_KEYWORDS = [
  'slow', 'flicker', 'noise', 'dim', 'broken', 'not working', 'faucet leak', 'drips', 'ac hot', 'leak',
  // Tamil
  'மெதுவாக', 'ஒலி', 'கசிவு', 'பழுது',
  // Hindi
  'धीमा', 'आवाज', 'खराब', 'रिसाव'
];

export function runOfflineTriage(
  text: string,
  providedBuildingId?: string | null,
  providedRoomId?: string | null,
  providedAssetTag?: string | null
): TriageResult {
  const lowerText = text.toLowerCase();
  const missingInfo: string[] = [];

  // Detect Language
  let detectedLanguage: 'en' | 'ta' | 'hi' = 'en';
  if (/[\u0B80-\u0BFF]/.test(text)) {
    detectedLanguage = 'ta';
  } else if (/[\u0900-\u097F]/.test(text)) {
    detectedLanguage = 'hi';
  }

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
    (lowerText.includes('wifi') || lowerText.includes('wi-fi') || lowerText.includes('internet') || lowerText.includes('network') || lowerText.includes('router') || lowerText.includes('வைஃபை') || lowerText.includes('वाईफाई')) &&
    (lowerText.includes('down') || lowerText.includes('failed') || lowerText.includes('disconnected') || lowerText.includes('outage') || lowerText.includes('வேலை செய்யவில்லை') || lowerText.includes('काम नहीं कर रहा'));

  if (hasCriticalKeyword) {
    suggestedPriority = 'CRITICAL';
    explanation = 'Elevated to CRITICAL due to safety hazards, electrical sparks, flood, or fire danger.';
  } else if (hasHighKeyword || isNetworkOutage || lowerText.includes('exam') || lowerText.includes('தேர்வு') || lowerText.includes('परीक्षा')) {
    suggestedPriority = 'HIGH';
    explanation = 'Elevated to HIGH due to classroom, academic lecture, or widespread network disruption.';
  } else if (hasMediumKeyword) {
    suggestedPriority = 'MEDIUM';
    explanation = 'Assigned MEDIUM priority for standard functional repair.';
  } else {
    suggestedPriority = 'LOW';
    explanation = 'Assigned standard LOW priority for routine maintenance.';
  }

  // 3. Extract Location from Text (e.g. "B-204", "Room 204", "Building B", "பி-204", "कमरा B-204")
  let extractedBuildingCode: string | null = null;
  let extractedRoomCode: string | null = null;

  // Normalized building letters: பி/बी -> B, ஏ/ए -> A, சி/सी -> C, டி/डी -> D
  const roomPattern = /(?:rm-?|room\s*|कमरा\s*|अறை\s*|வகுப்பறை\s*)?([a-d|A-D|பி|ஏ|சி|டி|बी|ए|सी|डी])-?([0-9]{3})/i;
  const match = lowerText.match(roomPattern);
  if (match) {
    let bld = match[1].toUpperCase();
    if (bld === 'பி' || bld === 'बी') bld = 'B';
    else if (bld === 'ஏ' || bld === 'ए') bld = 'A';
    else if (bld === 'சி' || bld === 'सी') bld = 'C';
    else if (bld === 'டி' || bld === 'डी') bld = 'D';

    extractedBuildingCode = bld;
    extractedRoomCode = `${bld}-${match[2]}`;
  }

  const buildingPattern = /(?:building\s*|கட்டிடம்\s*|भवन\s*)([a-d|A-D|பி|ஏ|சி|டி|बी|ए|सी|डी])/i;
  const bldMatch = lowerText.match(buildingPattern);
  if (bldMatch && !extractedBuildingCode) {
    let bld = bldMatch[1].toUpperCase();
    if (bld === 'பி' || bld === 'बी') bld = 'B';
    else if (bld === 'ஏ' || bld === 'ए') bld = 'A';
    else if (bld === 'சி' || bld === 'सी') bld = 'C';
    else if (bld === 'டி' || bld === 'डी') bld = 'D';
    extractedBuildingCode = bld;
  }

  // 4. Asset Keyword Extraction
  let extractedAssetType: string | null = null;
  if (lowerText.includes('socket') || lowerText.includes('plug') || lowerText.includes('சாக்கெட்') || lowerText.includes('सॉकेट')) {
    extractedAssetType = 'ELECTRICAL_PANEL';
  } else if (lowerText.includes('wifi') || lowerText.includes('wi-fi') || lowerText.includes('router') || lowerText.includes('access point') || lowerText.includes('transceiver') || lowerText.includes('வைஃபை') || lowerText.includes('वाईफाई')) {
    extractedAssetType = 'NETWORK_ACCESS_POINT';
  } else if (lowerText.includes('projector') || lowerText.includes('புரொஜெக்டர்') || lowerText.includes('प्रोजेक्टर')) {
    extractedAssetType = 'PROJECTOR';
  } else if (/\bac\b/i.test(lowerText) || lowerText.includes('air conditioner') || lowerText.includes('ஏசி') || lowerText.includes('एसी')) {
    extractedAssetType = 'AC';
  } else if (lowerText.includes('light') || lowerText.includes('bulb') || lowerText.includes('விளக்கு') || lowerText.includes('लाइट')) {
    extractedAssetType = 'LIGHTING';
  }

  // 5. Detect Missing Information
  if (!providedRoomId && !extractedRoomCode) {
    missingInfo.push('Room number or location is missing.');
  }
  if (!providedAssetTag && !extractedAssetType) {
    missingInfo.push('Specific equipment or asset tag not specified.');
  }

  const confidence = maxMatches > 2 ? 0.95 : maxMatches > 0 ? 0.85 : 0.60;

  // 6. Generate Normalized English Summary
  const roomTarget = extractedRoomCode || (providedRoomId ? `Room ${providedRoomId}` : 'Campus Facility');
  const assetTarget = extractedAssetType || detectedCategory;
  const normalizedText = `${assetTarget} issue reported in ${roomTarget} [Priority: ${suggestedPriority}]: "${text.trim().substring(0, 120)}"`;

  return {
    category: detectedCategory,
    suggestedPriority,
    confidence,
    detectedLanguage,
    normalizedText,
    extractedBuildingCode,
    extractedRoomCode,
    extractedAssetType,
    missingInformation: missingInfo,
    explanation,
  };
}
