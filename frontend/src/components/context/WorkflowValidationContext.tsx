import { AppNodesMissingInputs } from "@/types/nodes";
import { createContext, Dispatch, ReactNode, SetStateAction, useState, useMemo } from "react";

type FlowValidationContextType = {
    invalidInputs: AppNodesMissingInputs[];
    setInvalidInputs: Dispatch<SetStateAction<AppNodesMissingInputs[]>>;
    clearErrors: () => void;
}

export const WorkflowValidationContext = createContext<FlowValidationContextType | undefined>(undefined);

export const WorkflowValidationContextProvider: React.FC<{children: ReactNode}> = ({ children }) => {
    const [invalidInputs, setInvalidInputs] = useState<AppNodesMissingInputs[]>([])

    const clearErrors = () => {
        setInvalidInputs([])
    }

    const value = useMemo(() => ({
        invalidInputs,
        setInvalidInputs,
        clearErrors
    }), [invalidInputs, setInvalidInputs, clearErrors]);

    return <WorkflowValidationContext.Provider value={value}>{children}</WorkflowValidationContext.Provider>
}