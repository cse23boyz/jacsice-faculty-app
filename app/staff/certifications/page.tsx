"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ArrowLeft, User, LogOut, Award, Plus, Save, Star, Calendar, Building, FileText, Upload, Trash2, Edit } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Certification {
  _id: string
  id: string
  title: string
  type: "conference" | "fdp" | "journal" | "research" | "seminar" | "project"
  organization: string
  date: string
  duration: string
  description: string
  isPinned: boolean
  createdAt: string
}

interface UserProfile {
  _id: string
  id: string
  fullName: string
  email: string
  department: string
  designation: string
  profilePhoto?: string
}

export default function CertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCert, setEditingCert] = useState<Certification | null>(null)
  const [certToDelete, setCertToDelete] = useState<Certification | null>(null)
  const { department, setUserRole, setDepartment } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    type: "" as "conference" | "fdp" | "journal" | "research" | "seminar" | "project" | "",
    organization: "",
    date: "",
    duration: "",
    description: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("facultyToken")
        const currentUserId = localStorage.getItem("currentUserId")
        
        if (!token || !currentUserId) {
          router.push("/auth/faculty-login")
          return
        }

        // Check for auto-fill parameters from certificate upload
        const autoFill = searchParams.get('autoFill')
        if (autoFill === 'true') {
          setFormData({
            title: decodeURIComponent(searchParams.get('title') || ""),
            type: (searchParams.get('type') as any) || "",
            organization: decodeURIComponent(searchParams.get('organization') || ""),
            date: searchParams.get('date') || "",
            duration: searchParams.get('duration') || "",
            description: decodeURIComponent(searchParams.get('description') || ""),
          })
          setShowForm(true)
        }

        // Load user profile from MongoDB
        const profileResponse = await fetch("/api/faculty/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setUserProfile(profileData)
        }

        // Load certifications from MongoDB
        await loadCertifications(token)

      } catch (error) {
        console.error("Error fetching data:", error)
        // Fallback to localStorage
        const currentUserId = localStorage.getItem("currentUserId")
        const savedProfile = localStorage.getItem(`userProfile_${currentUserId}`)
        if (savedProfile) {
          setUserProfile(JSON.parse(savedProfile))
        }
        const savedCertifications = localStorage.getItem(`certifications_${currentUserId}`)
        if (savedCertifications) {
          setCertifications(JSON.parse(savedCertifications))
        }
      }
    }

    fetchData()
  }, [router, searchParams])

  const loadCertifications = async (token: string) => {
    try {
      const certsResponse = await fetch("/api/faculty/certifications", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (certsResponse.ok) {
        const certsData = await certsResponse.json()
        setCertifications(certsData)
        
        // Also save to localStorage as backup
        const currentUserId = localStorage.getItem("currentUserId")
        localStorage.setItem(`certifications_${currentUserId}`, JSON.stringify(certsData))
      } else {
        throw new Error("Failed to fetch certifications")
      }
    } catch (error) {
      console.error("Error loading certifications:", error)
      throw error
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const token = localStorage.getItem("facultyToken")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required. Please login again.",
          variant: "destructive",
        })
        router.push("/auth/faculty-login")
        return
      }

      if (!formData.title || !formData.type || !formData.organization || !formData.date) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      if (editingCert) {
        // Update existing certification
        const response = await fetch(`/api/faculty/certifications/${editingCert.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await loadCertifications(token)
          toast({
            title: "Certification Updated! ✅",
            description: "Your certification has been updated successfully.",
          })
          setEditingCert(null)
        } else {
          throw new Error("Failed to update certification")
        }
      } else {
        // Create new certification
        const response = await fetch("/api/faculty/certifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          await loadCertifications(token)
          toast({
            title: "Certification Added! 🎉",
            description: "Your certification has been saved successfully.",
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to save certification")
        }
      }

      // Reset form
      setFormData({
        title: "",
        type: "",
        organization: "",
        date: "",
        duration: "",
        description: "",
      })
      setShowForm(false)

    } catch (error) {
      console.error("Error saving certification:", error)
      toast({
        title: "Error",
        description: "Failed to save certification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePin = async (certId: string) => {
    try {
      const token = localStorage.getItem("facultyToken")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required.",
          variant: "destructive",
        })
        return
      }

      const certification = certifications.find(c => c.id === certId)
      if (!certification) return

      // Update in MongoDB
      const response = await fetch(`/api/faculty/certifications/${certId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          isPinned: !certification.isPinned
        }),
      })

      if (response.ok) {
        await loadCertifications(token)
        toast({
          title: certification.isPinned ? "Unpinned! 📌" : "Pinned! 📌",
          description: "Certification status updated.",
        })
      } else {
        throw new Error("Failed to update certification")
      }
    } catch (error) {
      console.error("Error toggling pin:", error)
      toast({
        title: "Error",
        description: "Failed to update certification.",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (certification: Certification) => {
    setFormData({
      title: certification.title,
      type: certification.type,
      organization: certification.organization,
      date: certification.date,
      duration: certification.duration || "",
      description: certification.description || "",
    })
    setEditingCert(certification)
    setShowForm(true)
  }

  const handleDelete = async () => {
    if (!certToDelete) return

    try {
      const token = localStorage.getItem("facultyToken")
      if (!token) {
        toast({
          title: "Error",
          description: "Authentication required.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/faculty/certifications/${certToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        await loadCertifications(token)
        toast({
          title: "Certification Deleted! 🗑️",
          description: "Your certification has been permanently deleted.",
        })
      } else {
        throw new Error("Failed to delete certification")
      }
    } catch (error) {
      console.error("Error deleting certification:", error)
      toast({
        title: "Error",
        description: "Failed to delete certification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCertToDelete(null)
    }
  }

  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: "Invalid File",
        description: "Please upload an image or PDF file",
        variant: "destructive",
      })
      return
    }

    try {
      const token = localStorage.getItem("facultyToken")
      const formData = new FormData()
      formData.append("certificate", file)

      toast({
        title: "Analyzing Certificate...",
        description: "Please wait while we extract information from your certificate",
      })

      const response = await fetch("/api/certificates/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (response.ok) {
        const analyzedData = await response.json()
        
        // Auto-fill form with analyzed data
        setFormData({
          title: analyzedData.title || "",
          type: analyzedData.type || "conference",
          organization: analyzedData.organization || "",
          date: analyzedData.date || new Date().toISOString().split('T')[0],
          duration: analyzedData.duration || "",
          description: analyzedData.description || ""
        })
        setShowForm(true)
        setEditingCert(null)

        toast({
          title: "Certificate Analyzed! 🤖",
          description: "Certification form auto-filled with extracted data",
        })
      } else {
        throw new Error("Analysis failed")
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze certificate. Please fill manually.",
        variant: "destructive",
      })
    }

    // Reset file input
    event.target.value = ''
  }

  const handleLogout = () => {
    setUserRole(null)
    setDepartment(null)
    localStorage.removeItem("currentUserId")
    localStorage.removeItem("facultyToken")
    toast({
      title: "Logged Out Successfully! 👋",
      description: "Thank you for using JACSICE Faculty Portal",
    })
    router.push("/")
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "conference":
        return "bg-green-100 text-green-800"
      case "fdp":
        return "bg-purple-100 text-purple-800"
      case "journal":
        return "bg-blue-100 text-blue-800"
      case "research":
        return "bg-orange-100 text-orange-800"
      case "seminar":
        return "bg-pink-100 text-pink-800"
      case "project":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "conference":
        return <User className="h-4 w-4" />
      case "fdp":
        return <Award className="h-4 w-4" />
      case "journal":
        return <FileText className="h-4 w-4" />
      case "research":
        return <Building className="h-4 w-4" />
      case "seminar":
        return <Calendar className="h-4 w-4" />
      case "project":
        return <Award className="h-4 w-4" />
      default:
        return <Award className="h-4 w-4" />
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "👨‍🏫"
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const cancelEdit = () => {
    setFormData({
      title: "",
      type: "",
      organization: "",
      date: "",
      duration: "",
      description: "",
    })
    setEditingCert(null)
    setShowForm(false)
  }

  // Sort certifications: pinned first, then by date
  const sortedCertifications = [...certifications].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full staff-theme">
        {/* Sidebar */}
        <Sidebar className="border-r">
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 border-2 border-blue-200">
                <AvatarImage 
                  src={userProfile?.profilePhoto} 
                  alt={userProfile?.fullName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
                  {getInitials(userProfile?.fullName || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {userProfile?.fullName ? `${userProfile.fullName.split(" ")[0]}` : "Faculty"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {userProfile?.designation || department + " Department"}
                </p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation 🧭</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/staff/dashboard")}>
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/staff/my-profile")}>
                      <User className="h-4 w-4" />
                      <span>My Profile</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/staff/certifications/view")}>
                      <Award className="h-4 w-4" />
                      <span>View All Certifications</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Certification Stats 📊</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2 p-2">
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Total</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">{certifications.length}</Badge>
                    </div>
                  </Card>

                  <Card className="p-3 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Pinned</span>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        {certifications.filter((c) => c.isPinned).length}
                      </Badge>
                    </div>
                  </Card>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Certificate Upload Section */}
            <SidebarGroup>
              <SidebarGroupLabel>Quick Actions ⚡</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="p-2">
                  <input
                    type="file"
                    id="certificate-upload-sidebar"
                    accept="image/*,application/pdf"
                    onChange={handleCertificateUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="certificate-upload-sidebar"
                    className="flex items-center w-full justify-start p-3 rounded-md hover:bg-gray-100 cursor-pointer text-sm border border-dashed border-gray-300"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Certificate (AI Analysis)
                  </Label>
                  <p className="text-xs text-gray-500 mt-2">
                    Upload certificate image/PDF to auto-fill form using AI
                  </p>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <Button variant="outline" onClick={handleLogout} className="w-full bg-transparent">
              <LogOut className="h-4 w-4 mr-2" />
              Logout 👋
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-gray-800">Manage Certifications 🏆</h1>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="certificate-upload-header"
                  accept="image/*,application/pdf"
                  onChange={handleCertificateUpload}
                  className="hidden"
                />
                <Label
                  htmlFor="certificate-upload-header"
                >
                  <Button variant="outline" className="bg-blue-50 hover:bg-blue-100">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Certificate
                  </Button>
                </Label>
                <Button onClick={() => {
                  setEditingCert(null)
                  setShowForm(!showForm)
                }} className="bg-green-600 hover:bg-green-700">
                  <Plus className="h-4 w-4 mr-2" />
                  {editingCert ? "Edit Certification" : "Add Certification"}
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Add/Edit Certification Form */}
              {showForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingCert ? "Edit Certification" : "Add New Certification"}</CardTitle>
                    <CardDescription>
                      {editingCert ? "Update your certification details" : "Fill in the details of your certification or achievement"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title">Title *</Label>
                          <Input
                            id="title"
                            placeholder="e.g., Machine Learning Workshop"
                            value={formData.title}
                            onChange={(e) => handleInputChange("title", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type">Type *</Label>
                          <Select value={formData.type} onValueChange={(value) => handleInputChange("type", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conference">Conference</SelectItem>
                              <SelectItem value="fdp">FDP (Faculty Development Program)</SelectItem>
                              <SelectItem value="journal">Journal Publication</SelectItem>
                              <SelectItem value="research">Research Project</SelectItem>
                              <SelectItem value="seminar">Seminar/Webinar</SelectItem>
                              <SelectItem value="project">Project Guided</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="organization">Organization *</Label>
                          <Input
                            id="organization"
                            placeholder="e.g., IEEE, ACM, University Name"
                            value={formData.organization}
                            onChange={(e) => handleInputChange("organization", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date">Date *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => handleInputChange("date", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration</Label>
                          <Input
                            id="duration"
                            placeholder="e.g., 3 days, 1 week, 6 months"
                            value={formData.duration}
                            onChange={(e) => handleInputChange("duration", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your certification, what you learned, achievements, etc."
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          rows={4}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={cancelEdit}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                          {isLoading ? (
                            <div className="flex items-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {editingCert ? "Updating..." : "Saving..."}
                            </div>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              {editingCert ? "Update Certification" : "Save Certification"}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Certifications List */}
              {sortedCertifications.length > 0 ? (
                <div className="space-y-4">
                  {sortedCertifications.map((cert) => (
                    <Card key={cert.id} className="hover:shadow-lg transition-shadow group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <CardTitle className="text-lg">{cert.title}</CardTitle>
                              {cert.isPinned && (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  Pinned
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center space-x-3">
                              <Badge className={getTypeColor(cert.type)}>
                                {getTypeIcon(cert.type)}
                                <span className="ml-1 capitalize">{cert.type}</span>
                              </Badge>
                              <div className="flex items-center text-sm text-gray-500">
                                <Building className="h-4 w-4 mr-1" />
                                {cert.organization}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="h-4 w-4 mr-1" />
                                {new Date(cert.date).toLocaleDateString()}
                              </div>
                              {cert.duration && <Badge variant="outline">{cert.duration}</Badge>}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(cert)}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleTogglePin(cert.id)}
                              className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                            >
                              <Star className={`h-4 w-4 ${cert.isPinned ? "fill-current" : ""}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setCertToDelete(cert)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {cert.description && (
                        <CardContent>
                          <CardDescription className="text-base">{cert.description}</CardDescription>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Certifications Yet</h3>
                  <p className="text-gray-500 mb-4">
                    Start building your professional portfolio by adding your first certification.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button onClick={() => {
                      setEditingCert(null)
                      setShowForm(true)
                    }} className="bg-green-600 hover:bg-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Certification
                    </Button>
                    <input
                      type="file"
                      id="certificate-upload-main"
                      accept="image/*,application/pdf"
                      onChange={handleCertificateUpload}
                      className="hidden"
                    />
                    <Label
                      htmlFor="certificate-upload-main"
                    >
                      <Button variant="outline">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Certificate
                      </Button>
                    </Label>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!certToDelete} onOpenChange={() => setCertToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to delete this certification?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the certification
                "{certToDelete?.title}" from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Certification
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarProvider>
  )
}