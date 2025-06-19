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
import { fetchCompatibleModels, deleteCompatibleModel } from "@/lib/redux/slices/compatibleModelSlice";

export default function CompatibleModelsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { items: models, loading, error } = useSelector((state: RootState) => state.compatibleModel);

  useEffect(() => {
    dispatch(fetchCompatibleModels());
  }, [dispatch]);

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this compatible model?")) {
      await dispatch(deleteCompatibleModel(id));
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Compatible Models</h1>
        <Button onClick={() => router.push("/compatible-models/add")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Compatible Model
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow key={model.id}>
                <TableCell>{model.name}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push(`/compatible-models/edit/${model.id}`)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(model.id)}
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