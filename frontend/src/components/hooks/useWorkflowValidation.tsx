import { useContext } from "react";
import { WorkflowValidationContext } from "@/components/context/WorkflowValidationContext";


const useWorkflowValidation = () => {
    const context = useContext(WorkflowValidationContext);
    if (context === undefined) {
        throw new Error('useWorkflowValidation must be used within a WorkflowValidationContextProvider');
    }
    return context;
}

export default useWorkflowValidation;