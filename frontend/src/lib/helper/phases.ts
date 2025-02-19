import { ExecutionPhase } from "@/types/phases";


type Phase = Pick<ExecutionPhase, 'credits_consumed'>
export const GetWorkflowCost = (workflow: Phase[]): number => {
    return workflow.reduce((acc, phase) => acc + (phase.credits_consumed ?? 0), 0)
}