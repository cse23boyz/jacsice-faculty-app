"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
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
import { ArrowLeft, LogOut, Award, BookOpen, Calendar, FileText, Presentation, Pin, Edit, Download } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface UserProfile {
  _id: string
  id: string
  fullName: string
  email: string
  department: string
  designation: string
  phone?: string
  specialization?: string
  experience?: string
  qualification?: string
  dateOfJoining?: string
  bio?: string
  profilePhoto?: string
}

interface Certification {
  _id: string
  id: string
  title: string
  type: "conference" | "fdp" | "journal" | "research" | "seminar" | "project"
  organization: string
  date: string
  duration?: string
  description?: string
  isPinned: boolean
  createdAt: string
}

export default function MyProfilePage() {
  const [profileData, setProfileData] = useState<UserProfile | null>(null)
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const router = useRouter()
  const { department, setUserRole, setDepartment } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem("facultyToken")
        if (!token) {
          router.push("/auth/faculty-login")
          return
        }

        // Fetch profile from MongoDB
        const profileResponse = await fetch("/api/faculty/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (profileResponse.ok) {
          const profile = await profileResponse.json()
          setProfileData(profile)
        } else {
          throw new Error("Failed to fetch profile")
        }

        // Fetch certifications from MongoDB
        const certsResponse = await fetch("/api/faculty/certifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (certsResponse.ok) {
          const certsData = await certsResponse.json()
          setCertifications(certsData)
        } else {
          throw new Error("Failed to fetch certifications")
        }
      } catch (error) {
        console.error("Error fetching profile data:", error)
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        })
        // Fallback to localStorage
        loadFromLocalStorage()
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfileData()
  }, [router, toast])

  const loadFromLocalStorage = () => {
    const currentUserId = localStorage.getItem("currentUserId")
    if (currentUserId) {
      // Load profile from localStorage
      const profile = localStorage.getItem(`userProfile_${currentUserId}`)
      if (profile) {
        const parsedProfile = JSON.parse(profile)
        setProfileData(parsedProfile)
      }

      // Load certifications from localStorage
      const savedCertifications = localStorage.getItem(`certifications_${currentUserId}`)
      if (savedCertifications) {
        setCertifications(JSON.parse(savedCertifications))
      }
    }
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
    router.push("/auth/faculty-login")
  }

 const handleDownloadProfile = async (format: "pdf" | "xlsx") => {
  try {
    const token = localStorage.getItem("facultyToken");
    const response = await fetch(`/api/faculty/profile/export?format=${format}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profile_${profileData?.fullName}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: `Profile Downloaded! 📥`,
        description: `Your profile has been exported as ${format.toUpperCase()}`,
      });
    } else {
      throw new Error("Failed to download profile");
    }
  } catch (error) {
    toast({
      title: "Download Failed",
      description: "Failed to export profile",
      variant: "destructive",
    });
  }
};

  const getCertificationsByType = () => {
    const byType = {
      conference: certifications.filter(cert => cert.type === "conference"),
      fdps: certifications.filter(cert => cert.type === "fdp"),
      journal: certifications.filter(cert => cert.type === "journal"),
      research: certifications.filter(cert => cert.type === "research"),
      seminar: certifications.filter(cert => cert.type === "seminar"),
      project: certifications.filter(cert => cert.type === "project")
    }

    // Sort each type by pinned first, then by date
    Object.keys(byType).forEach(key => {
      byType[key] = byType[key].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      })
    })

    return byType
  }

  const getCertificationIcon = (type: string) => {
    switch (type) {
      case "conference":
        return <Presentation className="h-5 w-5" />
      case "fdp":
        return <BookOpen className="h-5 w-5" />
      case "journal":
        return <FileText className="h-5 w-5" />
      case "research":
        return <Award className="h-5 w-5" />
      case "seminar":
        return <Calendar className="h-5 w-5" />
      case "project":
        return <Award className="h-5 w-5" />
      default:
        return <Award className="h-5 w-5" />
    }
  }

  const getCertificationLabel = (type: string) => {
    switch (type) {
      case "conference":
        return "Conferences Attended"
      case "fdp":
        return "Faculty Development Programs"
      case "journal":
        return "Journal Publications"
      case "research":
        return "Research Projects"
      case "seminar":
        return "Seminars & Webinars"
      case "project":
        return "Projects Guided"
      default:
        return type
    }
  }

  const getTotalCertifications = () => {
    return certifications.length
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

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Please complete your profile setup first</p>
          <Button onClick={() => router.push("/staff/profile")}>Complete Profile</Button>
        </div>
      </div>
    )
  }

  const certificationsByType = getCertificationsByType()

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full staff-theme">
        {/* Sidebar */}
        <Sidebar className="border-r">
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 border-2 border-blue-200">
                <AvatarImage 
                  src={profileData.profilePhoto} 
                  alt={profileData.fullName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
                  {getInitials(profileData.fullName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{profileData.fullName}</h3>
                <p className="text-sm text-muted-foreground">{profileData.designation}</p>
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
                    <SidebarMenuButton onClick={() => router.push("/staff/profile")}>
                      <Edit className="h-4 w-4" />
                      <span>Edit Profile</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push("/staff/certifications")}>
                      <Award className="h-4 w-4" />
                      <span>Update Certifications</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Certification Summary 📊</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2 p-2">
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-800">Total Certifications</p>
                        <p className="text-2xl font-bold text-blue-600">{getTotalCertifications()}</p>
                      </div>
                      <Award className="h-8 w-8 text-blue-500" />
                    </div>
                  </Card>
                  
                  <Card className="p-3 bg-yellow-50 border-yellow-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-yellow-800">Pinned Certifications</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {certifications.filter(cert => cert.isPinned).length}
                        </p>
                      </div>
                      <Pin className="h-8 w-8 text-yellow-500" />
                    </div>
                  </Card>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Export Profile 📤</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2 p-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full justify-start text-xs" 
                    onClick={() => handleDownloadProfile("pdf")}
                  >
                    <Download className="h-3 w-3 mr-2" /> Download PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full justify-start text-xs" 
                    onClick={() => handleDownloadProfile("xlsx")}
                  >
                    <Download className="h-3 w-3 mr-2" /> Download Excel
                  </Button>
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
                <h1 className="text-2xl font-bold text-gray-800">My Profile & Certifications 🏆</h1>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                  {profileData.department}
                </Badge>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadProfile("pdf")}
                  >
                    <Download className="h-4 w-4 mr-1" /> PDF
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDownloadProfile("xlsx")}
                  >
                    <Download className="h-4 w-4 mr-1" /> Excel
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Profile Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center space-x-6">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                      <AvatarImage 
                        src={profileData.profilePhoto} 
                        alt={profileData.fullName}
                        className="object-cover"
                      />
                      <AvatarFallback className="text-xl bg-blue-100 text-blue-800 font-semibold">
                        {getInitials(profileData.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-2xl">{profileData.fullName}</CardTitle>
                      <CardDescription className="text-lg">{profileData.designation}</CardDescription>
                      <div className="flex items-center space-x-4 mt-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800">
                          {profileData.department}
                        </Badge>
                        {profileData.specialization && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            {profileData.specialization}
                          </Badge>
                        )}
                        <Badge variant="outline" className="bg-purple-100 text-purple-800">
                          {getTotalCertifications()} Certifications
                        </Badge>
                      </div>
                    </div>
                    <Button onClick={() => router.push("/staff/profile")} className="bg-blue-600 hover:bg-blue-700">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Email:</strong> {profileData.email}
                    </div>
                    {profileData.phone && (
                      <div>
                        <strong>Phone:</strong> {profileData.phone}
                      </div>
                    )}
                    {profileData.experience && (
                      <div>
                        <strong>Experience:</strong> {profileData.experience}
                      </div>
                    )}
                    {profileData.qualification && (
                      <div>
                        <strong>Qualification:</strong> {profileData.qualification}
                      </div>
                    )}
                    {profileData.dateOfJoining && (
                      <div>
                        <strong>Date of Joining:</strong> {new Date(profileData.dateOfJoining).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  {profileData.bio && (
                    <div className="mt-4">
                      <strong>About:</strong>
                      <p className="text-gray-700 mt-1">{profileData.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Certifications */}
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(certificationsByType).map(([type, items]) => (
                  <Card key={type} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center space-x-2">
                          {getCertificationIcon(type)}
                          <span>
                            {getCertificationLabel(type)} ({items.length})
                          </span>
                        </CardTitle>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push("/staff/certifications")}
                          className="hover:bg-blue-50"
                        >
                          <Award className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {items.length > 0 ? (
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              className="p-4 border rounded-lg bg-white shadow-sm relative hover:shadow-md transition-shadow"
                            >
                              {item.isPinned && (
                                <div className="absolute top-2 right-2">
                                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                                    <Pin className="h-3 w-3 mr-1" />
                                    Pinned
                                  </Badge>
                                </div>
                              )}
                              <div className="pr-16">
                                <h4 className="font-semibold text-base text-gray-800 mb-2">
                                  {item.title}
                                </h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  {item.date && (
                                    <div className="flex items-center space-x-2">
                                      <Calendar className="h-4 w-4 text-blue-500" />
                                      <span>{new Date(item.date).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                  {item.organization && (
                                    <div className="flex items-center space-x-2">
                                      <Award className="h-4 w-4 text-green-500" />
                                      <span>{item.organization}</span>
                                    </div>
                                  )}
                                  {item.duration && (
                                    <div className="flex items-center space-x-2">
                                      <BookOpen className="h-4 w-4 text-purple-500" />
                                      <span>{item.duration}</span>
                                    </div>
                                  )}
                                </div>
                                {item.description && (
                                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
                                    <strong>Details:</strong> {item.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="text-gray-400 mb-3 flex justify-center">{getCertificationIcon(type)}</div>
                          <p className="text-gray-500 text-sm mb-3">
                            No {getCertificationLabel(type).toLowerCase()} recorded
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => router.push("/staff/certifications")}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          >
                            <Award className="h-4 w-4 mr-1" />
                            Add First Entry
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}