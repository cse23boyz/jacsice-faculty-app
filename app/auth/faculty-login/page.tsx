"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User, Lock, AlertCircle, Crown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function FacultyLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [formData, setFormData] = useState({ username: "", password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/faculty-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      let data: any = {}
      try {
        data = await res.json()
      } catch {
        throw new Error("Server did not return valid JSON")
      }

      if (!res.ok) {
        setError(data.error || "Invalid credentials")
        toast({
          title: "Login Failed ❌",
          description: data.error || "Please check your credentials",
          variant: "destructive",
        })
        return
      }

      // Save JWT token & faculty profile
      localStorage.setItem("facultyToken", data.token)
      localStorage.setItem("facultyProfile", JSON.stringify(data.faculty))
      toast({
        title: "Login Successful 🎉",
        description: "Redirecting to dashboard...",
      })

      setTimeout(() => {
        router.push("/staff/dashboard")
      }, 1000)
    } catch (err: any) {
      console.error("Login error:", err)
      setError(err.message || "An unexpected error occurred")
      toast({
        title: "Login Error ❌",
        description: err.message || "Please try again later",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => router.push("/")
  const handleAdminLogin = () => router.push("/auth/admin-login")

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-blue-200">
          <CardHeader className="text-center relative">
            <Button variant="ghost" size="sm" onClick={handleBack} className="absolute left-4 top-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-800">Faculty Portal Access 🔐</CardTitle>
            <CardDescription>Enter your credentials to access the faculty system</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 border-opacity-20">
                <Label htmlFor="username">Username 👤</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 border-opacity-25" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password 🔑</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Authenticating...
                  </div>
                ) : (
                  "Access Portal ✨"
                )}
              </Button>
            </form>

            {/* Admin Access Button */}
            <div className="pt-4 border-t border-gray-200">
              <Button
                onClick={handleAdminLogin}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 bg-transparent"
              >
                <Crown className="h-4 w-4 mr-2" />
                Admin Login 👑
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
