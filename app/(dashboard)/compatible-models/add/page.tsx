"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppDispatch } from "@/lib/redux/store";
import { addCompatibleModel } from "@/lib/redux/slices/compatibleModelSlice";

export default function AddCompatibleModelPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [name, setName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(addCompatibleModel({ name }));
      router.push("/compatible-models");
    } catch (error) {
      console.error("Failed to add compatible model:", error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Add Compatible Model</h1>
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
            <Button type="submit">Add Compatible Model</Button>
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