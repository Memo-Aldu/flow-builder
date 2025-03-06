import dagre from '@dagrejs/dagre';
import { WorkflowVersion } from "@/types/versions";
import { Edge, Node, Position } from "@xyflow/react";
import { TimelineNodeData } from "@/types/nodes";


const dagreGraph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 150;


const buildTimeline = (versions: WorkflowVersion[]) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  versions.forEach((v) => {
    nodes.push({
      id: String(v.id),
      type: "TimelineNode",
      data: {
        label: `Version ${v.version_number}`,
        createdBy: v.created_by,
        createdAt: v.created_at,
        isLatest: v.is_active,
        isSelected: v.is_active
      } as TimelineNodeData,
      position: { x: 0, y: 0 },
    });
  });

  for (const v of versions) {
    if (v.parent_version_id) {
      edges.push({
        id: `edge-${v.parent_version_id}-to-${v.id}`,
        source: String(v.parent_version_id),
        target: String(v.id),
        type: "straight",
        animated: true,
      });
    }
  }

  const { nodes: laidOutNodes, edges: laidOutEdges } = layoutNodesWithDagre(nodes, edges);

  return { nodes: laidOutNodes, edges: laidOutEdges };
}

export default buildTimeline;


export function layoutNodesWithDagre(
  nodes: Node[],
  edges: Edge[],
  direction: "TB" | "LR" = "TB"
): { nodes: Node[]; edges: Edge[] } {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const laidOutNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);

    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: laidOutNodes, edges };
}
