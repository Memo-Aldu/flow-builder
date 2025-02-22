// components/PaginationControls.tsx
"use client";
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  limit: number;
  canGoNext: boolean;
  onNext: () => void;
  onPrev: () => void;
  onChangeLimit: (newLimit: number) => void;
  limits?: number[];
}

export const PaginationControls = ({
  page,
  limit,
  canGoNext,
  onNext,
  onPrev,
  onChangeLimit,
  limits = [5, 10, 20, 50],
}: Readonly<PaginationControlsProps>) => {
  return (
    <div className="flex items-center gap-2">
      <Select
        value={String(limit)}
        onValueChange={(val) => onChangeLimit(Number(val))}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Rows per page" />
        </SelectTrigger>
        <SelectContent>
          {limits.map((sz) => (
            <SelectItem key={sz} value={String(sz)}>
              {sz} rows
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button variant="outline" onClick={onPrev} disabled={page <= 1}>
        Prev
      </Button>
      <span className="mx-2">Page {page}</span>
      <Button variant="outline" onClick={onNext} disabled={!canGoNext}>
        Next
      </Button>
    </div>
  );
}
