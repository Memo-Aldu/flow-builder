import { AppNode } from "@/types/nodes";
import { Edge } from "@xyflow/react";
import { useMemo } from "react";

const useFlowDiff = (nodesA: AppNode[],
  edgesA: Edge[],
  nodesB: AppNode[],
  edgesB: Edge[]
) => {
  return useMemo(() => {
    const nodeMapA = new Map(nodesA.map((n) => [n.id, n]));
    const nodeMapB = new Map(nodesB.map((n) => [n.id, n]));

    const edgeSetA = new Set(edgesA.map((e) => e.id));
    const edgeSetB = new Set(edgesB.map((e) => e.id));

    const highlightNodesA: string[] = [];
    const highlightNodesB: string[] = [];

    const changedInputsMapA = new Map<string, string[]>();
    const changedInputsMapB = new Map<string, string[]>();

    // 1) Unique or changed nodes
    for (const nodeA of nodesA) {
      if (!nodeMapB.has(nodeA.id)) {
        highlightNodesA.push(nodeA.id);
        continue;
      }
      // node exists in both => compare inputs
      const nodeB = nodeMapB.get(nodeA.id)!;
      const inputsA = nodeA.data?.inputs || {};
      const inputsB = nodeB.data?.inputs || {};

      const changedKeys: string[] = [];
      const allKeys = new Set([...Object.keys(inputsA), ...Object.keys(inputsB)]);
      for (const key of allKeys) {
        if (inputsA[key] !== inputsB[key]) {
          changedKeys.push(key);
        }
      }
      if (changedKeys.length > 0) {
        changedInputsMapA.set(nodeA.id, changedKeys);
        changedInputsMapB.set(nodeB.id, changedKeys);
      }
    }

    for (const nodeB of nodesB) {
      if (!nodeMapA.has(nodeB.id)) {
        highlightNodesB.push(nodeB.id);
      }
    }

    const highlightEdgesA = [...edgeSetA].filter((id) => id && !edgeSetB.has(id));
    const highlightEdgesB = [...edgeSetB].filter((id) => id && !edgeSetA.has(id));

    return {
      highlightNodesA,
      highlightNodesB,
      changedInputsMapA,
      changedInputsMapB,
      highlightEdgesA,
      highlightEdgesB,
    };
  }, [nodesA, edgesA, nodesB, edgesB]);
}

export default useFlowDiff;