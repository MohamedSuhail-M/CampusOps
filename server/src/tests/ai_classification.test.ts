import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import prisma from '../prisma';
import { runOfflineTriage, classifyComplaint } from '../services/triage.service';
import {
  normalizeComplaintInput,
  detectHighConfidenceSafetyHazards,
  runSemanticInference,
  CATEGORY_TAXONOMY,
  canonicalizeCategory,
} from '../services/ai_classifier.service';

describe('CampusOps AI Context-Aware Classification Test Suite', () => {
  let studentCookie: string;
  const password = process.env.DEMO_PASSWORD || 'password123';

  beforeAll(async () => {
    // Authenticate student session
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ loginId: 'campus001', password });
    studentCookie = studentLogin.headers['set-cookie'];
  });

  // =========================================================================
  // GROUP 1: ELECTRICAL COMPLAINTS (Context-Aware Symptoms & Natural Language)
  // =========================================================================
  describe('Group 1: Electrical Complaints', () => {
    it('1. should classify "Electrical failure in classroom 204."', () => {
      const res = runOfflineTriage('Electrical failure in classroom 204.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.departmentId).toBe('DEP05');
      expect(res.requiredSkillId).toBe('SK01');
      expect(res.extractedRoomCode).toMatch(/204/);
    });

    it('2. should classify "There is no electricity in the computer lab."', () => {
      const res = runOfflineTriage('There is no electricity in the computer lab.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.subcategory).toBe('Power Failure');
      expect(res.suggestedPriority).toBe('HIGH'); // Academic lab
      expect(res.departmentId).toBe('DEP05');
    });

    it('3. should classify "The fans and lights suddenly stopped working."', () => {
      const res = runOfflineTriage('The fans and lights suddenly stopped working.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.departmentId).toBe('DEP05');
      expect(res.requiredSkillId).toBe('SK01');
    });

    it('4. should understand colloquial phrasing: "Current is not coming to the room."', () => {
      const res = runOfflineTriage('Current is not coming to the room.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.subcategory).toBe('Power Failure');
      expect(res.departmentId).toBe('DEP05');
    });

    it('5. should detect high safety risk: "The switchboard is producing sparks."', () => {
      const res = runOfflineTriage('The switchboard is producing sparks.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.suggestedPriority).toBe('CRITICAL');
      expect(res.safety_flags).toContain('ELECTRICAL_SPARK_HAZARD');
    });

    it('6. should detect burning smell: "There is a burning smell near the power panel."', () => {
      const res = runOfflineTriage('There is a burning smell near the power panel.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.suggestedPriority).toBe('CRITICAL');
      expect(res.safety_flags).toContain('BURNING_ELECTRICAL_SMELL');
    });

    it('7. should classify breaker overload: "The circuit breaker keeps tripping."', () => {
      const res = runOfflineTriage('The circuit breaker keeps tripping.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.subcategory).toBe('Circuit Breaker Tripping');
      expect(res.suggestedPriority).toBe('HIGH');
      expect(res.safety_flags).toContain('BREAKER_TRIP_OVERLOAD');
    });

    it('8. should detect shock hazard: "The socket is damaged and exposed wires are visible."', () => {
      const res = runOfflineTriage('The socket is damaged and exposed wires are visible.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.suggestedPriority).toBe('CRITICAL');
      expect(res.safety_flags).toContain('EXPOSED_LIVE_WIRING');
    });

    it('9. should recognize root cause: "The classroom projector has no power because the power outlet is dead."', () => {
      const res = runOfflineTriage('The classroom projector has no power because the power outlet is dead.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.subcategory).toBe('Dead Power Outlet');
      expect(res.departmentId).toBe('DEP05');
      expect(res.requiredSkillId).toBe('SK01');
    });

    it('10. should classify "The electrical wiring in the laboratory appears damaged."', () => {
      const res = runOfflineTriage('The electrical wiring in the laboratory appears damaged.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.subcategory).toBe('Damaged / Exposed Wiring');
      expect(res.suggestedPriority).toBe('HIGH');
    });
  });

  // =========================================================================
  // GROUP 2: SIMILAR BUT DIFFERENT CATEGORIES (Distinguishing Symptoms)
  // =========================================================================
  describe('Group 2: Similar but Different Categories', () => {
    it('11. should distinguish AV failure: "The projector turns on, but it cannot connect to the presentation laptop."', () => {
      const res = runOfflineTriage('The projector turns on, but it cannot connect to the presentation laptop.');
      expect(res.category).toBe('AUDIO_VISUAL');
      expect(res.subcategory).toBe('HDMI / Video Signal Cable');
      expect(res.requiredSkillId).toBe('SK05');
    });

    it('12. should classify campus network outage: "The Wi-Fi is unavailable throughout the campus."', () => {
      const res = runOfflineTriage('The Wi-Fi is unavailable throughout the campus.');
      expect(res.category).toBe('NETWORK');
      expect(res.subcategory).toBe('Wi-Fi Outage');
      expect(res.suggestedPriority).toBe('HIGH');
    });

    it('13. should distinguish HVAC from electrical: "The AC is running but not cooling."', () => {
      const res = runOfflineTriage('The AC is running but not cooling.');
      expect(res.category).toBe('HVAC');
      expect(res.subcategory).toBe('AC Not Cooling');
      expect(res.requiredSkillId).toBe('SK03');
    });

    it('14. should distinguish ceiling leak: "Water is leaking from the washroom ceiling."', () => {
      const res = runOfflineTriage('Water is leaking from the washroom ceiling.');
      expect(res.category).toBe('PLUMBING');
      expect(res.subcategory).toBe('Ceiling Water Leakage');
      expect(res.requiredSkillId).toBe('SK04');
    });

    it('15. should classify carpentry/hardware: "The classroom door handle is broken."', () => {
      const res = runOfflineTriage('The classroom door handle is broken.');
      expect(res.category).toBe('FURNITURE_EQUIPMENT');
      expect(res.subcategory).toBe('Broken Door / Handle / Lock');
      expect(res.requiredSkillId).toBe('SK06');
    });

    it('16. should classify OS crash: "The computer displays a blue screen."', () => {
      const res = runOfflineTriage('The computer displays a blue screen.');
      expect(res.category).toBe('NETWORK');
      expect(res.subcategory).toBe('Computer / OS System Crash');
    });

    it('17. should distinguish entity mention from actual fault: "The electrical department has not repaired my leaking tap."', () => {
      const res = runOfflineTriage('The electrical department has not repaired my leaking tap.');
      expect(res.category).toBe('PLUMBING');
      expect(res.subcategory).toBe('Broken Tap / Faucet');
      expect(res.requiredSkillId).toBe('SK04');
    });
  });

  // =========================================================================
  // GROUP 3: AMBIGUOUS COMPLAINTS (Targeted Clarification)
  // =========================================================================
  describe('Group 3: Ambiguous Complaints', () => {
    it('18. should flag vague equipment: "The machine stopped working."', () => {
      const res = runOfflineTriage('The machine stopped working.');
      expect(res.needs_clarification).toBe(true);
      expect(res.confidence).toBeLessThan(0.60);
      expect(res.clarification_prompt).toContain('machine');
    });

    it('19. should flag vague location: "Something is wrong with the room."', () => {
      const res = runOfflineTriage('Something is wrong with the room.');
      expect(res.needs_clarification).toBe(true);
      expect(res.confidence).toBeLessThan(0.60);
      expect(res.clarification_prompt).toBeDefined();
    });

    it('20. should flag vague action: "It is not working even after restarting."', () => {
      const res = runOfflineTriage('It is not working even after restarting.');
      expect(res.needs_clarification).toBe(true);
      expect(res.confidence).toBeLessThan(0.60);
      expect(res.clarification_prompt).toBeDefined();
    });
  });

  // =========================================================================
  // GROUP 4: NEGATION & CONTEXTUAL CASES
  // =========================================================================
  describe('Group 4: Negation & Contextual Cases', () => {
    it('21. should respect negation: "There is no electrical problem; the Wi-Fi is not working."', () => {
      const res = runOfflineTriage('There is no electrical problem; the Wi-Fi is not working.');
      expect(res.category).toBe('NETWORK');
      expect(res.subcategory).toBe('Wi-Fi Outage');
    });

    it('22. should isolate working lights from failing projector: "The lights are working, but the projector is not."', () => {
      const res = runOfflineTriage('The lights are working, but the projector is not.');
      expect(res.category).toBe('AUDIO_VISUAL');
      expect(res.subcategory).toBe('Projector Display Fault');
    });

    it('23. should recognize already resolved fault: "The electrical maintenance team has already repaired the fault."', () => {
      const res = runOfflineTriage('The electrical maintenance team has already repaired the fault.');
      expect(res.subcategory).toBe('Already Resolved Report');
      expect(res.suggestedPriority).toBe('LOW');
    });

    it('24. should recognize status inquiry: "I want to know when the electrical department will visit."', () => {
      const res = runOfflineTriage('I want to know when the electrical department will visit.');
      expect(res.subcategory).toBe('Service Status Inquiry');
      expect(res.suggestedPriority).toBe('LOW');
    });
  });

  // =========================================================================
  // GROUP 5: MULTIPLE ISSUES
  // =========================================================================
  describe('Group 5: Multiple Issues Handling', () => {
    it('25. should identify primary and secondary issues: "There is no power in the laboratory, and water is leaking near the door."', () => {
      const res = runOfflineTriage('There is no power in the laboratory, and water is leaking near the door.');
      expect(res.category).toBe('ELECTRICAL');
      expect(res.subcategory).toBe('Power Failure');
      expect(res.secondary_categories?.length).toBeGreaterThan(0);
      expect(res.secondary_categories?.[0].category).toBe('PLUMBING');
    });
  });

  // =========================================================================
  // GROUP 6: DETERMINISTIC PIPELINE LAYERS & CONSISTENCY CHECKS
  // =========================================================================
  describe('Group 6: Pipeline Layers & Deterministic Validation', () => {
    it('Layer 1: should normalize input and extract room and language', () => {
      const normEN = normalizeComplaintInput('  Broken fan in room B-204  ');
      expect(normEN.cleaned).toBe('Broken fan in room B-204');
      expect(normEN.extractedRoomCode).toBe('B-204');
      expect(normEN.detectedLanguage).toBe('en');

      const normTA = normalizeComplaintInput('வகுப்பறை பி-204 மின்சார விளக்கு வேலை செய்யவில்லை');
      expect(normTA.detectedLanguage).toBe('ta');
      expect(normTA.extractedRoomCode).toBe('B-204');
    });

    it('Layer 2: should accurately detect all high-confidence safety hazards', () => {
      const norm = normalizeComplaintInput('Dangerous sparks coming from the power panel with burning smell');
      const hazards = detectHighConfidenceSafetyHazards(norm);
      expect(hazards.length).toBeGreaterThanOrEqual(2);
      const flags = hazards.map((h) => h.flag);
      expect(flags).toContain('ELECTRICAL_SPARK_HAZARD');
      expect(flags).toContain('BURNING_ELECTRICAL_SMELL');
    });

    it('Layer 4: should validate category against allowed taxonomy and enforce department mapping', () => {
      expect(canonicalizeCategory('AV')).toBe('AUDIO_VISUAL');
      expect(canonicalizeCategory('electrical')).toBe('ELECTRICAL');
      expect(canonicalizeCategory('unknown_xyz')).toBe('GENERAL');

      // Verify department mappings in taxonomy match database schema
      expect(CATEGORY_TAXONOMY.ELECTRICAL.departmentId).toBe('DEP05');
      expect(CATEGORY_TAXONOMY.ELECTRICAL.requiredSkillId).toBe('SK01');
      expect(CATEGORY_TAXONOMY.NETWORK.departmentId).toBe('DEP05');
      expect(CATEGORY_TAXONOMY.CANTEEN_HYGIENE.departmentId).toBe('DEP04');
      expect(CATEGORY_TAXONOMY.SAFETY_INCIDENT.departmentId).toBe('DEP04');
    });

    it('Layer 4: should overrule contradiction if electrical hazard exists but category is general', () => {
      const norm = normalizeComplaintInput('The switchboard is giving sparks and burning smell');
      const hazards = detectHighConfidenceSafetyHazards(norm);
      const semantic = runSemanticInference(norm, hazards);
      // Even if raw inference was tweaked, final category must strictly be ELECTRICAL with CRITICAL
      expect(semantic.category).toBe('ELECTRICAL');
      expect(hazards[0].severity).toBe('CRITICAL');
    });
  });

  // =========================================================================
  // GROUP 7: END-TO-END WORKFLOW & DATABASE PERSISTENCE
  // =========================================================================
  describe('Group 7: End-to-End Intake & Database Persistence', () => {
    it('should submit an electrical complaint, persist enriched aiMetadata, and save correct category', async () => {
      const res = await request(app)
        .post('/api/intake')
        .set('Cookie', studentCookie)
        .send({
          originalText: 'The switchboard is producing sparks in Room B-204',
          channel: 'WEB',
          roomId: 'RM-B-204',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.category).toBe('ELECTRICAL');
      expect(res.body.data.priority).toBe('CRITICAL');

      // Verify saved in DB
      const intakeMsg = await prisma.intakeMessage.findUnique({
        where: { id: res.body.data.intakeMessageId },
      });
      expect(intakeMsg).toBeDefined();
      expect(intakeMsg?.aiMetadata).toBeDefined();

      const meta = JSON.parse(intakeMsg!.aiMetadata!);
      expect(meta.category).toBe('ELECTRICAL');
      expect(meta.departmentId).toBe('DEP05');
      expect(meta.requiredSkillId).toBe('SK01');
      expect(meta.safety_flags).toContain('ELECTRICAL_SPARK_HAZARD');

      const incident = await prisma.incident.findUnique({
        where: { id: res.body.data.incidentId },
      });
      expect(incident?.category).toBe('ELECTRICAL');
      expect(incident?.priority).toBe('CRITICAL');
    });

    it('should return enriched AI metadata in triage-preview API', async () => {
      const res = await request(app)
        .post('/api/intake/triage-preview')
        .set('Cookie', studentCookie)
        .send({
          originalText: 'The classroom projector has no power because the power outlet is dead in B-204',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.triage.category).toBe('ELECTRICAL');
      expect(res.body.data.triage.subcategory).toBe('Dead Power Outlet');
      expect(res.body.data.triage.department).toBe('Facilities');
      expect(res.body.data.triage.departmentId).toBe('DEP05');
      expect(res.body.data.triage.requiredSkillId).toBe('SK01');
    });
  });
});
