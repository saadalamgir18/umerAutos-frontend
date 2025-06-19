"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Shield } from "lucide-react";

interface User {
  id: string;
  userName: string;
  role: string;
}
type Props = {
    params: Promise<{ id: string }>; // 👈 `params` is a Promise now
  };

export default function EditUserPage({ params }: Props) {
    const {id}  = use(params)
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState("USER");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`http://localhost:8083/api/auth/users/${id}`, {credentials: "include"});
        if (!res.ok) throw new Error("Failed to fetch user");
        const data = await res.json();
        setUser(data);
        setRole(data.role);
      } catch (err: any) {
        setError(err.message || "Failed to fetch user");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch(`http://localhost:8083/api/auth/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: role }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to update user");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/users"), 1200);
      }
    } catch (err) {
      setError("Failed to update user. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="py-8 text-center">Loading...</div>;
  if (error) return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
  if (!user) return <div className="py-8 text-center">User not found</div>;

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Edit User</CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {success && (
              <Alert variant="default">
                <AlertDescription>User updated successfully! Redirecting...</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={user.userName} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role" className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                Role
              </Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full border rounded-md p-2"
                required
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
} 