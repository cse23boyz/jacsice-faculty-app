"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AddFacultyPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    facultyCode: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/add-faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.emailResult?.sent) {
          toast({ title: "Faculty added & email sent 🎉" });
        } else {
          toast({
            title: "Faculty added, but email failed ⚠️",
            description: data.emailResult?.error || "Unknown email error",
            variant: "destructive",
          });
        }

        // Reset form
        setFormData({ fullName: "", email: "", username: "", facultyCode: "" });
      } else {
        toast({ title: "Error", description: data.error || "Something went wrong", variant: "destructive" });
      }
    } catch (err: any) {
      console.error(err);
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fadeIn">
        <Card className="shadow-2xl border border-gray-200 hover:scale-[1.02] transition-transform duration-300">
          <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">Add Faculty 👨‍🏫</CardTitle>
            <CardDescription>Enter faculty details. Password will be sent via email automatically.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label>Full Name</Label>
                <Input
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="e.g., John Doe"
                  required
                  className="border-blue-300"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="e.g., john@example.com"
                  required
                  className="border-blue-300"
                />
              </div>
              <div>
                <Label>Username</Label>
                <Input
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Unique username"
                  required
                  className="border-blue-300"
                />
              </div>
              <div>
                <Label>Faculty Code</Label>
                <Input
                  name="facultyCode"
                  value={formData.facultyCode}
                  onChange={handleChange}
                  placeholder="Unique code"
                  required
                  className="border-blue-300"
                />
              </div>
              <div className="flex justify-between items-center mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push("/admin/dashboard")}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  ← Back to Dashboard
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {isLoading ? "Adding..." : "Add Faculty"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
