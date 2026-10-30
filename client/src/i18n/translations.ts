export type LanguageCode = 'en' | 'ta' | 'hi';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  topbar: {
    operationalSector: string;
    searchPlaceholder: string;
    activeRoleLabel: string;
    switchRole: string;
    quickPresets: string;
  };
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
    back: string;
    retake: string;
    openCamera: string;
    capture: string;
    browse: string;
    export: string;
    refresh: string;
    viewDetails: string;
    authorize: string;
    verified: string;
    critical: string;
    high: string;
    medium: string;
    low: string;
  };
  status: {
    new: string;
    open: string;
    triaged: string;
    dispatched: string;
    inProgress: string;
    pendingParts: string;
    completed: string;
    resolved: string;
    closed: string;
    approved: string;
    rejected: string;
    blocked: string;
  };
  dashboards: {
    student: {
      title: string;
      subtitle: string;
      activeIncidents: string;
      resolvedMonth: string;
      campusAlerts: string;
      recentReports: string;
      reportNewIssueBtn: string;
      viewAllReports: string;
      emptyReports: string;
    };
    faculty: {
      title: string;
      subtitle: string;
      alertDisruption: string;
      roomPasses: string;
      mySchedule: string;
      reportHazardBtn: string;
      timetableStatus: string;
      todayClasses: string;
    };
    technician: {
      title: string;
      subtitle: string;
      assignedOrders: string;
      pendingParts: string;
      completedToday: string;
      startWork: string;
      requestSpares: string;
      scheduleShift: string;
      dueSoon: string;
    };
    deptManager: {
      title: string;
      subtitle: string;
      relocationsNeeded: string;
      authorizedRelocations: string;
      conflictMatrix: string;
      approveRelocationBtn: string;
      urgentAction: string;
    };
    facilities: {
      title: string;
      subtitle: string;
      triageQueue: string;
      openWorkOrders: string;
      availableTechs: string;
      autoCorrelate: string;
      dispatchWorkOrder: string;
      slaRisk: string;
    };
    procurement: {
      title: string;
      subtitle: string;
      pendingRequests: string;
      lowStockItems: string;
      totalInventory: string;
      approveRequestBtn: string;
      receiveStockBtn: string;
      dualSign: string;
    };
    sysadmin: {
      title: string;
      subtitle: string;
      systemHealth: string;
      activeSessions: string;
      dbRecords: string;
      auditLog: string;
      generateQr: string;
      runDiagnostics: string;
    };
  };
}

export const translations: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appName: 'CAMPUSOPS',
    tagline: 'Intelligent Campus Operations Platform',
    topbar: {
      operationalSector: 'Operational Sector',
      searchPlaceholder: 'Search campus incidents, assets, rooms, work orders...',
      activeRoleLabel: 'Active Role',
      switchRole: 'Switch Role',
      quickPresets: 'Quick Role Presets',
    },
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
      cameraCapture: 'Open Camera',
      browseFiles: 'Browse Files',
      analyzingText: 'Analyzing complaint semantics...',
      detectedCategory: 'Detected Category',
      suggestedPriority: 'Calculated Priority',
      missingInfoWarning: 'Please provide at least a 5-character description.',
      submitBtn: 'Submit Incident Report',
      submitting: 'Saving Report & Correlating...',
      successTitle: 'Complaint Submitted Successfully!',
      referenceNumber: 'Incident Reference',
      viewInReports: 'View My Submitted Reports',
      submitAnother: 'Submit Another Complaint',
    },
    reportsList: {
      title: 'My Submitted Complaints',
      subtitle: 'Track your reported campus issues, live status updates, and repair evidence in real time.',
      allFilter: 'All Reports',
      pendingFilter: 'Pending',
      assignedFilter: 'Assigned',
      inProgressFilter: 'In Progress',
      resolvedFilter: 'Resolved',
      searchPlaceholder: 'Search by reference, room, or issue text...',
      emptyTitle: 'No complaints reported yet',
      emptySubtitle: 'When you submit issues around campus, you can track their live progress here.',
      tableRef: 'Reference',
      tableSummary: 'Description Summary',
      tableCategory: 'Category',
      tablePriority: 'Priority',
      tableStatus: 'Status',
      tableLocation: 'Location',
      tableDate: 'Submitted Date',
      tableActions: 'Actions',
      viewDetails: 'View Details →',
    },
    details: {
      title: 'Incident Details & Audit Trail',
      backBtn: '← Back to My Reports',
      originalComplaint: 'Original Complaint Description',
      normalizedSummary: 'English Normalized Summary',
      submissionChannel: 'Submission Channel',
      inputLanguage: 'Input Language',
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
      back: 'Back',
      retake: 'Retake',
      openCamera: 'Open Camera',
      capture: 'Capture Photo',
      browse: 'Browse Files',
      export: 'Export Data',
      refresh: 'Refresh',
      viewDetails: 'View Details',
      authorize: 'Authorize',
      verified: 'Verified',
      critical: 'CRITICAL',
      high: 'HIGH',
      medium: 'MEDIUM',
      low: 'LOW',
    },
    status: {
      new: 'NEW',
      open: 'OPEN',
      triaged: 'TRIAGED',
      dispatched: 'DISPATCHED',
      inProgress: 'IN PROGRESS',
      pendingParts: 'PENDING PARTS',
      completed: 'COMPLETED',
      resolved: 'RESOLVED',
      closed: 'CLOSED',
      approved: 'APPROVED',
      rejected: 'REJECTED',
      blocked: 'BLOCKED',
    },
    dashboards: {
      student: {
        title: 'Student Operations Hub',
        subtitle: 'Report campus issues, track your active incident tickets, and view disruption announcements.',
        activeIncidents: 'Active Incident Tickets',
        resolvedMonth: 'Resolved This Month',
        campusAlerts: 'Campus Disruption Alerts',
        recentReports: 'Recent Incident Reports',
        reportNewIssueBtn: 'Report Campus Issue',
        viewAllReports: 'View All Reports →',
        emptyReports: 'You have not submitted any complaints yet.',
      },
      faculty: {
        title: 'Faculty Academic Console',
        subtitle: 'Classroom schedule monitoring, emergency hazard escalations, and room relocations.',
        alertDisruption: 'Classroom Disruption Alert',
        roomPasses: 'Relocation Digital Passes',
        mySchedule: 'Today Academic Schedule',
        reportHazardBtn: 'Report Classroom Hazard',
        timetableStatus: 'Schedule Integrity',
        todayClasses: 'Lectures & Labs Scheduled',
      },
      technician: {
        title: 'Technician Work Order Queue',
        subtitle: 'Assigned maintenance tasks, SLA resolution timers, and hardware spare requisitions.',
        assignedOrders: 'Active Work Orders',
        pendingParts: 'Parts Awaiting Procurement',
        completedToday: 'Repairs Completed Today',
        startWork: 'Start Work',
        requestSpares: 'Request Spares',
        scheduleShift: 'View Shift Roster',
        dueSoon: 'SLA Window Due Soon',
      },
      deptManager: {
        title: 'Department Operations Command',
        subtitle: 'Academic continuity oversight, examination room relocations, and departmental escalations.',
        relocationsNeeded: 'Urgent Relocations Needed',
        authorizedRelocations: 'Authorized Relocations',
        conflictMatrix: 'Schedule Conflict Matrix',
        approveRelocationBtn: 'Authorize Classroom Relocation',
        urgentAction: 'Urgent Action Required',
      },
      facilities: {
        title: 'Facilities Operations & Triage',
        subtitle: 'Incident correlation, dispatch scheduling, and campus infrastructure oversight.',
        triageQueue: 'Unassigned Incident Queue',
        openWorkOrders: 'Active Work Orders',
        availableTechs: 'Available Technicians',
        autoCorrelate: 'Duplicate Correlation Active',
        dispatchWorkOrder: 'Dispatch Technician',
        slaRisk: 'At-Risk SLA Incidents',
      },
      procurement: {
        title: 'Central Procurement Console',
        subtitle: 'Dual-sign purchase authorizations (Policy 4.2), inventory replenishment, and stock receipting.',
        pendingRequests: 'Pending Purchase Requests',
        lowStockItems: 'Low Stock Hardware Items',
        totalInventory: 'Cataloged Stock Items',
        approveRequestBtn: 'Approve Requisition',
        receiveStockBtn: 'Receive Inward Stock',
        dualSign: 'Dual-Authorization Enforced',
      },
      sysadmin: {
        title: 'System & Security Infrastructure',
        subtitle: 'Database integrity, bcrypt session security, QR badge generation, and audit logging.',
        systemHealth: 'SQLite Database Integrity',
        activeSessions: 'Active User Sessions',
        dbRecords: 'Seeded Campus Records',
        auditLog: 'Immutable Audit Log',
        generateQr: 'Generate QR Badges',
        runDiagnostics: 'Run PRAGMA Diagnostics',
      },
    },
  },

  ta: {
    appName: 'கேம்பஸ்ஆப்ஸ் (CampusOps)',
    tagline: 'புத்திசாலி வளாக செயல்பாட்டு தளம்',
    topbar: {
      operationalSector: 'செயல்பாட்டு துறை',
      searchPlaceholder: 'சம்பவங்கள், அறைகள், பணி ஆணைகளைத் தேடுங்கள்...',
      activeRoleLabel: 'தற்போதைய பங்கு',
      switchRole: 'பங்கு மாற்றம்',
      quickPresets: 'விரைவு பங்கு தேர்வுகள்',
    },
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
      inventory: 'சரக்கு இருப்பு பட்டி',
      stockReceipts: 'பொருட்கள் வரவு',
      policyRules: 'கொள்கை விதிகள்',
      systemOverview: 'கணினி கண்ணோட்டம்',
      usersRoles: 'பயனர்கள் & பங்குகள்',
      campusData: 'வளாகத் தரவு & QR',
      integrations: 'வெளிப்புற இணைப்புகள்',
      auditSecurity: 'தணிக்கை & பாதுகாப்பு',
      logout: 'வெளியேறு',
    },
    complaintForm: {
      title: 'வளாகப் பிரச்சனை குறித்து புகார் அளிக்கவும்',
      subtitle: 'உபகரண QR ஸ்கேனர், குரல் வழி பதிவு மற்றும் புகைப்பட ஆதாரத்துடன் கூடிய நவீன புகார் முறை.',
      step1Language: 'மொழி / Language / भाषा',
      step2Location: 'இடம் & உபகரணம்',
      step3Description: 'சிக்கலை விளக்குங்கள்',
      step4Evidence: 'புகைப்பட ஆதாரம் இணைக்கவும்',
      step5Triage: 'ஸ்மார்ட் AI பகுப்பாய்வு',
      buildingLabel: 'வளாகக் கட்டிடம்',
      buildingPlaceholder: 'கட்டிடத்தைத் தேர்ந்தெடுக்கவும்...',
      roomLabel: 'அறை / வகுப்பறை',
      roomPlaceholder: 'அறையைத் தேர்ந்தெடுக்கவும்...',
      scanQrBtn: 'உபகரண QR ஸ்கேன் செய்',
      scanningQr: 'கேமரா இயங்குகிறது — உபகரண QR குறியீட்டின் முன் காட்டவும்',
      stopScan: 'ஸ்கேனரை நிறுத்து',
      manualAssetLabel: 'உபகரணக் குறியீடு / QR எண்',
      assetVerified: 'வளாகப் பட்டியலில் உபகரணம் சரிபார்க்கப்பட்டது',
      descriptionLabel: 'சிக்கலின் விவரம்',
      descriptionPlaceholder: 'எ.கா: அறை B-204 புரொஜெக்டர் இயங்கவில்லை / மின்சார சாக்கெட்டில் தீப்பொறி பறக்கிறது...',
      startDictation: 'குரல் வழி பதிவு (மைக்)',
      listening: 'கேட்கிறது... தமிழில் தெளிவாகப் பேசவும்',
      stopDictation: 'பதிவை நிறுத்து',
      speechNotSupported: 'உங்கள் உலாவியில் குரல் வழி தட்டச்சு வசதி இல்லை. தயவுசெய்து தட்டச்சு செய்யவும்.',
      attachPhotos: 'புகைப்பட ஆதாரம் சேர்க்கவும்',
      attachHint: 'அதிகபட்சம் 3 புகைப்படங்கள் (ஒவ்வொன்றும் 5MB வரை, JPG/PNG/WebP).',
      cameraCapture: 'கேமரா திறக்கவும்',
      browseFiles: 'கோப்புகளைத் தேர்ந்தெடுக்கவும்',
      analyzingText: 'புகார் வாசகம் பகுப்பாய்வு செய்யப்படுகிறது...',
      detectedCategory: 'கண்டறியப்பட்ட பிரிவு',
      suggestedPriority: 'கணக்கிடப்பட்ட முன்னுரிமை',
      missingInfoWarning: 'குறைந்தது 5 எழுத்துகள் கொண்ட விளக்கத்தை உள்ளிடவும்.',
      submitBtn: 'புகாரைச் சமர்ப்பிக்கவும்',
      submitting: 'சேமிக்கப்படுகிறது...',
      successTitle: 'புகார் வெற்றிகரமாகப் பதிவு செய்யப்பட்டது!',
      referenceNumber: 'சம்பவ குறிப்பு எண்',
      viewInReports: 'எனது புகார்கள் பக்கத்தைப் பார்',
      submitAnother: 'மற்றொரு புகாரைப் பதிவு செய்',
    },
    reportsList: {
      title: 'நான் சமர்ப்பித்த புகார்கள்',
      subtitle: 'நீங்கள் பதிவு செய்த அனைத்து பிரச்சனைகளின் நேரலை நிலை மற்றும் பழுதுபார்ப்பு விவரங்களை அறியலாம்.',
      allFilter: 'அனைத்து புகார்கள்',
      pendingFilter: 'நிலுவையில் உள்ளவை',
      assignedFilter: 'ஒதுக்கப்பட்டவை',
      inProgressFilter: 'பழுதுபார்க்கப்படுகிறது',
      resolvedFilter: 'தீர்க்கப்பட்டவை',
      searchPlaceholder: 'குறிப்பு எண், அறை அல்லது பிரச்சனை மூலம் தேடவும்...',
      emptyTitle: 'இதுவரை புகார்கள் எதுவும் பதிவு செய்யப்படவில்லை',
      emptySubtitle: 'வளாகத்தில் ஏற்படும் பிரச்சனைகளைப் பதிவு செய்தால், அவற்றின் நிலையை இங்கு கண்காணிக்கலாம்.',
      tableRef: 'குறிப்பு எண்',
      tableSummary: 'புகார் சுருக்கம்',
      tableCategory: 'பிரிவு',
      tablePriority: 'முன்னுரிமை',
      tableStatus: 'நிலை',
      tableLocation: 'இடம்',
      tableDate: 'பதிவு செய்த தேதி',
      tableActions: 'செயல்கள்',
      viewDetails: 'விவரங்களைப் பார் →',
    },
    details: {
      title: 'சம்பவ விவரங்கள் & தணிக்கைப் பதிவு',
      backBtn: '← எனது புகார்களுக்குத் திரும்பு',
      originalComplaint: 'அசல் புகார் விளக்கம்',
      normalizedSummary: 'ஆங்கில சுருக்கம் (இயக்க முறைமைக்கு)',
      submissionChannel: 'சமர்ப்பித்த வழிமுறை',
      inputLanguage: 'உள்ளீட்டு மொழி',
      equipmentInfo: 'உபகரணம் மற்றும் அறை விவரம்',
      photoEvidence: 'இணைக்கப்பட்ட புகைப்பட ஆதாரம்',
      noEvidence: 'இந்த புகாருடன் புகைப்பட ஆதாரம் எதுவும் இணைக்கப்படவில்லை.',
      statusTimeline: 'தீர்வு காலவரிசை',
      technicianAssigned: 'ஒதுக்கப்பட்ட தொழில்நுட்ப வல்லுநர்',
      auditLog: 'மாற்ற முடியாத தணிக்கை பதிவு',
    },
    alertsPage: {
      title: 'அறிவிப்புகள் & எச்சரிக்கைகள்',
      unreadCount: 'படிக்காத அறிவிப்புகள்',
      markAllRead: 'அனைத்தையும் படித்ததாகக் குறிக்கவும்',
      allFilter: 'அனைத்து எச்சரிக்கைகள்',
      unreadOnly: 'படிக்காதவை மட்டும்',
      emptyTitle: 'அறிவிப்புகள் எதுவும் இல்லை',
      emptySubtitle: 'புதிய செயல்பாட்டு எச்சரிக்கைகள் எதுவும் இந்த நேரத்தில் இல்லை.',
    },
    helpPage: {
      title: 'உதவி மற்றும் ஆதரவு மையம்',
      subtitle: 'வழிகாட்டுதல்கள், QR சரிசெய்தல், மைக்ரோஃபோன் குறிப்புகள் மற்றும் அடிக்கடி கேட்கப்படும் கேள்விகள்.',
      searchPlaceholder: 'உதவிக் குறிப்புகள் அல்லது தலைப்புகளைத் தேடுங்கள்...',
      faqHeader: 'அடிக்கடி கேட்கப்படும் கேள்விகள் (FAQ)',
      qrGuideTitle: 'உபகரண QR குறியீடுகளை எவ்வாறு ஸ்கேன் செய்வது',
      voiceGuideTitle: 'குரல் வழி தட்டச்சை எவ்வாறு பயன்படுத்துவது',
      photoGuideTitle: 'புகைப்பட ஆதாரங்களை எவ்வாறு இணைப்பது',
      statusGuideTitle: 'புகார் நிலைகளைப் புரிந்துகொள்வது',
    },
    common: {
      loading: 'ஏற்றப்படுகிறது...',
      error: 'எதிர்பாராத பிழை ஏற்பட்டது.',
      save: 'சேமி',
      cancel: 'ரத்து செய்',
      confirm: 'உறுதி செய்',
      close: 'மூடு',
      back: 'பின்செல்',
      retake: 'மீண்டும் எடு',
      openCamera: 'கேமராவைத் திற',
      capture: 'படம் பிடி',
      browse: 'கோப்புகள்',
      export: 'ஏற்றுமதி',
      refresh: 'புதுப்பி',
      viewDetails: 'விவரங்கள்',
      authorize: 'அனுமதி வழங்கு',
      verified: 'சரிபார்க்கப்பட்டது',
      critical: 'அதி முக்கியம் (CRITICAL)',
      high: 'அதிகம் (HIGH)',
      medium: 'நடுத்தரம் (MEDIUM)',
      low: 'குறைவு (LOW)',
    },
    status: {
      new: 'புதியது',
      open: 'திறக்கப்பட்டது',
      triaged: 'பரிசீலிக்கப்பட்டது',
      dispatched: 'ஒதுக்கப்பட்டது',
      inProgress: 'நடவடிக்கையில்',
      pendingParts: 'உதிரிபாகம் தேவை',
      completed: 'முடிக்கப்பட்டது',
      resolved: 'தீர்க்கப்பட்டது',
      closed: 'மூடப்பட்டது',
      approved: 'அனுமதிக்கப்பட்டது',
      rejected: 'நிராகரிக்கப்பட்டது',
      blocked: 'தடைபட்டது',
    },
    dashboards: {
      student: {
        title: 'மாணவர் செயல்பாட்டு மையம்',
        subtitle: 'வளாகப் பிரச்சனைகளைப் பதிவு செய்யவும், உங்கள் புகார்களின் நேரலை நிலையைக் கண்காணிக்கவும்.',
        activeIncidents: 'செயலில் உள்ள புகார்கள்',
        resolvedMonth: 'இந்த மாதம் தீர்க்கப்பட்டவை',
        campusAlerts: 'வளாகத் தடங்கல் எச்சரிக்கைகள்',
        recentReports: 'சமீபத்திய புகார்கள்',
        reportNewIssueBtn: 'புதிய புகார் பதிவு செய்',
        viewAllReports: 'அனைத்து புகார்களையும் பார் →',
        emptyReports: 'இதுவரை புகார்கள் எதுவும் இல்லை.',
      },
      faculty: {
        title: 'ஆசிரியர் கல்வி மையம்',
        subtitle: 'வகுப்பறை அட்டவணை கண்காணிப்பு, அவசர ஆபத்து அறிவிப்புகள் மற்றும் அறை இடமாற்றங்கள்.',
        alertDisruption: 'வகுப்பறைத் தடை எச்சரிக்கை',
        roomPasses: 'இடமாற்ற டிஜிட்டல் பாஸ்கள்',
        mySchedule: 'இன்றைய கற்பித்தல் அட்டவணை',
        reportHazardBtn: 'வகுப்பறை ஆபத்தைப் பதிவு செய்',
        timetableStatus: 'அட்டவணை ஒருமைப்பாடு',
        todayClasses: 'திட்டமிடப்பட்ட வகுப்புகள் & ஆய்வகங்கள்',
      },
      technician: {
        title: 'தொழில்நுட்ப வல்லுநர் பணிப் பட்டியல்',
        subtitle: 'ஒதுக்கப்பட்ட பழுதுபார்ப்பு பணிகள், SLA காலக்கெடு மற்றும் உதிரிபாகக் கோரிக்கைகள்.',
        assignedOrders: 'செயலில் உள்ள பணி ஆணைகள்',
        pendingParts: 'உதிரிபாகங்களுக்காகக் காத்திருப்பவை',
        completedToday: 'இன்று முடிக்கப்பட்ட பழுதுகள்',
        startWork: 'பணியைத் தொடங்கு',
        requestSpares: 'உதிரிபாகம் கோரு',
        scheduleShift: 'ஷிப்ட் அட்டவணையைப் பார்',
        dueSoon: 'SLA காலக்கெடு விரைவில் முடிகிறது',
      },
      deptManager: {
        title: 'துறை செயல்பாட்டு கட்டளை மையம்',
        subtitle: 'தேர்வு அறை இடமாற்றங்கள், கல்வித் தொடர்ச்சி மேற்பார்வை மற்றும் துறை சார்ந்த அனுமதிகள்.',
        relocationsNeeded: 'அவசர இடமாற்றம் தேவைப்படும் வகுப்புகள்',
        authorizedRelocations: 'அனுமதிக்கப்பட்ட இடமாற்றங்கள்',
        conflictMatrix: 'அட்டவணை முரண்பாட்டு அணி',
        approveRelocationBtn: 'வகுப்பறை இடமாற்றத்தை அங்கீகரி',
        urgentAction: 'அவசர நடவடிக்கை தேவை',
      },
      facilities: {
        title: 'வளாக வசதிகள் & பணி ஒதுக்கீடு',
        subtitle: 'சம்பவ பரிசீலனை, பணி ஆணை ஒதுக்கீடு மற்றும் வளாக உள்கட்டமைப்பு மேற்பார்வை.',
        triageQueue: 'ஒதுக்கப்படாத சம்பவங்களின் பட்டியல்',
        openWorkOrders: 'செயலில் உள்ள பணி ஆணைகள்',
        availableTechs: 'கிடைக்கக்கூடிய தொழில்நுட்ப வல்லுநர்கள்',
        autoCorrelate: 'போலி புகார் கண்டறிதல் செயலில்',
        dispatchWorkOrder: 'தொழில்நுட்ப வல்லுநரை ஒதுக்கு',
        slaRisk: 'காலக்கெடு ஆபத்தில் உள்ளவை',
      },
      procurement: {
        title: 'மத்திய கொள்முதல் மையம்',
        subtitle: 'இரட்டை கையொப்ப கொள்முதல் ஒப்புதல் (கொள்கை 4.2), இருப்பு நிரப்புதல் மற்றும் ரசீதுகள்.',
        pendingRequests: 'நிலுவையில் உள்ள கொள்முதல் கோரிக்கைகள்',
        lowStockItems: 'குறைந்த இருப்பு உதிரிபாகங்கள்',
        totalInventory: 'பட்டியலிடப்பட்ட இருப்புப் பொருட்கள்',
        approveRequestBtn: 'கோரிக்கையை அங்கீகரி',
        receiveStockBtn: 'பொருட்கள் வரவை பதிவு செய்',
        dualSign: 'இரட்டை ஒப்புதல் கட்டாயம்',
      },
      sysadmin: {
        title: 'கணினி உள்கட்டமைப்பு & பாதுகாப்பு',
        subtitle: 'தரவுத்தள ஒருமைப்பாடு, bcrypt அமர்வு பாதுகாப்பு, QR பேட்ஜ் உருவாக்கம் மற்றும் தணிக்கை.',
        systemHealth: 'SQLite தரவுத்தள ஒருமைப்பாடு',
        activeSessions: 'செயலில் உள்ள பயனர்கள்',
        dbRecords: 'வளாகத் தரவுப் பதிவுகள்',
        auditLog: 'மாற்ற முடியாத தணிக்கை பதிவு',
        generateQr: 'QR பேட்ஜ்களை உருவாக்கு',
        runDiagnostics: 'PRAGMA கணினி சோதனையை இயக்கு',
      },
    },
  },

  hi: {
    appName: 'कैम्पसऑप्स (CampusOps)',
    tagline: 'स्मार्ट कैंपस संचालन प्लेटफॉर्म',
    topbar: {
      operationalSector: 'संचालन क्षेत्र',
      searchPlaceholder: 'घटनाएं, संपत्ति, कमरे, कार्य आदेश खोजें...',
      activeRoleLabel: 'सक्रिय भूमिका',
      switchRole: 'भूमिका बदलें',
      quickPresets: 'त्वरित भूमिका चयन',
    },
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
      campusData: 'परिसर डेटा & QR',
      integrations: 'एकीकरण',
      auditSecurity: 'लेखापरीक्षा एवं सुरक्षा',
      logout: 'लॉग आउट',
    },
    complaintForm: {
      title: 'परिसर की समस्या दर्ज करें',
      subtitle: 'उपकरण क्यूआर स्कैनर, आवाज से टाइपिंग और फोटो साक्ष्य के साथ आधुनिक शिकायत प्रणाली।',
      step1Language: 'भाषा चुनें / Language / மொழி',
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
      cameraCapture: 'कैमरा खोलें',
      browseFiles: 'फ़ाइलें चुनें',
      analyzingText: 'शिकायत का अर्थ विश्लेषण हो रहा है...',
      detectedCategory: 'पहचानी गई श्रेणी',
      suggestedPriority: 'निर्धारित प्राथमिकता',
      missingInfoWarning: 'कृपया कम से कम 5 अक्षरों का विवरण प्रदान करें।',
      submitBtn: 'शिकायत दर्ज करें',
      submitting: 'सहेजा जा रहा है...',
      successTitle: 'शिकायत सफलतापूर्वक दर्ज की गई!',
      referenceNumber: 'घटना संदर्भ संख्या',
      viewInReports: 'मेरी शिकायतें देखें',
      submitAnother: 'दूसरी शिकायत दर्ज करें',
    },
    reportsList: {
      title: 'मेरी दर्ज की गई शिकायतें',
      subtitle: 'अपनी शिकायतों की लाइव स्थिति, समाधान की प्रगति और मरम्मत के साक्ष्य ट्रैक करें।',
      allFilter: 'सभी शिकायतें',
      pendingFilter: 'लंबित',
      assignedFilter: 'सौंपी गई',
      inProgressFilter: 'प्रगति पर',
      resolvedFilter: 'हल की गई',
      searchPlaceholder: 'संदर्भ संख्या, कमरा या समस्या से खोजें...',
      emptyTitle: 'अभी तक कोई शिकायत दर्ज नहीं की गई',
      emptySubtitle: 'जब आप परिसर की समस्याएं दर्ज करेंगे, तो उनकी लाइव प्रगति यहां दिखाई देगी।',
      tableRef: 'संदर्भ संख्या',
      tableSummary: 'विवरण सारांश',
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
      back: 'पीछे',
      retake: 'पुनः लें',
      openCamera: 'कैमरा खोलें',
      capture: 'फोटो खींचें',
      browse: 'फ़ाइलें',
      export: 'निर्यात करें',
      refresh: 'ताज़ा करें',
      viewDetails: 'विवरण देखें',
      authorize: 'अधिकृत करें',
      verified: 'सत्यापित',
      critical: 'अति गंभीर (CRITICAL)',
      high: 'उच्च (HIGH)',
      medium: 'मध्यम (MEDIUM)',
      low: 'सामान्य (LOW)',
    },
    status: {
      new: 'नया',
      open: 'खुला',
      triaged: 'वर्गीकृत',
      dispatched: 'आवंटित',
      inProgress: 'प्रगति पर',
      pendingParts: 'पुर्जे लंबित',
      completed: 'पूर्ण',
      resolved: 'समाधान हुआ',
      closed: 'बंद',
      approved: 'स्वीकृत',
      rejected: 'अस्वीकृत',
      blocked: 'बाधित',
    },
    dashboards: {
      student: {
        title: 'छात्र संचालन केंद्र',
        subtitle: 'परिसर की समस्याएं दर्ज करें, सक्रिय टिकटों की स्थिति देखें और परिसर अलर्ट प्राप्त करें।',
        activeIncidents: 'सक्रिय शिकायतें',
        resolvedMonth: 'इस महीने हल की गई',
        campusAlerts: 'परिसर व्यवधान अलर्ट',
        recentReports: 'हालिया शिकायतें',
        reportNewIssueBtn: 'परिसर समस्या दर्ज करें',
        viewAllReports: 'सभी शिकायतें देखें →',
        emptyReports: 'आपने अभी तक कोई शिकायत दर्ज नहीं की है।',
      },
      faculty: {
        title: 'संकाय शैक्षणिक कंसोल',
        subtitle: 'कक्षा समय सारिणी निगरानी, आपातकालीन खतरा रिपोर्टिंग और कमरा स्थानांतरण।',
        alertDisruption: 'कक्षा व्यवधान अलर्ट',
        roomPasses: 'डिजिटल पास',
        mySchedule: 'आज की समय सारिणी',
        reportHazardBtn: 'कक्षा खतरे की रिपोर्ट करें',
        timetableStatus: 'शेड्यूल स्थिति',
        todayClasses: 'निर्धारित व्याख्यान एवं प्रयोगशालाएं',
      },
      technician: {
        title: 'तकनीशियन कार्य आदेश कतार',
        subtitle: 'सौंपे गए मरम्मत कार्य, एसएलए समाधान टाइमर और पुर्जे मांग पत्र।',
        assignedOrders: 'सक्रिय कार्य आदेश',
        pendingParts: 'पुर्जों की प्रतीक्षा में',
        completedToday: 'आज पूर्ण की गई मरम्मत',
        startWork: 'कार्य शुरू करें',
        requestSpares: 'पुर्जे मांगें',
        scheduleShift: 'शिफ्ट रोस्टर देखें',
        dueSoon: 'समय सीमा निकट है',
      },
      deptManager: {
        title: 'विभाग संचालन कमान केंद्र',
        subtitle: 'परीक्षा कमरा स्थानांतरण, शैक्षणिक निरंतरता और विभागीय स्वीकृतियां।',
        relocationsNeeded: 'आवश्यक कमरा स्थानांतरण',
        authorizedRelocations: 'स्वीकृत स्थानांतरण',
        conflictMatrix: 'शेड्यूल टकराव मैट्रिक्स',
        approveRelocationBtn: 'कक्षा स्थानांतरण स्वीकृत करें',
        urgentAction: 'तत्काल कार्रवाई आवश्यक',
      },
      facilities: {
        title: 'परिसर सुविधाएं एवं कार्य आवंटन',
        subtitle: 'समस्या वर्गीकरण, कार्य आदेश आवंटन और परिसर अवसंरचना प्रबंधन।',
        triageQueue: 'अनावंटित समस्याओं की कतार',
        openWorkOrders: 'सक्रिय कार्य आदेश',
        availableTechs: 'उपलब्ध तकनीशियन',
        autoCorrelate: 'दोहरी शिकायत जांच सक्रिय',
        dispatchWorkOrder: 'तकनीशियन को सौंपें',
        slaRisk: 'जोखिम में एसएलए कार्य',
      },
      procurement: {
        title: 'केंद्रीय खरीद कंसोल',
        subtitle: 'दोहरे हस्ताक्षर अनुमोदन (नीति 4.2), स्टॉक पुनःपूर्ति और आवक रसीदें।',
        pendingRequests: 'लंबित खरीद अनुरोध',
        lowStockItems: 'कम स्टॉक वाले पुर्जे',
        totalInventory: 'कैटलॉग स्टॉक आइटम',
        approveRequestBtn: 'मांग स्वीकृत करें',
        receiveStockBtn: 'स्टॉक आवक दर्ज करें',
        dualSign: 'दोहरा हस्ताक्षर अनिवार्य',
      },
      sysadmin: {
        title: 'सिस्टम अवसंरचना एवं सुरक्षा',
        subtitle: 'डेटाबेस अखंडता, bcrypt सत्र सुरक्षा, क्यूआर बैज निर्माण और ऑडिट लॉग।',
        systemHealth: 'SQLite डेटाबेस स्थिति',
        activeSessions: 'सक्रिय उपयोगकर्ता सत्र',
        dbRecords: 'परिसर रिकॉर्ड संख्या',
        auditLog: 'अपरिवर्तनीय ऑडिट लॉग',
        generateQr: 'क्यूआर बैज बनाएं',
        runDiagnostics: 'PRAGMA डायग्नोस्टिक्स चलाएं',
      },
    },
  },
};
