import * as React from "react";

interface UsePaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  limits?: number[];
  hasNext?: boolean; 
}

export const usePagination = ({
  initialPage = 1,
  initialLimit = 10,
  limits = [5, 10, 20, 50],
  hasNext = true,
}: UsePaginationOptions = {}) => {
  const [page, setPage] = React.useState<number>(initialPage);
  const [limit, setLimit] = React.useState<number>(initialLimit);
  const [canGoNext, setCanGoNext] = React.useState<boolean>(hasNext);

  const updateCanGoNext = (val: boolean) => {
    setCanGoNext(val);
  };

  const onNext = () => {
    setPage((prev) => prev + 1);
  };

  const onPrev = () => {
    setPage((prev) => Math.max(prev - 1, 1));
  };

  const onChangeLimit = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
  };

  return {
    page,
    limit,
    canGoNext,
    onNext,
    onPrev,
    onChangeLimit,
    updateCanGoNext,
    limits,
  };
}
