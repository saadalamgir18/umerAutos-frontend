"use client";

import { useState } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppDispatch } from "@/lib/redux/store";
import { addShelfCode } from "@/lib/redux/slices/shelfCodeSlice";

export default function AddShelfCodePage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(addShelfCode(code ));
      router.push("/shelf-code");
    } catch (error) {
      console.error("Failed to add shelf code:", error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Add Shelf Code</h1>
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Code</Label>
            <Input
              id="name"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-4">
            <Button type="submit">Add Shelf Code</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/shelf-code")}
            >
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
} 