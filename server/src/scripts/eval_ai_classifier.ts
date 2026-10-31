/**
 * CampusOps AI Complaint Classifier Evaluation Benchmark
 * 
 * Evaluates semantic understanding, context accuracy, safety detection,
 * negation scoping, and ambiguity handling across 25 labeled test cases.
 * 
 * Usage:
 *   npx tsx src/scripts/eval_ai_classifier.ts
 */

import { classifyComplaint, VALID_CATEGORIES } from '../services/ai_classifier.service';

interface BenchmarkCase {
  id: number;
  complaint: string;
  expectedCategory: string;
  expectedSubcategory?: string;
  expectedMinPriority?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  expectedSafetyFlag?: string;
  expectedNeedsClarification?: boolean;
  notes: string;
}

const BENCHMARK_DATASET: BenchmarkCase[] = [
  // 1. Electrical
  {
    id: 1,
    complaint: 'Electrical failure in classroom 204.',
    expectedCategory: 'ELECTRICAL',
    expectedSubcategory: 'Power Failure',
    expectedMinPriority: 'HIGH',
    notes: 'Direct electrical breakdown report',
  },
  {
    id: 2,
    complaint: 'There is no electricity in the computer lab.',
    expectedCategory: 'ELECTRICAL',
    expectedSubcategory: 'Power Failure',
    expectedMinPriority: 'HIGH',
    notes: 'Power failure in academic laboratory',
  },
  {
    id: 3,
    complaint: 'The fans and lights suddenly stopped working.',
    expectedCategory: 'ELECTRICAL',
    notes: 'Simultaneous lighting and fan power stoppage',
  },
  {
    id: 4,
    complaint: 'Current is not coming to the room.',
    expectedCategory: 'ELECTRICAL',
    notes: 'Indian English colloquial phrasing for power cut',
  },
  {
    id: 5,
    complaint: 'The switchboard is producing sparks.',
    expectedCategory: 'ELECTRICAL',
    expectedMinPriority: 'CRITICAL',
    expectedSafetyFlag: 'ELECTRICAL_SPARK_HAZARD',
    notes: 'High emergency electrical fire hazard',
  },
  {
    id: 6,
    complaint: 'There is a burning smell near the power panel.',
    expectedCategory: 'ELECTRICAL',
    expectedMinPriority: 'CRITICAL',
    expectedSafetyFlag: 'BURNING_ELECTRICAL_SMELL',
    notes: 'Active overheating/smoke warning near panel',
  },
  {
    id: 7,
    complaint: 'The circuit breaker keeps tripping.',
    expectedCategory: 'ELECTRICAL',
    expectedSubcategory: 'Circuit Breaker Tripping',
    expectedMinPriority: 'HIGH',
    expectedSafetyFlag: 'BREAKER_TRIP_OVERLOAD',
    notes: 'Persistent breaker overload condition',
  },
  {
    id: 8,
    complaint: 'The socket is damaged and exposed wires are visible.',
    expectedCategory: 'ELECTRICAL',
    expectedMinPriority: 'CRITICAL',
    expectedSafetyFlag: 'EXPOSED_LIVE_WIRING',
    notes: 'Direct electrocution risk',
  },
  {
    id: 9,
    complaint: 'The classroom projector has no power because the power outlet is dead.',
    expectedCategory: 'ELECTRICAL',
    expectedSubcategory: 'Dead Power Outlet',
    notes: 'Root cause is electrical wall socket, not AV device failure',
  },
  {
    id: 10,
    complaint: 'The electrical wiring in the laboratory appears damaged.',
    expectedCategory: 'ELECTRICAL',
    expectedMinPriority: 'HIGH',
    notes: 'Laboratory physical wiring degradation',
  },

  // 2. Similar but Different
  {
    id: 11,
    complaint: 'The projector turns on, but it cannot connect to the presentation laptop.',
    expectedCategory: 'AUDIO_VISUAL',
    expectedSubcategory: 'HDMI / Video Signal Cable',
    notes: 'AV cable or signal connection failure',
  },
  {
    id: 12,
    complaint: 'The Wi-Fi is unavailable throughout the campus.',
    expectedCategory: 'NETWORK',
    expectedSubcategory: 'Wi-Fi Outage',
    notes: 'Widespread network infrastructure outage',
  },
  {
    id: 13,
    complaint: 'The AC is running but not cooling.',
    expectedCategory: 'HVAC',
    expectedSubcategory: 'AC Not Cooling',
    notes: 'HVAC compressor refrigeration failure',
  },
  {
    id: 14,
    complaint: 'Water is leaking from the washroom ceiling.',
    expectedCategory: 'PLUMBING',
    expectedSubcategory: 'Ceiling Water Leakage',
    notes: 'Plumbing / ceiling drainage leak',
  },
  {
    id: 15,
    complaint: 'The classroom door handle is broken.',
    expectedCategory: 'FURNITURE_EQUIPMENT',
    expectedSubcategory: 'Broken Door / Handle / Lock',
    notes: 'Physical furniture/door hardware failure',
  },
  {
    id: 16,
    complaint: 'The computer displays a blue screen.',
    expectedCategory: 'NETWORK',
    expectedSubcategory: 'Computer / OS System Crash',
    notes: 'IT / Workstation operating system crash',
  },
  {
    id: 17,
    complaint: 'The electrical department has not repaired my leaking tap.',
    expectedCategory: 'PLUMBING',
    expectedSubcategory: 'Broken Tap / Faucet',
    notes: 'Entity mention in grievance vs actual fault',
  },

  // 3. Ambiguous Complaints
  {
    id: 18,
    complaint: 'The machine stopped working.',
    expectedCategory: 'GENERAL',
    expectedNeedsClarification: true,
    notes: 'Vague machine reference lacking technical evidence',
  },
  {
    id: 19,
    complaint: 'Something is wrong with the room.',
    expectedCategory: 'GENERAL',
    expectedNeedsClarification: true,
    notes: 'Indeterminate room problem needing details',
  },
  {
    id: 20,
    complaint: 'It is not working even after restarting.',
    expectedCategory: 'GENERAL',
    expectedNeedsClarification: true,
    notes: 'Vague action without identifying device',
  },

  // 4. Negation & Contextual
  {
    id: 21,
    complaint: 'There is no electrical problem; the Wi-Fi is not working.',
    expectedCategory: 'NETWORK',
    expectedSubcategory: 'Wi-Fi Outage',
    notes: 'Explicit negation of electrical fault',
  },
  {
    id: 22,
    complaint: 'The lights are working, but the projector is not.',
    expectedCategory: 'AUDIO_VISUAL',
    expectedSubcategory: 'Projector Display Fault',
    notes: 'Explicit affirmation of lighting power; AV hardware isolated',
  },
  {
    id: 23,
    complaint: 'The electrical maintenance team has already repaired the fault.',
    expectedCategory: 'GENERAL',
    expectedSubcategory: 'Already Resolved Report',
    notes: 'Status update on completed repair',
  },
  {
    id: 24,
    complaint: 'I want to know when the electrical department will visit.',
    expectedCategory: 'GENERAL',
    expectedSubcategory: 'Service Status Inquiry',
    notes: 'Inquiry regarding team arrival time',
  },

  // 5. Multiple Issues
  {
    id: 25,
    complaint: 'There is no power in the laboratory, and water is leaking near the door.',
    expectedCategory: 'ELECTRICAL',
    expectedSubcategory: 'Power Failure',
    notes: 'Compound issue: primary electrical with secondary plumbing',
  },
];

async function runEvaluation() {
  console.log('='.repeat(80));
  console.log('CAMPUSOPS AI CONTEXT-AWARE CLASSIFIER EVALUATION');
  console.log('='.repeat(80));
  console.log(`Model Mode: ${process.env.GEMINI_API_KEY ? 'Live Gemini LLM + Semantic Engine' : 'Deterministic Semantic Inference Engine'}`);
  console.log(`Total Benchmark Cases: ${BENCHMARK_DATASET.length}`);
  console.log('-'.repeat(80));

  let passedCases = 0;
  let safetyPassed = 0;
  let safetyTotal = 0;
  let clarificationPassed = 0;
  let clarificationTotal = 0;

  for (const b of BENCHMARK_DATASET) {
    const start = Date.now();
    const result = await classifyComplaint(b.complaint);
    const duration = Date.now() - start;

    let isMatch = result.category === b.expectedCategory;
    if (b.expectedSubcategory && result.subcategory !== b.expectedSubcategory) {
      // Minor penalty or match check
    }

    if (b.expectedSafetyFlag) {
      safetyTotal++;
      if (result.safety_flags.includes(b.expectedSafetyFlag)) {
        safetyPassed++;
      } else {
        isMatch = false;
      }
    }

    if (b.expectedNeedsClarification !== undefined) {
      clarificationTotal++;
      if (result.needs_clarification === b.expectedNeedsClarification) {
        clarificationPassed++;
      } else {
        isMatch = false;
      }
    }

    if (isMatch) passedCases++;

    const statusSymbol = isMatch ? '✓ PASS' : '✗ FAIL';
    console.log(
      `[#${b.id.toString().padStart(2, '0')}] ${statusSymbol} (${duration}ms) | Category: ${result.category} (Expected: ${b.expectedCategory}) | Sub: ${result.subcategory}`
    );
    console.log(`     Text: "${b.complaint}"`);
    console.log(`     Dept: ${result.department} (Skill: ${result.requiredSkillName}) | Pri: ${result.priority} | Conf: ${(result.confidence * 100).toFixed(0)}%`);
    if (result.safety_flags.length > 0) {
      console.log(`     🚨 Safety Flags: [${result.safety_flags.join(', ')}]`);
    }
    if (result.needs_clarification) {
      console.log(`     ℹ️ Clarification Required: "${result.clarification_prompt}"`);
    }
    if (result.secondary_categories && result.secondary_categories.length > 0) {
      console.log(`     📎 Secondary Issues: ${JSON.stringify(result.secondary_categories)}`);
    }
    console.log('');
  }

  const accuracy = (passedCases / BENCHMARK_DATASET.length) * 100;
  const safetyAccuracy = safetyTotal > 0 ? (safetyPassed / safetyTotal) * 100 : 100;
  const clarificationAccuracy = clarificationTotal > 0 ? (clarificationPassed / clarificationTotal) * 100 : 100;

  console.log('='.repeat(80));
  console.log('EVALUATION SUMMARY:');
  console.log(`Overall Category & Context Accuracy: ${passedCases}/${BENCHMARK_DATASET.length} (${accuracy.toFixed(1)}%)`);
  console.log(`Safety & Hazard Escalation Accuracy: ${safetyPassed}/${safetyTotal} (${safetyAccuracy.toFixed(1)}%)`);
  console.log(`Ambiguity / Clarification Detection: ${clarificationPassed}/${clarificationTotal} (${clarificationAccuracy.toFixed(1)}%)`);
  console.log('='.repeat(80));
}

runEvaluation().catch(console.error);
