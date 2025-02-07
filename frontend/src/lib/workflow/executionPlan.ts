import { AppNode, AppNodesMissingInputs } from "@/types/nodes";
import { WorkflowExecutionPlan, WorkflowExecutionPlanPhase } from '@/types/workflows';
import { Edge, getIncomers } from "@xyflow/react";
import { TaskRegistry } from "@/lib/workflow/task/registry";

export enum WorkflowToExecutionPlanValidationError {
    NO_ENTRY_POINT = "NO_ENTRY_POINT",
    INVALID_INPUTS = "INVALID_INPUTS"
}

type FlowToExecutionPlan = {
    executionPlan?: WorkflowExecutionPlan
    error? : {
        type: WorkflowToExecutionPlanValidationError
        invalidElements?: AppNodesMissingInputs[]
    }
}

export const FlowToExecutionPlan = (nodes: AppNode[], edges: Edge[]): FlowToExecutionPlan => {

    const entryPoints = nodes.filter(node => TaskRegistry[node.data.type].isEntryPoint)

    if (entryPoints.length === 0) {
        return {
            error: {
                type: WorkflowToExecutionPlanValidationError.NO_ENTRY_POINT
            }
        }
    }

    
    let index  = 0
    const inputsWithErrors: AppNodesMissingInputs[] = []
    const planned = new Set<string>()

    // get invalid inputs for each entry point
    for (const node of entryPoints) {
        const invalidInputs = getInvalidInputs(node, edges, planned)
        if (invalidInputs.length > 0) {
            inputsWithErrors.push({
                nodeId: node.id,
                inputs: invalidInputs
            })
        }
    }

    const executionPlan = entryPoints.map(node => {
        return {
            phase: index++,
            nodes: [node]
        }
    })
    // add the entry points to the planned set
    for (const node of entryPoints) {
        planned.add(node.id)
    }


    for(let phase = index; phase < nodes.length && planned.size < nodes.length; phase++) {
        const nextPhase: WorkflowExecutionPlanPhase = { phase, nodes: [] as AppNode[] }
        for (const currentNode of nodes) {
            if (planned.has(currentNode.id)) {
                continue
            }

            const invalidInputs = getInvalidInputs(currentNode, edges, planned)

            if (invalidInputs.length > 0) {
                const incomers = getIncomers(currentNode, nodes, edges)
                if (incomers.every(incomer => planned.has(incomer.id))) {
                    // if all incomers are planned, and there are invalid inputs
                    // this means this node has invalid inputs
                    // workflow is invalid
                    console.error(`Node ${currentNode.id} has invalid inputs ${invalidInputs.join(", ")}`)
                    inputsWithErrors.push({
                        nodeId: currentNode.id,
                        inputs: invalidInputs
                    })
                } else {
                    continue
                }
            }

            nextPhase.nodes.push(currentNode)
        }

        for (const node of nextPhase.nodes) {
            planned.add(node.id)
        }
        executionPlan.push(nextPhase)
    }

    if (inputsWithErrors.length > 0) {
        return {
            error: {
                type: WorkflowToExecutionPlanValidationError.INVALID_INPUTS,
                invalidElements: inputsWithErrors
            }
        }
    }

    return { executionPlan }
}


const getInvalidInputs = (node: AppNode, edges: Edge[], planned: Set<string>) => {
    const invalidInputs = []
    const inputs = TaskRegistry[node.data.type].inputs

    for (const input of inputs) {
        const inputValue = node.data.inputs[input.name]
        const inputValueProvided = inputValue?.length > 0
        if (inputValueProvided) {
            continue
        }

        // Value not provided, by user, check if value is provided by another node

        const incomingEdges = edges.filter(edge => edge.target === node.id)
        const inputLinkedToOutput = incomingEdges.find((edge) => {
            return edge.targetHandle === input.name
        })

        const requiredInputProvidedByVisitedOutput = input.required &&
                                                     inputLinkedToOutput &&
                                                     planned.has(inputLinkedToOutput.source)
        
        if (requiredInputProvidedByVisitedOutput) {
            // the input and we have value for it
            continue
        } else if (!input.required) {
            if (!inputLinkedToOutput) continue
            if (inputLinkedToOutput && planned.has(inputLinkedToOutput.source)) {
                // output is providing a value
                continue
            }
        }
        invalidInputs.push(input.name)

    }

    return invalidInputs
}