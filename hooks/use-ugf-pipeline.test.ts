import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  mapSdkEventToPipelineState,
  INITIAL_PIPELINE_STATE,
  STAGE_ORDER,
  type PipelineEvent,
  type PipelineUiState,
  type StageName,
} from "@/lib/pipeline";

/**
 * Property 3: UGF pipeline state machine monotonicity
 * Validates: Requirements 1.3, 2.5, 10.1, 10.2
 *
 * Generates random valid SDK event sequences (including failure and retry events)
 * and asserts:
 * (a) Stage success ordering: if stage S is "success", all earlier stages are also "success"
 * (b) At-most-one-active: at most one stage has status "active" at any time
 * (c) Failure halts subsequent: if any stage is "failed", all later stages are "pending"
 * (d) Retry resumes from failed stage: after a retry event, the retried stage is "active"
 *     and earlier stages are "success"
 */

/**
 * Generator for valid SDK event sequences.
 *
 * A valid sequence follows these rules:
 * - Start with stage_start for "quote"
 * - After stage_start comes either stage_success or stage_failure for the same stage
 * - After stage_success, the next stage_start is for the next stage in order
 * - After stage_failure, only a retry for the same stage is valid (then it goes back to stage_start)
 */
function validEventSequenceArb(): fc.Arbitrary<PipelineEvent[]> {
  return fc.gen().map((gen) => {
    const events: PipelineEvent[] = [];
    let currentStageIndex = 0;

    // Start with stage_start for "quote"
    events.push({ type: "stage_start", stage: STAGE_ORDER[currentStageIndex] });

    // Generate a bounded number of subsequent events
    const maxEvents = gen(fc.integer, { min: 1, max: 30 });

    for (let i = 0; i < maxEvents; i++) {
      const lastEvent = events[events.length - 1];

      if (lastEvent.type === "stage_start") {
        // After stage_start: either stage_success or stage_failure for the same stage
        const succeed = gen(fc.boolean);
        if (succeed) {
          const data: PipelineEvent["type"] extends "stage_success" ? any : any = {};
          // Optionally add data for quote and execute stages
          if (lastEvent.stage === "quote") {
            if (gen(fc.boolean)) {
              data.quoteUsd = "0.01";
              data.ethSavedEstimate = "0.001";
            }
          }
          if (lastEvent.stage === "execute") {
            if (gen(fc.boolean)) {
              data.txHash = "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890" as `0x${string}`;
            }
          }
          events.push({
            type: "stage_success",
            stage: lastEvent.stage,
            data: Object.keys(data).length > 0 ? data : undefined,
          });
        } else {
          events.push({
            type: "stage_failure",
            stage: lastEvent.stage,
            error: `Error at ${lastEvent.stage}`,
          });
        }
      } else if (lastEvent.type === "stage_success") {
        // After stage_success: next stage_start (if not at the end)
        if (currentStageIndex < STAGE_ORDER.length - 1) {
          currentStageIndex++;
          events.push({ type: "stage_start", stage: STAGE_ORDER[currentStageIndex] });
        } else {
          // Pipeline complete, stop generating
          break;
        }
      } else if (lastEvent.type === "stage_failure") {
        // After stage_failure: only a retry for the same stage is valid
        events.push({ type: "retry", stage: lastEvent.stage });
      } else if (lastEvent.type === "retry") {
        // After retry: stage_start for the same stage
        events.push({ type: "stage_start", stage: lastEvent.stage });
      }
    }

    return events;
  });
}

describe("Property 3: UGF pipeline state machine monotonicity", () => {
  it("(a) stage success ordering: if stage S is 'success', all earlier stages are also 'success'", () => {
    fc.assert(
      fc.property(validEventSequenceArb(), (events) => {
        const finalState = events.reduce<PipelineUiState>(
          (state, event) => mapSdkEventToPipelineState(state, event),
          INITIAL_PIPELINE_STATE
        );

        for (let i = 0; i < STAGE_ORDER.length; i++) {
          if (finalState[STAGE_ORDER[i]] === "success") {
            // All earlier stages must also be "success"
            for (let j = 0; j < i; j++) {
              expect(finalState[STAGE_ORDER[j]]).toBe("success");
            }
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it("(b) at-most-one-active: at most one stage has status 'active' at any time", () => {
    fc.assert(
      fc.property(validEventSequenceArb(), (events) => {
        // Check the invariant after every event in the sequence
        let state = INITIAL_PIPELINE_STATE;
        for (const event of events) {
          state = mapSdkEventToPipelineState(state, event);
          const activeCount = STAGE_ORDER.filter((s) => state[s] === "active").length;
          expect(activeCount).toBeLessThanOrEqual(1);
        }
      }),
      { numRuns: 200 }
    );
  });

  it("(c) failure halts subsequent: if any stage is 'failed', all later stages are 'pending'", () => {
    fc.assert(
      fc.property(validEventSequenceArb(), (events) => {
        // Check the invariant after every event in the sequence
        let state = INITIAL_PIPELINE_STATE;
        for (const event of events) {
          state = mapSdkEventToPipelineState(state, event);
          for (let i = 0; i < STAGE_ORDER.length; i++) {
            if (state[STAGE_ORDER[i]] === "failed") {
              // All later stages must be "pending"
              for (let j = i + 1; j < STAGE_ORDER.length; j++) {
                expect(state[STAGE_ORDER[j]]).toBe("pending");
              }
            }
          }
        }
      }),
      { numRuns: 200 }
    );
  });

  it("(d) retry resumes from failed stage: after a retry event, the retried stage is 'active' and earlier stages are 'success'", () => {
    fc.assert(
      fc.property(validEventSequenceArb(), (events) => {
        let state = INITIAL_PIPELINE_STATE;
        for (const event of events) {
          state = mapSdkEventToPipelineState(state, event);
          if (event.type === "retry") {
            const retryStageIndex = STAGE_ORDER.indexOf(event.stage);
            // The retried stage should be "active"
            expect(state[event.stage]).toBe("active");
            // All earlier stages should be "success"
            for (let j = 0; j < retryStageIndex; j++) {
              expect(state[STAGE_ORDER[j]]).toBe("success");
            }
          }
        }
      }),
      { numRuns: 200 }
    );
  });
});
