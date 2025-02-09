import { FlowToExecutionPlan, WorkflowToExecutionPlanValidationError } from "@/lib/workflow/executionPlan";
import { AppNode } from "@/types/nodes";
import { useReactFlow } from "@xyflow/react";
import { useCallback } from "react";
import useWorkflowValidation from "@/components/hooks/useWorkflowValidation";
import { toast } from "sonner";

const useExecutionPlan = () => {
    const { toObject } = useReactFlow()
    const { setInvalidInputs, clearErrors } = useWorkflowValidation()

    const handleError = useCallback((error: any) => {
        switch (error.type) {
            case WorkflowToExecutionPlanValidationError.NO_ENTRY_POINT:
                toast.error("No entry point found")
                break
            case WorkflowToExecutionPlanValidationError.INVALID_INPUTS:
                toast.error("Invalid inputs found")
                setInvalidInputs(error.invalidElements)
                break
            default:
                toast.error("An error occurred")
                break
        }
    }, [setInvalidInputs])

    const generateExecutionPlan = useCallback(() => {
        const { nodes, edges } = toObject()

        const { executionPlan, error } = FlowToExecutionPlan(nodes as AppNode[], edges)
        if (error) {
            handleError(error)
            return null
        }

        clearErrors()
        return executionPlan
    }, [toObject, handleError, clearErrors])
    return generateExecutionPlan
}

export default useExecutionPlan;