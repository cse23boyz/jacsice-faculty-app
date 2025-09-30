"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import bcrypt from "bcryptjs"; // lighter for frontend

export default function AddFacultyPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
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
      // Hash password before sending
      const hashedPassword = await bcrypt.hash(formData.password, 10);

      const res = await fetch("/api/admin/add-faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, password: hashedPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: "Faculty added successfully 🎉" });
        setFormData({ name: "", email: "", username: "", password: "", facultyCode: "" });
      } else {
        toast({ title: "Error", description: data.error, variant: "destructive" });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="shadow-2xl border-blue-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Add Faculty 👨‍🏫</CardTitle>
            <CardDescription>Fill in faculty details to create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <Label>Name</Label>
                <Input name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div>
                <Label>Username</Label>
                <Input name="username" value={formData.username} onChange={handleChange} required />
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" name="password" value={formData.password} onChange={handleChange} required />
              </div>
              <div>
                <Label>Faculty Code</Label>
                <Input name="facultyCode" value={formData.facultyCode} onChange={handleChange} required />
              </div>
              <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                {isLoading ? "Adding..." : "Add Faculty"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
