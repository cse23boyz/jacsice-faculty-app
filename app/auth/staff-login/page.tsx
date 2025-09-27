"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, Mail, AlertCircle, UserPlus, LogIn } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function StaffLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("login")
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  })
  const [registerData, setRegisterData] = useState({
    fullName: "",
    email: "",
    username: "",
    password: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setLoginData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError("")
  }

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setRegisterData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setError("")
  }

  const checkUserExists = (username: string) => {
    const allKeys = Object.keys(localStorage)
    const userProfileKeys = allKeys.filter((key) => key.startsWith("userProfile_"))

    for (const key of userProfileKeys) {
      try {
        const profile = JSON.parse(localStorage.getItem(key) || "{}")
        if (profile.username === username || profile.email === username) {
          return { exists: true, userId: key.replace("userProfile_", ""), profile }
        }
      } catch (error) {
        console.error("Error parsing profile:", error)
      }
    }

    return { exists: false, userId: null, profile: null }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (!loginData.username.trim() || !loginData.password.trim()) {
        setError("Please fill in all fields")
        setIsLoading(false)
        return
      }

      // Check if user exists
      const userCheck = checkUserExists(loginData.username)

      if (!userCheck.exists) {
        setError("User not found. Please register first or check your username.")
        setIsLoading(false)
        return
      }

      // Set current user
      if (userCheck && userCheck.userId) {
  localStorage.setItem("currentUserId", String(userCheck.userId));
} else {
  console.error("userCheck or userId is missing", userCheck);
}

      // Check if profile is complete
      if (
        userCheck.profile &&
        userCheck.profile.isSaved &&
        userCheck.profile.fullName &&
        userCheck.profile.department
      ) {
        // Complete profile - go directly to dashboard
        toast({
          title: "Welcome Back! 🎉",
          description: `Hello, ${userCheck.profile.fullName}!`,
        })

        setTimeout(() => {
          router.push("/staff/dashboard")
        }, 1000)
      } else {
        // Incomplete profile - go to department selection
        toast({
          title: "Complete Your Setup! 📝",
          description: "Please complete your profile to continue.",
        })

        setTimeout(() => {
          router.push("/department-selection")
        }, 1000)
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("An error occurred during login. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      if (
        !registerData.fullName.trim() ||
        !registerData.email.trim() ||
        !registerData.username.trim() ||
        !registerData.password.trim()
      ) {
        setError("Please fill in all fields")
        setIsLoading(false)
        return
      }

      // Check if user already exists
      const userCheck = checkUserExists(registerData.username)
      if (userCheck.exists) {
        setError("Username already exists. Please choose a different username or login instead.")
        setIsLoading(false)
        return
      }

      // Check email exists
      const emailCheck = checkUserExists(registerData.email)
      if (emailCheck.exists) {
        setError("Email already registered. Please use a different email or login instead.")
        setIsLoading(false)
        return
      }

      // Create new user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      // Store basic user data (not complete profile yet)
      const newUser = {
        userId: userId,
        fullName: registerData.fullName,
        email: registerData.email,
        username: registerData.username,
        password: registerData.password, // In real app, this should be hashed
        isSaved: false,
        isNewUser: true,
        createdAt: new Date().toISOString(),
      }

      localStorage.setItem(`userProfile_${userId}`, JSON.stringify(newUser))
      localStorage.setItem("currentUserId", userId)

      toast({
        title: "Registration Successful! 🎉",
        description: "Please select your department to continue.",
      })

      setTimeout(() => {
        router.push("/department-selection")
      }, 1000)
    } catch (error) {
      console.error("Registration error:", error)
      setError("An error occurred during registration. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    router.push("/auth/first-login")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl">
          <CardHeader className="text-center relative">
            <Button variant="ghost" size="sm" onClick={handleBack} className="absolute left-4 top-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <CardTitle className="text-2xl font-bold text-gray-800">New Faculty 👨‍🏫</CardTitle>
            <CardDescription>New faculty Get Access Form</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
             
              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="login" className="space-y-4 mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">FullName 👤</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="login-username"
                        name="username"
                        type="text"
                        placeholder="Enter your username or email"
                        value={loginData.username}
                        onChange={handleLoginChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-Email-id">Email-Id</Label>
                    <Input
                      id="login-Email-id"
                      name="email-id"
                      type="text"
                      placeholder="Enter your Email-id"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>
                   <div className="space-y-2 shadow-2xl border-blue-200">
                    <Label htmlFor="login-FcaultyCode">FcaultyCode</Label>
                    <Input
                      id="login-FcaultyCode"
                      name="FcaultyCode"
                      type="text"
                      placeholder="Enter your FcaultyCode"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing In...
                      </div>
                    ) : (
                      "Get Access "
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-4">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name 👤 *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-name"
                        name="fullName"
                        type="text"
                        placeholder="Enter your full name"
                        value={registerData.fullName}
                        onChange={handleRegisterChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email Address 📧 *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={registerData.email}
                        onChange={handleRegisterChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-username">Username 🆔 *</Label>
                    <Input
                      id="register-username"
                      name="username"
                      type="text"
                      placeholder="Choose a username"
                      value={registerData.username}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password 🔐 *</Label>
                    <Input
                      id="register-password"
                      name="password"
                      type="password"
                      placeholder="Create a password"
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      required
                    />
                  </div>

                  <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Registering...
                      </div>
                    ) : (
                      "Register 🚀"
                    )}
                  </Button>
                </form>

                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 text-center">
                    📝 After registration, you'll complete your profile with department and professional details.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
