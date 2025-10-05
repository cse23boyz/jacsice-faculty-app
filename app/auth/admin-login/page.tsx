"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Eye, EyeOff, Lock, User, Crown } from "lucide-react"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const setCookie = (name: string, value: string, days: number) => {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
    document.cookie = `${name}=${value}; expires=${expires}; path=/`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Admin credentials (in production, this should be from environment variables)
      const adminCredentials = {
        username: "admin",
        password: "admin123"
      }

      if (username === adminCredentials.username && password === adminCredentials.password) {
        // Set admin session in both localStorage and cookies
        const token = "admin-authenticated"
        
        // Set localStorage (for client-side)
        localStorage.setItem("adminToken", token)
        localStorage.setItem("role", "admin")
        localStorage.setItem("adminUsername", username)
        
        // Set cookies (for middleware/server-side)
        setCookie("adminToken", token, 1) // 1 day expiry
        setCookie("role", "admin", 1)
        setCookie("adminUsername", username, 1)

        toast({
          title: "Welcome Back! 👑",
          description: "Admin login successful",
        })

        // Redirect to admin dashboard
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 1000)
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid admin credentials",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Error",
        description: "Login failed. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-900 via-orange-800 to-amber-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-orange-500 p-3 rounded-full">
              <Crown className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">JACSICE Admin Portal</h1>
          <p className="text-orange-200">Secure Administrative Access</p>
        </div>

        {/* Login Card */}
        <Card className="bg-orange-950 border-orange-800 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Lock className="h-6 w-6" />
              Admin Login
            </CardTitle>
            <CardDescription className="text-orange-300">
              Enter your administrative credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-orange-200">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter admin username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 bg-orange-900 border-orange-700 text-white placeholder-orange-400 focus:border-orange-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-orange-200">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-orange-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-orange-900 border-orange-700 text-white placeholder-orange-400 focus:border-orange-500"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-orange-800"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-orange-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-orange-400" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Lock className="h-4 w-4 mr-2" />
                    Access Admin Panel
                  </div>
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-orange-900/50 rounded-lg border border-orange-800">
              <h3 className="text-sm font-semibold text-orange-300 mb-2">Demo Credentials:</h3>
              <div className="text-xs text-orange-200 space-y-1">
                <p>Username: <span className="font-mono">admin</span></p>
                <p>Password: <span className="font-mono">admin123</span></p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-orange-300 text-sm">
            For authorized personnel only. All activities are monitored.
          </p>
        </div>
      </div>
    </div>
  )
}