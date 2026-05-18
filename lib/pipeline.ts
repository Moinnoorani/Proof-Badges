// UGF Pipeline State Mapper
// Implements the state machine: idle → quote → settle → execute → confirm → success
// with transitions to "failed" from any active stage.

export type StageStatus = "pending" | "active" | "success" | "failed";

export type StageName = "quote" | "settle" | "execute" | "confirm";

export type PipelineUiState = {
  quote: StageStatus;
  settle: StageStatus;
  execute: StageStatus;
  confirm: StageStatus;
  errorMessage?: string;
  failedStage?: StageName;
  txHash?: `0x${string}`;
  quoteUsd?: string;
  ethSavedEstimate?: string;
};

export type PipelineEvent =
  | { type: "stage_start"; stage: StageName }
  | { type: "stage_success"; stage: StageName; data?: { txHash?: `0x${string}`; quoteUsd?: string; ethSavedEstimate?: string } }
  | { type: "stage_failure"; stage: StageName; error: string }
  | { type: "retry"; stage: StageName };

export const STAGE_ORDER: readonly StageName[] = ["quote", "settle", "execute", "confirm"] as const;

export const INITIAL_PIPELINE_STATE: PipelineUiState = {
  quote: "pending",
  settle: "pending",
  execute: "pending",
  confirm: "pending",
};

/**
 * Pure state mapper: given the previous pipeline state and an SDK event,
 * returns the next pipeline state.
 *
 * Properties that hold:
 * 1. Stages progress monotonically: quote → settle → execute → confirm
 * 2. At most one stage is "active" at any time
 * 3. Once a stage is "failed", all later stages remain "pending"
 * 4. After retry from failed stage S, S resets to "active", earlier stages stay "success"
 */
export function mapSdkEventToPipelineState(
  prevState: PipelineUiState,
  event: PipelineEvent
): PipelineUiState {
  switch (event.type) {
    case "stage_start": {
      const { stage } = event;
      const stageIndex = STAGE_ORDER.indexOf(stage);

      // Build new state: mark the target stage as "active",
      // all earlier stages should be "success", all later stages "pending"
      const newState: PipelineUiState = {
        ...prevState,
        errorMessage: undefined,
        failedStage: undefined,
      };

      for (let i = 0; i < STAGE_ORDER.length; i++) {
        const s = STAGE_ORDER[i];
        if (i < stageIndex) {
          newState[s] = "success";
        } else if (i === stageIndex) {
          newState[s] = "active";
        } else {
          newState[s] = "pending";
        }
      }

      return newState;
    }

    case "stage_success": {
      const { stage, data } = event;
      const stageIndex = STAGE_ORDER.indexOf(stage);

      const newState: PipelineUiState = {
        ...prevState,
        errorMessage: undefined,
        failedStage: undefined,
      };

      // Mark the stage as success, earlier stages stay as-is (should be success),
      // later stages stay pending
      for (let i = 0; i < STAGE_ORDER.length; i++) {
        const s = STAGE_ORDER[i];
        if (i <= stageIndex) {
          newState[s] = "success";
        }
        // Later stages remain as they were (pending)
      }

      // Attach data from the event
      if (data?.txHash) {
        newState.txHash = data.txHash;
      }
      if (data?.quoteUsd) {
        newState.quoteUsd = data.quoteUsd;
      }
      if (data?.ethSavedEstimate) {
        newState.ethSavedEstimate = data.ethSavedEstimate;
      }

      return newState;
    }

    case "stage_failure": {
      const { stage, error } = event;
      const stageIndex = STAGE_ORDER.indexOf(stage);

      const newState: PipelineUiState = {
        ...prevState,
        errorMessage: error,
        failedStage: stage,
      };

      // Mark the failed stage, keep earlier stages as success, later stages as pending
      for (let i = 0; i < STAGE_ORDER.length; i++) {
        const s = STAGE_ORDER[i];
        if (i < stageIndex) {
          newState[s] = "success";
        } else if (i === stageIndex) {
          newState[s] = "failed";
        } else {
          newState[s] = "pending";
        }
      }

      return newState;
    }

    case "retry": {
      const { stage } = event;
      const stageIndex = STAGE_ORDER.indexOf(stage);

      const newState: PipelineUiState = {
        ...prevState,
        errorMessage: undefined,
        failedStage: undefined,
      };

      // On retry: preserve earlier "success" stages, reset the retried stage to "active",
      // later stages remain "pending"
      for (let i = 0; i < STAGE_ORDER.length; i++) {
        const s = STAGE_ORDER[i];
        if (i < stageIndex) {
          newState[s] = "success";
        } else if (i === stageIndex) {
          newState[s] = "active";
        } else {
          newState[s] = "pending";
        }
      }

      return newState;
    }

    default:
      return prevState;
  }
}
