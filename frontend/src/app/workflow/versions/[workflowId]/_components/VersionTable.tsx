"use client";

import { PaginationControls } from "@/components/PaginationControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUnifiedAuth } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/use-pagination";
import { UnifiedVersionsAPI } from "@/lib/api/unified-functions-client";
import { SortDir } from "@/types/base";
import { WorkflowVersion, WorkflowVersionSortField, WorkflowVersionSortFieldLabels } from "@/types/versions";
import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { FileStackIcon, GitCompareIcon, SortAscIcon, SortDescIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useMemo, useState } from "react";
import { toast } from "sonner";



type VersionTableProps = {
  workflowId: string;
  initialData: WorkflowVersion[];
};

const VersionTable = ({ workflowId, initialData }: VersionTableProps) => {
  const { getToken, isAuthenticated } = useUnifiedAuth();
  const router = useRouter();

  const {
    page,
    limit,
    canGoNext,
    onNext,
    onPrev,
    onChangeLimit,
    updateCanGoNext,
  } = usePagination({
    initialPage: 1,
    initialLimit: 5,
    limits: [5, 10, 20, 50],
  });

  const [sortField, setSortField] = useState<WorkflowVersionSortField>(
    WorkflowVersionSortField.VERSION_NUMBER
  );
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const query = useQuery({
    queryKey: ["versions", workflowId, page, limit, sortField, sortDir],
    queryFn: async () => {
      const token = await getToken();
      const resp = await UnifiedVersionsAPI.client.list(workflowId, page, limit, sortField, sortDir, token);
      updateCanGoNext(resp.length >= limit);
      return resp;
    },
    initialData,
    refetchInterval: isAuthenticated ? 10000 : false, // Only refetch if authenticated
    enabled: isAuthenticated,
  });
  

  const [selectedVersions, setSelectedVersions] = useState<WorkflowVersion[]>([]);

  const latestVersion = useMemo(() => {
    if (!query.data) return null;
    return query.data.find((v) => v.is_active);
  }, [query.data])

  const toggleVersion = (version: WorkflowVersion) => {
    setSelectedVersions((prev) => {
      const already = prev.find((v) => v.version_number === version.version_number);
      if (already) {
        return prev.filter((v) => v.version_number !== version.version_number);
      } else {
        if (prev.length === 2) {
          return [prev[1], version];
        }
        return [...prev, version];
      }
    });
  };

  const handleCompareClick = () => {
    if (selectedVersions.length === 0) return;

    if (selectedVersions.length === 1 && latestVersion) {
      const ver1 = selectedVersions[0];
      if (ver1.version_number === latestVersion.version_number) {
        toast.warning("Select a different version to compare with latest");        
        return;
      }
      const ver2 = latestVersion;
      router.push(
        `/workflow/versions/${workflowId}/compare?version_1=${ver1.version_number}&version_2=${ver2.version_number}`
      );
      return;
    }

    if (selectedVersions.length === 2) {
      const [vA, vB] = selectedVersions;
      router.push(
        `/workflow/versions/${workflowId}/compare?version_1=${vA.version_number}&version_2=${vB.version_number}`
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Select
            value={sortField}
            onValueChange={(val) => setSortField(val as WorkflowVersionSortField)}
          >
            <SelectTrigger className="w-[170px]">
              <SelectValue placeholder="Sort by field" />
            </SelectTrigger>
            <SelectContent>
              {Object.values(WorkflowVersionSortField).map((fieldVal) => (
                <SelectItem key={fieldVal} value={fieldVal}>
                  {WorkflowVersionSortFieldLabels[fieldVal] ?? fieldVal}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
          >
            {sortDir === "asc" ? <SortAscIcon size={16} /> : <SortDescIcon size={16} />}
            <span>Sort {sortDir === "asc" ? "asc" : "desc"}</span>
          </Button>
        </div>
          <PaginationControls
            page={page}
            limit={limit}
            canGoNext={canGoNext}
            onNext={onNext}
            onPrev={onPrev}
            onChangeLimit={onChangeLimit}
          />
      </div>
      <div className="flex items-center gap-2 justify-between p-2 rounded">
          <p className="text-md text-foreground">
            { selectedVersions.length === 0 && "Select versions to compare" }
            { selectedVersions.length === 1 && `Selected v${selectedVersions[0].version_number} (will compare with latest)` }
            { selectedVersions.length === 2 && `Selected v${selectedVersions[0].version_number} and v${selectedVersions[1].version_number}` }
          </p>

        <Button
          variant="outline"
          size="sm"
          disabled={
            selectedVersions.length === 0 ||
            (selectedVersions.length === 1 && !latestVersion)
          }
          onClick={handleCompareClick}
        >
          <GitCompareIcon size={16} className="stroke-primary" />
          <span>Compare</span>        
        </Button>
      </div>
      <div className="border rounded-lg shadow-md overflow-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead
                className="cursor-pointer text-center"
                onClick={() => {
                  setSortField(WorkflowVersionSortField.VERSION_NUMBER);
                  setSortDir(sortDir === "asc" ? "desc" : "asc");
                }}
              >
                Version #
              </TableHead>
              <TableHead
                className="cursor-pointer text-center"
                onClick={() => {
                  setSortField(WorkflowVersionSortField.CREATED_BY);
                  setSortDir(sortDir === "asc" ? "desc" : "asc");
                }}
              >
                Created By
              </TableHead>
              <TableHead
                className="cursor-pointer text-center w-48"
                onClick={() => {
                  setSortField(WorkflowVersionSortField.CREATED_AT);
                  setSortDir(sortDir === "asc" ? "desc" : "asc");
                }}
              >
                Created At
              </TableHead>
              <TableHead className="text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="gap-2 h-full overflow-auto">
            {query.data?.map((version) => {
              const createdTime = formatDistanceToNow(new Date(version.created_at), {
                addSuffix: true,
              });

              const isSelected = !!selectedVersions.find(
                (v) => v.version_number === version.version_number
              );

              return (
                <TableRow
                  key={version.version_number}
                  className={`hover:bg-accent cursor-pointer`}
                  onClick={() => toggleVersion(version)}
                >
                  {/* Version # */}
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <div className="flex gap-2 items-center uppercase">
                        <FileStackIcon size={16} className="text-primary" />
                        {
                        latestVersion === version ? (
                          <div className="text-muted-foreground text-xs">
                            <Badge variant="outline" className="uppercase">Latest</Badge>
                          </div>) : 
                          <span className="font-semibold">v{version.version_number}</span>
                        }
                      </div>
    
                    </div>
                  </TableCell>

                  {/* Created By */}
                  <TableCell className="text-center">
                    <span className="text-sm">{version.created_by ?? "unknown"}</span>
                  </TableCell>

                  {/* Created At */}
                  <TableCell className="w-48 text-center">
                    <span className="text-sm">{createdTime}</span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="text-center">
                    <Button
                      className="w-[80px]"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVersion(version);
                      }}
                    >
                      {isSelected ? "Unselect" : "Select"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

export default VersionTable;
