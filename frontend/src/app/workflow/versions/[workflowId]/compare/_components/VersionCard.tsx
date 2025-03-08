import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { GitBranch, RotateCcw, User } from "lucide-react";
import { ReactFlowProvider, Edge, Node } from "@xyflow/react";
import { WorkflowVersion } from "@/types/versions";
import ReadOnlyFlowViewer from "../../../../../../components/ReadOnlyFlowViewer";
import { format } from "date-fns/format";

type VersionCardProps = {
  version: WorkflowVersion;
  nodes: Node[];
  edges: Edge[];
  onRollback?: (versionId: string) => void;
  viewport?: { x: number; y: number; zoom: number };
};


const VersionCard = ({
    version,
    nodes,
    edges,
    viewport,
    onRollback,
  }: VersionCardProps) => {
    return (
      <Card className="flex flex-col flex-1 h-full rounded-none">
        <CardHeader className="px-4 py-2 border-b flex items-center justify-center min-h-14">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <GitBranch size={16} className="text-muted-foreground" />
              <CardTitle className="text-sm">
                Version {version.version_number}
              </CardTitle>
              <Separator orientation="vertical" className="h-5" />
              <Badge variant="outline">
                {format(new Date(version.created_at), "yyyy-MM-dd HH:mm")}
              </Badge>
              <Separator orientation="vertical" className="h-5" />
              {version.created_by && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <User size={14} />
                  <p>Created by {version.created_by}</p>
                </div>
              )}
              <Separator orientation="vertical" className="h-5" />
              {onRollback && !version.is_active && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onRollback(version.id)}
                >
                  <RotateCcw size={12} />
                  Revert
                </Button>
              )} 
              {
                version.is_active && (
                  <Badge variant="outline" className="text-xs">
                    Active Version
                  </Badge>
                )
              }
            </div>
          </div>
        </CardHeader>
        <CardContent className="h-[700px] p-0 overflow-hidden">
          <ReactFlowProvider>
            <ReadOnlyFlowViewer
              nodes={nodes}
              edges={edges}
              initialViewport={viewport}
            />
          </ReactFlowProvider>
        </CardContent>
      </Card>
    );
}

export default VersionCard