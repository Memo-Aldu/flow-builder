import { AppNode } from "@/types/nodes";
import { TaskRegistry } from "./task/registry";

const CalculateWorkflowCost = (nodes: AppNode[]): number => {
    return nodes.reduce((acc, node) => {
        return acc + TaskRegistry[node.data.type].credits;
    }, 0);
}

export default CalculateWorkflowCost