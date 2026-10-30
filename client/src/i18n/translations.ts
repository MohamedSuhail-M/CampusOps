export type LanguageCode = 'en' | 'ta' | 'hi';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  nav: {
    dashboard: string;
    reportIssue: string;
    myReports: string;
    alerts: string;
    help: string;
    timetable: string;
    roomRequests: string;
    workOrders: string;
    parts: string;
    schedule: string;
    diagnostics: string;
    deptIssues: string;
    rooms: string;
    relocations: string;
    incidentTriage: string;
    roster: string;
    purchaseRequests: string;
    inventory: string;
    stockReceipts: string;
    policyRules: string;
    systemOverview: string;
    usersRoles: string;
    campusData: string;
    integrations: string;
    auditSecurity: string;
    logout: string;
  };
  complaintForm: {
    title: string;
    subtitle: string;
    step1Language: string;
    step2Location: string;
    step3Description: string;
    step4Evidence: string;
    step5Triage: string;
    buildingLabel: string;
    buildingPlaceholder: string;
    roomLabel: string;
    roomPlaceholder: string;
    scanQrBtn: string;
    scanningQr: string;
    stopScan: string;
    manualAssetLabel: string;
    assetVerified: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    startDictation: string;
    listening: string;
    stopDictation: string;
    speechNotSupported: string;
    attachPhotos: string;
    attachHint: string;
    cameraCapture: string;
    browseFiles: string;
    analyzingText: string;
    detectedCategory: string;
    suggestedPriority: string;
    missingInfoWarning: string;
    submitBtn: string;
    submitting: string;
    successTitle: string;
    referenceNumber: string;
    viewInReports: string;
    submitAnother: string;
  };
  reportsList: {
    title: string;
    subtitle: string;
    allFilter: string;
    pendingFilter: string;
    assignedFilter: string;
    inProgressFilter: string;
    resolvedFilter: string;
    searchPlaceholder: string;
    emptyTitle: string;
    emptySubtitle: string;
    tableRef: string;
    tableSummary: string;
    tableCategory: string;
    tablePriority: string;
    tableStatus: string;
    tableLocation: string;
    tableDate: string;
    tableActions: string;
    viewDetails: string;
  };
  details: {
    title: string;
    backBtn: string;
    originalComplaint: string;
    normalizedSummary: string;
    submissionChannel: string;
    inputLanguage: string;
    equipmentInfo: string;
    photoEvidence: string;
    noEvidence: string;
    statusTimeline: string;
    technicianAssigned: string;
    auditLog: string;
  };
  alertsPage: {
    title: string;
    unreadCount: string;
    markAllRead: string;
    allFilter: string;
    unreadOnly: string;
    emptyTitle: string;
    emptySubtitle: string;
  };
  helpPage: {
    title: string;
    subtitle: string;
    searchPlaceholder: string;
    faqHeader: string;
    qrGuideTitle: string;
    voiceGuideTitle: string;
    photoGuideTitle: string;
    statusGuideTitle: string;
  };
  common: {
    loading: string;
    error: string;
    save: string;
    cancel: string;
    confirm: string;
    close: string;
    verified: string;
    critical: string;
    high: string;
    medium: string;
    low: string;
  };
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appName: 'CAMPUSOPS',
    tagline: 'Intelligent Campus Operations Platform',
    nav: {
      dashboard: 'Dashboard',
      reportIssue: 'Report Issue',
      myReports: 'My Reports',
      alerts: 'Notifications',
      help: 'Help & Support',
      timetable: 'My Timetable',
      roomRequests: 'Room Requests',
      workOrders: 'Work Orders',
      parts: 'Parts Requests',
      schedule: 'Schedule & Leave',
      diagnostics: 'Diagnostics',
      deptIssues: 'Department Issues',
      rooms: 'Rooms & Timetable',
      relocations: 'Relocation Approvals',
      incidentTriage: 'Incident Triage',
      roster: 'Technician Roster',
      purchaseRequests: 'Purchase Requests',
      inventory: 'Inventory Ledger',
      stockReceipts: 'Stock Receipts',
      policyRules: 'Policy Rules',
      systemOverview: 'System Overview',
      usersRoles: 'Users & Roles',
      campusData: 'Campus Data',
      integrations: 'Integrations',
      auditSecurity: 'Audit & Security',
      logout: 'Sign Out',
    },
    complaintForm: {
      title: 'Report a Campus Issue',
      subtitle: 'Multimodal intake with automatic equipment QR lookup, voice dictation, and photo proof.',
      step1Language: 'Language / மொழி / भाषा',
      step2Location: 'Location & Equipment',
      step3Description: 'Describe the Issue',
      step4Evidence: 'Attach Photo Evidence',
      step5Triage: 'Smart AI Triage Analysis',
      buildingLabel: 'Building',
      buildingPlaceholder: 'Select campus building...',
      roomLabel: 'Room / Classroom',
      roomPlaceholder: 'Select room...',
      scanQrBtn: 'Scan Equipment QR',
      scanningQr: 'Camera Active — Point at Equipment QR Code',
      stopScan: 'Stop Scanner',
      manualAssetLabel: 'Asset Tag / QR Code ID',
      assetVerified: 'Asset Verified in Campus Directory',
      descriptionLabel: 'Issue Description',
      descriptionPlaceholder: 'E.g. Projector in Room B-204 has no power / Sparking socket near teacher podium...',
      startDictation: 'Start Voice Dictation',
      listening: 'Listening... Speak clearly in selected language',
      stopDictation: 'Stop Dictation',
      speechNotSupported: 'Speech recognition is not supported in this browser. Please type your description.',
      attachPhotos: 'Attach Photo Evidence',
      attachHint: 'Upload up to 3 photos (Max 5MB each, JPG/PNG/WebP).',
      cameraCapture: 'Take Photo',
      browseFiles: 'Browse Files',
      analyzingText: 'Analyzing complaint semantics...',
      detectedCategory: 'Detected Category',
      suggestedPriority: 'Suggested Priority',
      missingInfoWarning: 'Missing Information Suggested by Triage',
      submitBtn: 'Submit Campus Complaint',
      submitting: 'Verifying & Persisting...',
      successTitle: 'Complaint Submitted Successfully!',
      referenceNumber: 'Reference Number',
      viewInReports: 'View in My Reports',
      submitAnother: 'Submit Another Complaint',
    },
    reportsList: {
      title: 'My Submitted Reports',
      subtitle: 'Track resolution status, technician assignments, and SLA progress for your complaints.',
      allFilter: 'All Reports',
      pendingFilter: 'Pending',
      assignedFilter: 'Assigned',
      inProgressFilter: 'In Progress',
      resolvedFilter: 'Resolved',
      searchPlaceholder: 'Search reports by reference, room, or issue...',
      emptyTitle: 'No complaints found',
      emptySubtitle: 'You have not submitted any complaints matching this filter.',
      tableRef: 'Reference',
      tableSummary: 'Complaint Summary',
      tableCategory: 'Category',
      tablePriority: 'Priority',
      tableStatus: 'Status',
      tableLocation: 'Location',
      tableDate: 'Submitted',
      tableActions: 'Action',
      viewDetails: 'View Details →',
    },
    details: {
      title: 'Complaint Details & Audit Trail',
      backBtn: '← Back to My Reports',
      originalComplaint: 'Original Complaint Statement',
      normalizedSummary: 'Normalized English Summary',
      submissionChannel: 'Channel & Input Method',
      inputLanguage: 'Submission Language',
      equipmentInfo: 'Equipment & Room Location',
      photoEvidence: 'Attached Photo Evidence',
      noEvidence: 'No photo evidence was attached to this complaint.',
      statusTimeline: 'Incident Resolution Lifecycle',
      technicianAssigned: 'Assigned Technician',
      auditLog: 'Immutable Audit Trail',
    },
    alertsPage: {
      title: 'Notifications & Alerts',
      unreadCount: 'unread notifications',
      markAllRead: 'Mark All as Read',
      allFilter: 'All Alerts',
      unreadOnly: 'Unread Only',
      emptyTitle: 'No notifications',
      emptySubtitle: 'You are all caught up! No operational alerts at this time.',
    },
    helpPage: {
      title: 'Help & Support Center',
      subtitle: 'Guides, QR troubleshooting, microphone instructions, and campus operations FAQ.',
      searchPlaceholder: 'Search help guides, topics, or error messages...',
      faqHeader: 'Frequently Asked Questions',
      qrGuideTitle: 'How to Scan Equipment QR Codes',
      voiceGuideTitle: 'Using Voice-to-Text Dictation',
      photoGuideTitle: 'Attaching Photo Evidence',
      statusGuideTitle: 'Understanding Incident Statuses',
    },
    common: {
      loading: 'Loading...',
      error: 'An unexpected error occurred.',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      close: 'Close',
      verified: 'Verified',
      critical: 'CRITICAL',
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW',
    },
  },

  ta: {
    appName: 'கேம்பஸ்ஆப்ஸ் (CampusOps)',
    tagline: 'புத்திசாலி வளாக செயல்பாட்டு தளம்',
    nav: {
      dashboard: 'முகப்பு பலகை',
      reportIssue: 'புகார் அளிக்கவும்',
      myReports: 'எனது புகார்கள்',
      alerts: 'அறிவிப்புகள்',
      help: 'உதவி & ஆதரவு',
      timetable: 'எனது அட்டவணை',
      roomRequests: 'அறை கோரிக்கைகள்',
      workOrders: 'பணி ஆணைகள்',
      parts: 'உதிரிபாக கோரிக்கைகள்',
      schedule: 'ஷிப்ட் & விடுப்பு',
      diagnostics: 'கண்டறிதல் கருவிகள்',
      deptIssues: 'துறை சிக்கல்கள்',
      rooms: 'அறைகள் & அட்டவணை',
      relocations: 'இடமாற்ற அனுமதிகள்',
      incidentTriage: 'சம்பவ பரிசீலனை',
      roster: 'தொழில்நுட்ப வல்லுநர் பட்டியல்',
      purchaseRequests: 'கொள்முதல் கோரிக்கைகள்',
      inventory: 'சரக்கு கையிருப்பு',
      stockReceipts: 'சரக்கு ரசீதுகள்',
      policyRules: 'கொள்கை விதிகள்',
      systemOverview: 'கணினி கண்ணோட்டம்',
      usersRoles: 'பயனர்கள் & பாத்திரங்கள்',
      campusData: 'வளாக தரவு',
      integrations: 'இணைப்புகள்',
      auditSecurity: 'தணிக்கை & பாதுகாப்பு',
      logout: 'வெளியேறு',
    },
    complaintForm: {
      title: 'வளாக சிக்கலை பதிவு செய்யவும்',
      subtitle: 'தானியங்கி QR ஸ்கேனர், குரல் வழி உள்ளீடு மற்றும் புகைப்பட ஆதாரத்துடன் கூடிய புகார் தளம்.',
      step1Language: 'மொழி / Language',
      step2Location: 'இடம் & உபகரணங்கள்',
      step3Description: 'சிக்கலை விவரிக்கவும்',
      step4Evidence: 'புகைப்பட ஆதாரம் இணைக்கவும்',
      step5Triage: 'AI நுண்ணறிவு பகுப்பாய்வு',
      buildingLabel: 'வளாக கட்டிடம்',
      buildingPlaceholder: 'கட்டிடத்தைத் தேர்ந்தெடுக்கவும்...',
      roomLabel: 'வகுப்பறை / ஆய்வகம்',
      roomPlaceholder: 'அறையைத் தேர்ந்தெடுக்கவும்...',
      scanQrBtn: 'உபகரண QR ஸ்கேன் செய்',
      scanningQr: 'கேமரா இயங்குகிறது — உபகரண QR குறியீட்டை காட்டவும்',
      stopScan: 'ஸ்கேனரை நிறுத்து',
      manualAssetLabel: 'உபகரணக் குறியீடு / சொத்து ஐடி',
      assetVerified: 'வளாக பதிவேட்டில் உபகரணம் உறுதிப்படுத்தப்பட்டது',
      descriptionLabel: 'சிக்கல் விவரம்',
      descriptionPlaceholder: 'எ.கா: அறை பி-204 இல் ப்ரொஜெக்டர் இயங்கவில்லை / மின்சார தீப்பொறி பறக்கிறது...',
      startDictation: 'குரல் மூலம் பேச தொடங்கு',
      listening: 'கேட்கிறது... தமிழில் தெளிவாக பேசவும்',
      stopDictation: 'பேச்சை நிறுத்து',
      speechNotSupported: 'உங்கள் உலாவியில் குரல் உள்ளீடு ஆதரிக்கப்படவில்லை. தயவுசெய்து தட்டச்சு செய்யவும்.',
      attachPhotos: 'புகைப்பட ஆதாரங்களை இணைக்கவும்',
      attachHint: 'அதிகபட்சம் 3 படங்கள் (ஒவ்வொன்றும் 5MB வரை, JPG/PNG/WebP).',
      cameraCapture: 'புகைப்படம் எடு',
      browseFiles: 'கோப்புகளைத் தேர்ந்தெடு',
      analyzingText: 'புகார் விவரங்கள் பகுப்பாய்வு செய்யப்படுகின்றன...',
      detectedCategory: 'கண்டறியப்பட்ட பிரிவு',
      suggestedPriority: 'பரிந்துரைக்கப்பட்ட முன்னுரிமை',
      missingInfoWarning: 'விடுபட்ட விவரங்கள்',
      submitBtn: 'புகாரை சமர்ப்பிக்கவும்',
      submitting: 'பதிவு செய்யப்படுகிறது...',
      successTitle: 'புகார் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!',
      referenceNumber: 'குறிப்பு எண்',
      viewInReports: 'எனது புகார்களில் பார்க்கவும்',
      submitAnother: 'மற்றொரு புகார் அளிக்கவும்',
    },
    reportsList: {
      title: 'எனது சமர்ப்பிக்கப்பட்ட புகார்கள்',
      subtitle: 'உங்கள் புகார்களின் தீர்வு நிலை, தொழில்நுட்ப வல்லுநர் ஒதுக்கீடு மற்றும் முன்னேற்றத்தைக் கண்காணிக்கவும்.',
      allFilter: 'அனைத்து புகார்கள்',
      pendingFilter: 'நிலுவையில் உள்ளவை',
      assignedFilter: 'ஒதுக்கப்பட்டவை',
      inProgressFilter: 'நடைபெறுகிறது',
      resolvedFilter: 'தீர்க்கப்பட்டவை',
      searchPlaceholder: 'குறிப்பு எண், அறை அல்லது சிக்கல் மூலம் தேடவும்...',
      emptyTitle: 'புகார்கள் எதுவும் இல்லை',
      emptySubtitle: 'இந்த பிரிவில் நீங்கள் எந்த புகாரையும் சமர்ப்பிக்கவில்லை.',
      tableRef: 'குறிப்பு எண்',
      tableSummary: 'புகார் சுருக்கம்',
      tableCategory: 'பிரிவு',
      tablePriority: 'முன்னுரிமை',
      tableStatus: 'தற்போதைய நிலை',
      tableLocation: 'இடம்',
      tableDate: 'தேதி',
      tableActions: 'செயல்',
      viewDetails: 'விவரங்களை காண்க →',
    },
    details: {
      title: 'புகார் விவரங்கள் & தணிக்கை பதிவு',
      backBtn: '← எனது புகார்களுக்கு திரும்பு',
      originalComplaint: 'அசல் புகார் உரை',
      normalizedSummary: 'ஆங்கில மொழிபெயர்ப்பு சுருக்கம்',
      submissionChannel: 'சமர்ப்பித்த வழிமுறை',
      inputLanguage: 'உள்ளீட்டு மொழி',
      equipmentInfo: 'உபகரணம் & அறை அமைவிடம்',
      photoEvidence: 'இணைக்கப்பட்ட புகைப்பட ஆதாரங்கள்',
      noEvidence: 'இந்த புகாருக்கு புகைப்பட ஆதாரம் இணைக்கப்படவில்லை.',
      statusTimeline: 'தீர்வு காலவரிசை',
      technicianAssigned: 'ஒதுக்கப்பட்ட தொழில்நுட்ப வல்லுநர்',
      auditLog: 'மாற்ற முடியாத தணிக்கை பதிவு',
    },
    alertsPage: {
      title: 'அறிவிப்புகள் & எச்சரிக்கைகள்',
      unreadCount: 'படிக்காத அறிவிப்புகள்',
      markAllRead: 'அனைத்தையும் படித்ததாகக் குறிக்கவும்',
      allFilter: 'அனைத்தும்',
      unreadOnly: 'படிக்காதவை மட்டும்',
      emptyTitle: 'அறிவிப்புகள் இல்லை',
      emptySubtitle: 'புதிய அறிவிப்புகள் அல்லது எச்சரிக்கைகள் எதுவும் இல்லை.',
    },
    helpPage: {
      title: 'உதவி மற்றும் வழிகாட்டி',
      subtitle: 'வளாக செயல்பாடுகள், QR வழிகாட்டிகள் மற்றும் அடிக்கடி கேட்கப்படும் கேள்விகள்.',
      searchPlaceholder: 'தலைப்புகள் அல்லது கேள்விகளைத் தேடவும்...',
      faqHeader: 'அடிக்கடி கேட்கப்படும் கேள்விகள் (FAQ)',
      qrGuideTitle: 'QR குறியீட்டை ஸ்கேன் செய்வது எப்படி',
      voiceGuideTitle: 'குரல் தட்டச்சு பயன்படுத்துவது எப்படி',
      photoGuideTitle: 'புகைப்பட ஆதாரம் இணைப்பது எப்படி',
      statusGuideTitle: 'புகாரின் நிலைகளை புரிந்துகொள்ளுதல்',
    },
    common: {
      loading: 'ஏற்றுகிறது...',
      error: 'எதிர்பாராத பிழை ஏற்பட்டது.',
      save: 'சேமி',
      cancel: 'ரத்து செய்',
      confirm: 'உறுதி செய்',
      close: 'மூடு',
      verified: 'உறுதி செய்யப்பட்டது',
      critical: 'அவசரம் (CRITICAL)',
      high: 'உயர் (HIGH)',
      medium: 'நடுத்தரம் (MEDIUM)',
      low: 'குறைந்த (LOW)',
    },
  },

  hi: {
    appName: 'कैम्पसऑप्स (CampusOps)',
    tagline: 'स्मार्ट कैंपस संचालन प्लेटफॉर्म',
    nav: {
      dashboard: 'डैशबोर्ड',
      reportIssue: 'शिकायत दर्ज करें',
      myReports: 'मेरी शिकायतें',
      alerts: 'अधिसूचनाएं',
      help: 'सहायता एवं समर्थन',
      timetable: 'मेरी समय सारिणी',
      roomRequests: 'कक्ष अनुरोध',
      workOrders: 'कार्य आदेश',
      parts: 'पुर्जे अनुरोध',
      schedule: 'समय सारिणी और छुट्टी',
      diagnostics: 'नैदानिक उपकरण',
      deptIssues: 'विभाग समस्याएं',
      rooms: 'कक्ष और समय सारिणी',
      relocations: 'स्थानांतरण स्वीकृति',
      incidentTriage: 'समस्या वर्गीकरण',
      roster: 'तकनीशियन रोस्टर',
      purchaseRequests: 'खरीद अनुरोध',
      inventory: 'इन्वेंट्री बहीखाता',
      stockReceipts: 'स्टॉक रसीदें',
      policyRules: 'नीति नियम',
      systemOverview: 'सिस्टम अवलोकन',
      usersRoles: 'उपयोगकर्ता और भूमिकाएं',
      campusData: 'परिसर डेटा',
      integrations: 'एकीकरण',
      auditSecurity: 'लेखापरीक्षा एवं सुरक्षा',
      logout: 'लॉग आउट',
    },
    complaintForm: {
      title: 'परिसर की समस्या दर्ज करें',
      subtitle: 'उपकरण क्यूआर स्कैनर, आवाज से टाइपिंग और फोटो साक्ष्य के साथ आधुनिक शिकायत प्रणाली।',
      step1Language: 'भाषा चुनें / Language',
      step2Location: 'स्थान एवं उपकरण',
      step3Description: 'समस्या का विवरण दें',
      step4Evidence: 'फोटो साक्ष्य संलग्न करें',
      step5Triage: 'स्मार्ट एआई विश्लेषण',
      buildingLabel: 'भवन',
      buildingPlaceholder: 'परिसर भवन चुनें...',
      roomLabel: 'कमरा / कक्षा',
      roomPlaceholder: 'कमरा चुनें...',
      scanQrBtn: 'उपकरण क्यूआर स्कैन करें',
      scanningQr: 'कैमरा सक्रिय है — उपकरण क्यूआर कोड की ओर इंगित करें',
      stopScan: 'स्कैनर बंद करें',
      manualAssetLabel: 'संपत्ति टैग / क्यूआर आईडी',
      assetVerified: 'परिसर निर्देशिका में उपकरण सत्यापित',
      descriptionLabel: 'समस्या का विवरण',
      descriptionPlaceholder: 'उदा. कमरा B-204 में प्रोजेक्टर काम नहीं कर रहा है / स्विच बोर्ड से चिंगारी निकल रही है...',
      startDictation: 'बोलकर लिखें (वॉइस इनपुट)',
      listening: 'सुन रहा है... हिंदी में स्पष्ट बोलें',
      stopDictation: 'वॉइस इनपुट रोकें',
      speechNotSupported: 'आपके ब्राउज़र में वॉइस टाइपिंग समर्थित नहीं है। कृपया लिखकर दर्ज करें।',
      attachPhotos: 'फोटो साक्ष्य जोड़ें',
      attachHint: 'अधिकतम 3 तस्वीरें (प्रत्येक 5MB तक, JPG/PNG/WebP)।',
      cameraCapture: 'फोटो खींचे',
      browseFiles: 'फ़ाइलें चुनें',
      analyzingText: 'समस्या का विश्लेषण किया जा रहा है...',
      detectedCategory: 'पहचानी गई श्रेणी',
      suggestedPriority: 'सुझाई गई प्राथमिकता',
      missingInfoWarning: 'छूटी हुई आवश्यक जानकारी',
      submitBtn: 'शिकायत सबमिट करें',
      submitting: 'सत्यापित और सुरक्षित किया जा रहा है...',
      successTitle: 'शिकायत सफलतापूर्वक दर्ज की गई!',
      referenceNumber: 'संदर्भ संख्या (Reference ID)',
      viewInReports: 'मेरी शिकायतों में देखें',
      submitAnother: 'दूसरी शिकायत दर्ज करें',
    },
    reportsList: {
      title: 'मेरी दर्ज की गई शिकायतें',
      subtitle: 'अपनी शिकायतों की समाधान स्थिति, तकनीशियन असाइनमेंट और प्रगति ट्रैक करें।',
      allFilter: 'सभी शिकायतें',
      pendingFilter: 'लंबित',
      assignedFilter: 'सौंपी गई',
      inProgressFilter: 'प्रगति पर',
      resolvedFilter: 'हल हो गई',
      searchPlaceholder: 'संदर्भ संख्या, कमरा या समस्या खोजें...',
      emptyTitle: 'कोई शिकायत नहीं मिली',
      emptySubtitle: 'इस फ़िल्टर के तहत कोई शिकायत दर्ज नहीं है।',
      tableRef: 'संदर्भ संख्या',
      tableSummary: 'शिकायत सारांश',
      tableCategory: 'श्रेणी',
      tablePriority: 'प्राथमिकता',
      tableStatus: 'स्थिति',
      tableLocation: 'स्थान',
      tableDate: 'दर्ज करने की तिथि',
      tableActions: 'कार्रवाई',
      viewDetails: 'विवरण देखें →',
    },
    details: {
      title: 'शिकायत विवरण एवं ऑडिट ट्रेल',
      backBtn: '← मेरी शिकायतों पर वापस जाएं',
      originalComplaint: 'मूल शिकायत विवरण',
      normalizedSummary: 'अंग्रेजी सारांश',
      submissionChannel: 'सबमिशन का माध्यम',
      inputLanguage: 'इनपुट भाषा',
      equipmentInfo: 'उपकरण और कमरे का स्थान',
      photoEvidence: 'संलग्न फोटो साक्ष्य',
      noEvidence: 'इस शिकायत के साथ कोई फोटो संलग्न नहीं है।',
      statusTimeline: 'समाधान समयरेखा',
      technicianAssigned: 'नियुक्त तकनीशियन',
      auditLog: 'अपरिवर्तनीय ऑडिट लॉग',
    },
    alertsPage: {
      title: 'सूचनाएं एवं अलर्ट',
      unreadCount: 'अपठित सूचनाएं',
      markAllRead: 'सभी को पढ़ा हुआ चिह्नित करें',
      allFilter: 'सभी अलर्ट',
      unreadOnly: 'केवल अपठित',
      emptyTitle: 'कोई सूचना नहीं',
      emptySubtitle: 'सब कुछ अपडेट है! इस समय कोई नया अलर्ट नहीं है।',
    },
    helpPage: {
      title: 'सहायता एवं मार्गदर्शिका',
      subtitle: 'कैंपस संचालन गाइड, क्यूआर स्कैनर और अक्सर पूछे जाने वाले प्रश्न।',
      searchPlaceholder: 'विषय या प्रश्न खोजें...',
      faqHeader: 'अक्सर पूछे जाने वाले प्रश्न (FAQ)',
      qrGuideTitle: 'उपकरण क्यूआर कोड कैसे स्कैन करें',
      voiceGuideTitle: 'आवाज से टाइपिंग का उपयोग कैसे करें',
      photoGuideTitle: 'फोटो साक्ष्य कैसे संलग्न करें',
      statusGuideTitle: 'शिकायत की स्थिति को समझें',
    },
    common: {
      loading: 'लोड हो रहा है...',
      error: 'एक अप्रत्याशित त्रुटि हुई।',
      save: 'सुरक्षित करें',
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      close: 'बंद करें',
      verified: 'सत्यापित',
      critical: 'अति गंभीर (CRITICAL)',
      high: 'उच्च (HIGH)',
      medium: 'मध्यम (MEDIUM)',
      low: 'सामान्य (LOW)',
    },
  },
};
