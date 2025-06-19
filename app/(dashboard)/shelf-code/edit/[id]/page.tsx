"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppDispatch, RootState } from "@/lib/redux/store";
import { fetchShelfCodes, updateShelfCode } from "@/lib/redux/slices/shelfCodeSlice";

export default function EditShelfCodePage({ params }: { params: { id: string } }) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { items: shelfCodes } = useSelector((state: RootState) => state.shelfCode);
  const [code, setCode] = useState("");

  useEffect(() => {
    dispatch(fetchShelfCodes());
  }, [dispatch]);

  useEffect(() => {
    const shelfCode = shelfCodes.find((sc) => sc.id === parseInt(params.id));
    if (shelfCode) {
      setCode(shelfCode.name);
    }
  }, [shelfCodes, params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(updateShelfCode({ id: parseInt(params.id), code }));
      router.push("/shelf-code");
    } catch (error) {
      console.error("Failed to update shelf code:", error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Edit Shelf Code</h1>
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="space-y-4">
          <div>
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <div className="flex gap-4">
            <Button type="submit">Update Shelf Code</Button>
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