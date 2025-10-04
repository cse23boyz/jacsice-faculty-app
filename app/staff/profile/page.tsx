"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, User, Mail, Phone, Calendar, BookOpen, Save, MapPin, CheckCircle, Camera, Upload } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  _id?: string
  id?: string
  userId: string
  fullName: string
  email: string
  username: string
  phone: string
  department: string
  designation: string
  dateOfJoining: string
  specialization: string
  experience: string
  qualification: string
  address: string
  bio: string
  profilePhoto: string
  isSaved: boolean
  isNewUser: boolean
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isNewUser, setIsNewUser] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const [profile, setProfile] = useState<UserProfile>({
    userId: "",
    fullName: "",
    email: "",
    username: "",
    phone: "",
    department: "",
    designation: "",
    dateOfJoining: "",
    specialization: "",
    experience: "",
    qualification: "",
    address: "",
    bio: "",
    profilePhoto: "",
    isSaved: false,
    isNewUser: false,
  })

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("facultyToken")
        const userId = localStorage.getItem("currentUserId")
        
        if (!token || !userId) {
          router.push("/auth/faculty-login")
          return
        }

        setCurrentUserId(userId)

        // Fetch profile from MongoDB
        const response = await fetch("/api/faculty/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (response.ok) {
          const profileData = await response.json()
          setProfile({
            userId: userId,
            fullName: profileData.fullName || "",
            email: profileData.email || "",
            username: profileData.username || "",
            phone: profileData.phone || "",
            department: profileData.department || "",
            designation: profileData.designation || "",
            dateOfJoining: profileData.dateOfJoining || "",
            specialization: profileData.specialization || "",
            experience: profileData.experience || "",
            qualification: profileData.qualification || "",
            address: profileData.address || "",
            bio: profileData.bio || "",
            profilePhoto: profileData.profilePhoto || "",
            isSaved: true,
            isNewUser: false,
          })
          setIsNewUser(false)
        } else if (response.status === 404) {
          // Profile not found in MongoDB, check localStorage as fallback
          const savedProfile = localStorage.getItem(`userProfile_${userId}`)
          if (savedProfile) {
            const parsedProfile = JSON.parse(savedProfile)
            setProfile({
              userId: userId,
              fullName: parsedProfile.fullName || "",
              email: parsedProfile.email || "",
              username: parsedProfile.username || "",
              phone: parsedProfile.phone || "",
              department: parsedProfile.department || "",
              designation: parsedProfile.designation || "",
              dateOfJoining: parsedProfile.dateOfJoining || "",
              specialization: parsedProfile.specialization || "",
              experience: parsedProfile.experience || "",
              qualification: parsedProfile.qualification || "",
              address: parsedProfile.address || "",
              bio: parsedProfile.bio || "",
              profilePhoto: parsedProfile.profilePhoto || "",
              isSaved: parsedProfile.isSaved || false,
              isNewUser: !parsedProfile.isSaved,
            })
            setIsNewUser(!parsedProfile.isSaved)
          } else {
            // New user - get basic info from faculty profile
            const facultyProfile = localStorage.getItem("facultyProfile")
            if (facultyProfile) {
              const facultyData = JSON.parse(facultyProfile)
              setProfile(prev => ({
                ...prev,
                userId: userId,
                fullName: facultyData.fullName || "",
                email: facultyData.email || "",
                username: facultyData.username || "",
                isNewUser: true,
              }))
            } else {
              setProfile(prev => ({ ...prev, userId: userId, isNewUser: true }))
            }
            setIsNewUser(true)
          }
        } else {
          throw new Error("Failed to fetch profile")
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
      }
    }

    fetchProfileData()
  }, [router, toast])

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file (JPEG, PNG, etc.)",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string
      setProfile(prev => ({
        ...prev,
        profilePhoto: imageDataUrl
      }))
      setIsUploading(false)
      
      toast({
        title: "Photo Uploaded! 📸",
        description: "Profile photo updated successfully",
      })
    }

    reader.onerror = () => {
      setIsUploading(false)
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      })
    }

    reader.readAsDataURL(file)
  }

  const handleRemovePhoto = () => {
    setProfile(prev => ({
      ...prev,
      profilePhoto: ""
    }))
    toast({
      title: "Photo Removed",
      description: "Profile photo has been removed",
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem("facultyToken")
      if (!token || !currentUserId) {
        toast({
          title: "Error",
          description: "User session not found. Please login again.",
          variant: "destructive",
        })
        router.push("/auth/faculty-login")
        return
      }

      // Validate required fields
      if (!profile.fullName || !profile.email || !profile.department || !profile.designation) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields (Name, Email, Department, Designation).",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Prepare data for MongoDB
      const profileData = {
        fullName: profile.fullName,
        email: profile.email,
        username: profile.username,
        phone: profile.phone,
        department: profile.department,
        designation: profile.designation,
        dateOfJoining: profile.dateOfJoining,
        specialization: profile.specialization,
        experience: profile.experience,
        qualification: profile.qualification,
        address: profile.address,
        bio: profile.bio,
        profilePhoto: profile.profilePhoto,
        updatedAt: new Date().toISOString(),
      }

      // Save to MongoDB
      const response = await fetch("/api/faculty/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        // Also save to localStorage as backup
        const updatedProfile = {
          ...profile,
          isSaved: true,
          isNewUser: false,
          updatedAt: new Date().toISOString(),
        }
        localStorage.setItem(`userProfile_${currentUserId}`, JSON.stringify(updatedProfile))

        toast({
          title: "Profile Saved Successfully! 🎉",
          description: isNewUser 
            ? "Your profile has been completed. Welcome!" 
            : "Your profile has been updated successfully.",
        })

        // Redirect to dashboard after successful save
        setTimeout(() => {
          router.push("/staff/dashboard")
        }, 1500)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleBack = () => {
    if (isNewUser) {
      router.push("/department-selection")
    } else {
      router.push("/staff/dashboard")
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const completionPercentage = () => {
    const requiredFields = [profile.fullName, profile.email, profile.department, profile.designation];
    const optionalFields = [profile.phone, profile.specialization, profile.experience, profile.qualification, profile.bio, profile.profilePhoto];
    
    const completedRequired = requiredFields.filter(field => field).length;
    const completedOptional = optionalFields.filter(field => field).length;
    
    return Math.round((completedRequired / requiredFields.length) * 70 + (completedOptional / optionalFields.length) * 30);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-xl">
          <CardHeader className="text-center relative">
            <Button variant="ghost" size="sm" onClick={handleBack} className="absolute left-4 top-4">
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Photo Upload Section */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={profile.profilePhoto} 
                    alt={profile.fullName || "Profile Photo"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-800 text-2xl">
                    {profile.fullName ? getInitials(profile.fullName) : "👨‍🏫"}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload Button */}
                <div className="absolute -bottom-2 -right-2">
                  <input
                    type="file"
                    id="profilePhoto"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="profilePhoto"
                    className="flex items-center justify-center w-10 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-full cursor-pointer shadow-lg transition-all duration-200 hover:scale-110"
                  >
                    {isUploading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </Label>
                </div>

                {/* Remove Photo Button */}
                {profile.profilePhoto && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -bottom-2 -left-2 w-10 h-10 rounded-full shadow-lg"
                    onClick={handleRemovePhoto}
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>

            {/* Upload Hint */}
            <div className="text-center mb-2">
              <p className="text-sm text-gray-600">
                Click the camera icon to upload a profile photo
              </p>
              <p className="text-xs text-gray-500">
                Supports JPG, PNG • Max 5MB
              </p>
            </div>

            <CardTitle className="text-3xl font-bold text-gray-800">
              {profile.isSaved ? "Update Your Profile 📝" : "Complete Your Profile 📝"}
            </CardTitle>
            <CardDescription>
              {profile.isSaved
                ? "Update your professional information"
                : "Please fill in your details to complete your faculty profile"}
            </CardDescription>

            {/* Progress Bar */}
            {!profile.isSaved && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Profile Completion</span>
                  <span>{completionPercentage()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${completionPercentage()}%` }}
                  ></div>
                </div>
              </div>
            )}
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="fullName">
                    Full Name *
                    {profile.fullName && <CheckCircle className="h-4 w-4 text-green-500 inline ml-1" />}
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={profile.fullName || ""}
                      onChange={(e) => handleInputChange("fullName", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address *
                    {profile.email && <CheckCircle className="h-4 w-4 text-green-500 inline ml-1" />}
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={profile.email || ""}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      placeholder="Enter your phone number"
                      value={profile.phone || ""}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="department">
                    Department *
                    {profile.department && <CheckCircle className="h-4 w-4 text-green-500 inline ml-1" />}
                  </Label>
                  <Select
                    value={profile.department || ""}
                    onValueChange={(value) => handleInputChange("department", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CSE">Computer Science & Engineering</SelectItem>
                      <SelectItem value="IT">Information Technology</SelectItem>
                      <SelectItem value="ECE">Electronics & Communication</SelectItem>
                      <SelectItem value="MECH">Mechanical Engineering</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="designation">
                    Designation *
                    {profile.designation && <CheckCircle className="h-4 w-4 text-green-500 inline ml-1" />}
                  </Label>
                  <Select
                    value={profile.designation || ""}
                    onValueChange={(value) => handleInputChange("designation", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your designation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professor">Professor</SelectItem>
                      <SelectItem value="Associate Professor">Associate Professor</SelectItem>
                      <SelectItem value="Assistant Professor">Assistant Professor</SelectItem>
                      <SelectItem value="Lecturer">Lecturer</SelectItem>
                      <SelectItem value="Senior Lecturer">Senior Lecturer</SelectItem>
                      <SelectItem value="Guest Faculty">Guest Faculty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfJoining">Date of Joining</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="dateOfJoining"
                      type="date"
                      value={profile.dateOfJoining || ""}
                      onChange={(e) => handleInputChange("dateOfJoining", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="specialization">Area of Specialization</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="specialization"
                      placeholder="e.g., Machine Learning, Data Structures, etc."
                      value={profile.specialization || ""}
                      onChange={(e) => handleInputChange("specialization", e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Input
                    id="experience"
                    placeholder="e.g., 5 years"
                    value={profile.experience || ""}
                    onChange={(e) => handleInputChange("experience", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="qualification">Highest Qualification</Label>
                  <Input
                    id="qualification"
                    placeholder="e.g., Ph.D, M.Tech, M.E, etc."
                    value={profile.qualification || ""}
                    onChange={(e) => handleInputChange("qualification", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Textarea
                      id="address"
                      placeholder="Enter your address"
                      value={profile.address || ""}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="pl-10"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio / About</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself, your research interests, achievements..."
                    value={profile.bio || ""}
                    onChange={(e) => handleInputChange("bio", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-lg py-3"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Saving Profile...
                  </div>
                ) : (
                  <>
                    <Save className="mr-2 h-5 w-5" />
                    {profile.isSaved ? "Update Profile 💾" : "Complete Profile 🎉"}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}