"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Search, Filter, LogOut, Award, ArrowLeft, BookOpen, Calendar, FileText, Presentation } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface FacultyMember {
  _id: string
  id: string
  fullName: string
  email: string
  department: string
  designation: string
  specialization?: string
  profilePhoto?: string
  certifications: Certification[]
  totalCertifications: number
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
}

export default function ViewCertificationsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDepartment, setSelectedDepartment] = useState("All")
  const [facultyList, setFacultyList] = useState<FacultyMember[]>([])
  const [filteredFaculty, setFilteredFaculty] = useState<FacultyMember[]>([])
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  const { department, setUserRole, setDepartment } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("facultyToken")
        if (!token) {
          router.push("/auth/faculty-login")
          return
        }

        // Load current user profile for sidebar
        const profileResponse = await fetch("/api/faculty/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (profileResponse.ok) {
          const profileData = await profileResponse.json()
          setCurrentUserProfile(profileData)
        }

        // Load all faculty members with their certifications from MongoDB
        const facultyResponse = await fetch("/api/faculty/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (facultyResponse.ok) {
          const facultyData = await facultyResponse.json()
          setFacultyList(facultyData)
        } else {
          throw new Error("Failed to fetch faculty data")
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        toast({
          title: "Error",
          description: "Failed to load faculty certifications",
          variant: "destructive",
        })
        // Fallback to localStorage
        loadFromLocalStorage()
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [router, toast])

  const loadFromLocalStorage = () => {
    // Load current user profile for sidebar
    const currentUserId = localStorage.getItem("currentUserId")
    if (currentUserId) {
      const currentProfile = localStorage.getItem(`userProfile_${currentUserId}`)
      if (currentProfile) {
        setCurrentUserProfile(JSON.parse(currentProfile))
      }
    }

    // Load all faculty profiles with their certifications from localStorage
    const allProfiles = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith("userProfile_")) {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || "{}")
          if (profile && profile.isSaved && profile.fullName) {
            // Load certifications for this user
            const certifications = JSON.parse(localStorage.getItem(`certifications_${profile.userId}`) || "[]")
            
            allProfiles.push({
              _id: profile.userId,
              id: profile.userId,
              fullName: profile.fullName,
              email: profile.email,
              department: profile.department,
              designation: profile.designation,
              specialization: profile.specialization,
              profilePhoto: profile.profilePhoto,
              certifications: certifications,
              totalCertifications: certifications.length,
            })
          }
        } catch (error) {
          console.error("Error parsing faculty profile:", error)
        }
      }
    }
    setFacultyList(allProfiles)
  }

  useEffect(() => {
    // Filter faculty based on search term and department
    let filtered = facultyList

    if (searchTerm) {
      filtered = filtered.filter(
        (faculty) =>
          faculty.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (faculty.specialization && faculty.specialization.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (selectedDepartment !== "All") {
      filtered = filtered.filter((faculty) => faculty.department === selectedDepartment)
    }

    setFilteredFaculty(filtered)
  }, [searchTerm, selectedDepartment, facultyList])

  const handleLogout = () => {
    setUserRole(null)
    setDepartment(null)
    localStorage.removeItem("currentUserId")
    localStorage.removeItem("facultyToken")
    toast({
      title: "Logged Out Successfully 👋",
      description: "Thank you for using JACSICE Faculty Portal",
    })
    router.push("/")
  }

  const departments = ["All", "CSE", "IT", "ECE", "MECH"]

  const getCertificationIcon = (type: string) => {
    switch (type) {
      case "conference":
        return <Presentation className="h-4 w-4" />
      case "fdp":
        return <BookOpen className="h-4 w-4" />
      case "journal":
        return <FileText className="h-4 w-4" />
      case "research":
        return <Award className="h-4 w-4" />
      case "seminar":
        return <Calendar className="h-4 w-4" />
      case "project":
        return <Award className="h-4 w-4" />
      default:
        return <Award className="h-4 w-4" />
    }
  }

  const getCertificationLabel = (type: string) => {
    switch (type) {
      case "conference":
        return "Conferences"
      case "fdp":
        return "FDPs"
      case "journal":
        return "Journals"
      case "research":
        return "Research"
      case "seminar":
        return "Seminars"
      case "project":
        return "Projects"
      default:
        return type
    }
  }

  const getCertificationsByType = (certifications: Certification[]) => {
    const byType: { [key: string]: Certification[] } = {
      conference: [],
      fdp: [],
      journal: [],
      research: [],
      seminar: [],
      project: []
    }

    certifications.forEach(cert => {
      if (byType[cert.type]) {
        byType[cert.type].push(cert)
      }
    })

    return byType
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading faculty certifications...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full staff-theme">
        {/* Sidebar */}
        <Sidebar className="border-r">
          <SidebarHeader className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 border-2 border-blue-200">
                <AvatarImage 
                  src={currentUserProfile?.profilePhoto} 
                  alt={currentUserProfile?.fullName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
                  {getInitials(currentUserProfile?.fullName || "")}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">
                  {currentUserProfile?.fullName ? `${currentUserProfile.fullName.split(" ")[0]}` : "Faculty"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {currentUserProfile?.designation || department + " Department"}
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
                    <SidebarMenuButton onClick={() => router.push("/staff/certifications")}>
                      <Award className="h-4 w-4" />
                      <span>Update My Certifications</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Statistics 📊</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2 p-2">
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">Total Faculty</span>
                      </div>
                      <Badge className="bg-blue-100 text-blue-800">{facultyList.length}</Badge>
                    </div>
                  </Card>

                  <Card className="p-3 bg-green-50 border-green-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium">Total Certifications</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {facultyList.reduce((total, faculty) => total + faculty.totalCertifications, 0)}
                      </Badge>
                    </div>
                  </Card>
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
                <h1 className="text-2xl font-bold text-gray-800">Faculty Certifications 🏆</h1>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {filteredFaculty.length} Faculty Members
              </Badge>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50">
            {/* Search and Filter Section */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search faculty by name or specialization... 🔍"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Filter className="h-5 w-5 text-gray-500 mt-2" />
                  {departments.map((dept) => (
                    <Button
                      key={dept}
                      variant={selectedDepartment === dept ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedDepartment(dept)}
                      className="mobile-friendly"
                    >
                      {dept}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {filteredFaculty.length > 0 ? (
              <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredFaculty.map((faculty) => (
                  <Card key={faculty.id} className="hover:shadow-lg transition-shadow animate-fade-in">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12 border-2 border-blue-200">
                          <AvatarImage 
                            src={faculty.profilePhoto} 
                            alt={faculty.fullName}
                            className="object-cover"
                          />
                          <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
                            {getInitials(faculty.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{faculty.fullName}</CardTitle>
                          <CardDescription>
                            {faculty.designation} • {faculty.department}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          {faculty.totalCertifications} Certifications
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        {Object.entries(getCertificationsByType(faculty.certifications)).map(([type, items]) => (
                          items.length > 0 && (
                            <div key={type} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                {getCertificationIcon(type)}
                                <span className="text-sm font-medium">{getCertificationLabel(type)}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {items.length}
                              </Badge>
                            </div>
                          )
                        ))}
                      </div>

                      {faculty.specialization && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-gray-600">
                            <strong>Specialization:</strong> {faculty.specialization}
                          </p>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full bg-transparent"
                        onClick={() => setSelectedFaculty(faculty)}
                      >
                        <Award className="h-4 w-4 mr-2" />
                        View Detailed Certifications
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Faculty Certifications Found 🏆</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? "No faculty members match your search criteria"
                    : "Faculty certification details will appear here once they update their profiles"}
                </p>
                <Button onClick={() => router.push("/staff/certifications")} className="bg-blue-600 hover:bg-blue-700">
                  <Award className="h-4 w-4 mr-2" />
                  Update Your Certifications
                </Button>
              </div>
            )}
          </main>
        </div>

        {/* Detailed Certifications Modal */}
        {selectedFaculty && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12 border-2 border-blue-200">
                      <AvatarImage 
                        src={selectedFaculty.profilePhoto} 
                        alt={selectedFaculty.fullName}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
                        {getInitials(selectedFaculty.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedFaculty.fullName}</h2>
                      <p className="text-gray-600">
                        {selectedFaculty.designation} • {selectedFaculty.department}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => setSelectedFaculty(null)}>
                    Close
                  </Button>
                </div>

                <div className="space-y-6">
                  {Object.entries(getCertificationsByType(selectedFaculty.certifications)).map(([type, items]) => (
                    items.length > 0 && (
                      <Card key={type}>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            {getCertificationIcon(type)}
                            <span>
                              {getCertificationLabel(type)} ({items.length})
                            </span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {items.map((item) => (
                              <div key={item.id} className="p-3 border rounded-lg">
                                <h4 className="font-medium">{item.title}</h4>
                                {item.date && (
                                  <p className="text-sm text-gray-600">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    Date: {new Date(item.date).toLocaleDateString()}
                                  </p>
                                )}
                                {item.organization && (
                                  <p className="text-sm text-gray-600">
                                    <Award className="h-3 w-3 inline mr-1" />
                                    Organization: {item.organization}
                                  </p>
                                )}
                                {item.duration && (
                                  <p className="text-sm text-gray-600">
                                    <BookOpen className="h-3 w-3 inline mr-1" />
                                    Duration: {item.duration}
                                  </p>
                                )}
                                {item.description && (
                                  <p className="text-sm text-gray-500 mt-2">{item.description}</p>
                                )}
                                {item.isPinned && (
                                  <Badge className="mt-2 bg-yellow-100 text-yellow-800">
                                    Pinned
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  )
}