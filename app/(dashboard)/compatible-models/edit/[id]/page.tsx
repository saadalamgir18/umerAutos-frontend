"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { fetchCompatibleModels, updateCompatibleModel } from "@/lib/redux/slices/compatibleModelSlice";

export default function EditCompatibleModelPage({ params }: { params: { id: string } }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { items: models } = useSelector((state: RootState) => state.compatibleModel);
  const [name, setName] = useState("");

  useEffect(() => {
    dispatch(fetchCompatibleModels());
  }, [dispatch]);

  useEffect(() => {
    const model = models.find((m) => m.id === parseInt(params.id));
    if (model) {
      setName(model.name);
    }
  }, [models, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(updateCompatibleModel({ id: parseInt(params.id), name }));
      router.push("/compatible-models");
    } catch (error) {
      console.error("Failed to update compatible model:", error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Compatible Model</h1>
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-4">
            <Button type="submit">Update Compatible Model</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/compatible-models")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 