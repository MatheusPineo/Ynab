import { Skeleton } from "@/shared/components/ui/skeleton";
import { TableCell, TableRow } from "@/shared/components/ui/table";

export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          <TableCell><Skeleton className="h-4 w-20" /></TableCell>
          <TableCell><Skeleton className="h-4 w-48" /></TableCell>
          <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
          <TableCell><Skeleton className="h-4 w-32" /></TableCell>
          <TableCell className="text-right"><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
          <TableCell><Skeleton className="h-8 w-8 rounded-full ml-auto" /></TableCell>
        </TableRow>
      ))}
    </>
  );
};
