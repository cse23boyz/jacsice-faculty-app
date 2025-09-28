"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

export default function AddFacultyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [facultyData, setFacultyData] = useState({
    fullName: "",
    email: "",
    facultyCode: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFacultyData((prev) => ({ ...prev, [name]: value }))
  }

  const generateUsername = (name: string) => {
    return (
      name.toLowerCase().replace(/\s+/g, "") +
      Math.floor(Math.random() * 1000)
    )
  }

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8) // random 8-char password
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    const username = generateUsername(facultyData.fullName)
    const password = generatePassword()

    try {
      const res = await fetch("/api/admin/add-faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...facultyData, username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to add faculty")
      }

      toast({
        title: "Faculty Added!",
        description: `Username: ${username} | Password: ${password}`,
      })

      setFacultyData({ fullName: "", email: "", facultyCode: "" })
      router.push("/admin/faculty-list")
    } catch (error) {
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg border border-gray-200">
        <CardHeader className="text-center">
          <CardTitle className="text-xl font-bold text-gray-800">
            Add New Faculty
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Enter faculty details to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                name="fullName"
                value={facultyData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={facultyData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facultyCode">Faculty Code</Label>
              <Input
                id="facultyCode"
                name="facultyCode"
                value={facultyData.facultyCode}
                onChange={handleChange}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? "Adding..." : "Add Faculty"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
