"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { fetchShelfCodes, deleteShelfCode } from "@/lib/redux/slices/shelfCodeSlice";

export default function ShelfCodePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { items: shelfCodes, loading, error } = useSelector((state: RootState) => state.shelfCode);

  useEffect(() => {
    dispatch(fetchShelfCodes());
  }, [dispatch]);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this shelf code?")) {
      await dispatch(deleteShelfCode(id));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Shelf Codes</h1>
        <Button onClick={() => router.push("/shelf-code/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Shelf Code
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shelfCodes.map((shelfCode) => (
              <TableRow key={shelfCode.id}>
                <TableCell>{shelfCode.name}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/shelf-code/edit/${shelfCode.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(shelfCode.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
} 