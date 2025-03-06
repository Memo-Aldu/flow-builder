import { useContext } from "react";
import { WorkflowValidationContext } from "@/components/context/WorkflowValidationContext";
import { clear } from "console";


const useWorkflowValidation = () => {
    const context = useContext(WorkflowValidationContext);
    if (context === undefined) {
        return {
            invalidInputs: [],
            invalidOutputs: [],
            invalidEdges: [],
            setInvalidInputs: () => {},
            clearErrors: () => {},
        }
    }
    return context;
}

export default useWorkflowValidation;