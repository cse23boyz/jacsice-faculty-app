"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  Users, 
  LogOut, 
  MessageSquare, 
  Send, 
  Crown, 
  Bell, 
  Eye, 
  User, 
  Mail, 
  BookOpen, 
  Award, 
  Search,
  GraduationCap,
  Phone,
  Calendar,
  FileText
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"

interface FacultyMember {
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
  certifications?: any[]
}

export default function AdminDashboard() {
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyMember | null>(null)
  const [messageText, setMessageText] = useState("")
  const [faculty, setFaculty] = useState<FacultyMember[]>([])
  const [showMessageDialog, setShowMessageDialog] = useState(false)
  const [showUserProfile, setShowUserProfile] = useState(false)
  const [selectedUser, setSelectedUser] = useState<FacultyMember | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredFaculty, setFilteredFaculty] = useState<FacultyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalFaculty: 0,
    activeFaculty: 0,
    departments: 0,
    totalCertifications: 0
  })

  const router = useRouter()
  const { toast } = useToast()

  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  useEffect(() => {
    // Check admin authentication using both methods
    const adminToken = localStorage.getItem("adminToken") || getCookie("adminToken")
    
    if (!adminToken) {
      router.push("/auth/admin-login")
      return
    }

    fetchFacultyData()
  }, [router])

const fetchFacultyData = async () => {
  try {
    setIsLoading(true);
    
    console.log("Fetching faculty data from API...");
    
    const response = await fetch("/api/faculty/all", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
      },
    });

    if (response.ok) {
      const facultyData = await response.json();
      console.log(`Received ${facultyData.length} faculty members from API`);
      setFaculty(facultyData);
      
      // Calculate stats
      const departments = new Set(facultyData.map((f: FacultyMember) => f.department));
      const totalCerts = facultyData.reduce((total: number, faculty: FacultyMember) => 
        total + (faculty.certifications?.length || 0), 0
      );
      
      setStats({
        totalFaculty: facultyData.length,
        activeFaculty: facultyData.length,
        departments: departments.size,
        totalCertifications: totalCerts
      });
    } else {
      const errorData = await response.json();
      console.error("API Error:", errorData);
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

  } catch (error) {
    console.error("Error fetching faculty data:", error);
    toast({
      title: "Database Connection Error",
      description: error instanceof Error ? error.message : "Failed to load faculty data from MongoDB Atlas",
      variant: "destructive",
    });
    
    // Set empty state on error
    setFaculty([]);
    setStats({
      totalFaculty: 0,
      activeFaculty: 0,
      departments: 0,
      totalCertifications: 0
    });
  } finally {
    setIsLoading(false);
  }
};
  useEffect(() => {
    // Filter faculty based on search term
    if (searchTerm.trim()) {
      const filtered = faculty.filter(
        (member) =>
          member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredFaculty(filtered)
    } else {
      setFilteredFaculty(faculty)
    }
  }, [searchTerm, faculty])

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem("adminToken")
    localStorage.removeItem("role")
    localStorage.removeItem("adminUsername")
    
    // Clear cookies
    document.cookie = "adminToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    document.cookie = "adminUsername=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    
    toast({
      title: "Admin Logged Out! 👑",
      description: "Thank you for using JACSICE Admin Portal",
    })
    
    router.push("/auth/admin-login")
  }

  const handleSendMessage = async () => {
    if (!selectedFaculty || !messageText.trim()) {
      toast({
        title: "Error ❌",
        description: "Please select faculty and enter a message",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/admin/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
        body: JSON.stringify({
          facultyId: selectedFaculty._id,
          message: messageText,
          type: "admin_message"
        }),
      })

      if (response.ok) {
        toast({
          title: "Message Sent! 📨",
          description: `Message sent to ${selectedFaculty.fullName}`,
        })
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }

    setMessageText("")
    setShowMessageDialog(false)
    setSelectedFaculty(null)
  }

  const openMessageDialog = (facultyMember: FacultyMember) => {
    setSelectedFaculty(facultyMember)
    setShowMessageDialog(true)
  }

  const handleViewUser = async (user: FacultyMember) => {
    try {
      // Fetch detailed user data with certifications
      const response = await fetch(`/api/faculty/${user._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setSelectedUser(userData)
        setShowUserProfile(true)
      } else {
        throw new Error("Failed to fetch user details")
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getCertificationsByType = (certifications: any[] = []) => {
    const byType: { [key: string]: any[] } = {
      conference: [],
      fdp: [],
      journal: [],
      research: [],
      seminar: [],
      project: []
    }

    certifications?.forEach(cert => {
      if (byType[cert.type]) {
        byType[cert.type].push(cert)
      }
    })

    return byType
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-900 to-amber-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto mb-4"></div>
          <p className="text-orange-200">Loading Admin Dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar with Dark Orange Theme */}
        <Sidebar className="border-r bg-orange-950 border-orange-800">
          <SidebarHeader className="p-4 bg-orange-900">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-500 p-2 rounded-full">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Admin Portal</h3>
                <p className="text-sm text-orange-200">JACSICE Management</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-orange-200">Admin Functions 👑</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-orange-100 hover:bg-orange-800">
                      <Users className="h-4 w-4" />
                      <span>View Faculty</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton 
                      onClick={() => router.push("/admin/add-faculty")} 
                      className="text-orange-100 hover:bg-orange-800"
                    >
                      <User className="h-4 w-4" />
                      <span>Invite New Faculty</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => router.push("/admin/circulars")}
                      className="text-orange-100 hover:bg-orange-800"
                    >
                      <Bell className="h-4 w-4" />
                      <span>Manage Circulars</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {/* Stats in Sidebar */}
            <SidebarGroup>
              <SidebarGroupLabel className="text-orange-200">Quick Stats</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2 p-2">
                  <Card className="p-3 bg-orange-900/50 border-orange-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-200">Total Faculty</p>
                        <p className="text-xl font-bold text-white">{stats.totalFaculty}</p>
                      </div>
                      <Users className="h-5 w-5 text-orange-400" />
                    </div>
                  </Card>
                  
                  <Card className="p-3 bg-orange-900/50 border-orange-700">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-200">Certifications</p>
                        <p className="text-xl font-bold text-white">{stats.totalCertifications}</p>
                      </div>
                      <Award className="h-5 w-5 text-orange-400" />
                    </div>
                  </Card>
                </div>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4">
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full border-orange-700 text-orange-200 hover:bg-orange-800 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout 👋
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-orange-50 to-amber-50">
          <header className="border-b bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard 👑</h1>
              </div>
              <Badge className="bg-orange-100 text-orange-800 border-orange-300">Administrator</Badge>
            </div>
          </header>

          <main className="flex-1 p-6">
            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Total Faculty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalFaculty}</div>
                  <p className="text-orange-100">Registered Members</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Departments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.departments}</div>
                  <p className="text-amber-100">Active Departments</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <Award className="h-5 w-5 mr-2" />
                    Certifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.totalCertifications}</div>
                  <p className="text-yellow-100">Total Achievements</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-600 to-red-500 text-white shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Active Faculty
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stats.activeFaculty}</div>
                  <p className="text-orange-100">Currently Active</p>
                </CardContent>
              </Card>
            </div>

            {/* Search Section */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search faculty by name, department, or email... 🔍"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Faculty List */}
            <Card className="shadow-lg">
              <CardHeader className="bg-orange-50 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-orange-900">
                      <Users className="h-6 w-6" />
                      <span>Registered Faculty Members 👥</span>
                    </CardTitle>
                    <CardDescription className="text-orange-700">
                      Faculty members from MongoDB ({filteredFaculty.length} found)
                    </CardDescription>
                  </div>
                  <Button 
                    onClick={() => router.push("/admin/circulars")} 
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Manage Circulars
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredFaculty.length > 0 ? (
                  <div className="divide-y">
                    {filteredFaculty.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-4 hover:bg-orange-50 transition-colors"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12 border-2 border-orange-200">
                            {member.profilePhoto ? (
                              <AvatarImage src={member.profilePhoto} alt={member.fullName} />
                            ) : (
                              <AvatarFallback className="bg-orange-100 text-orange-800 font-semibold">
                                {getInitials(member.fullName)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-800">{member.fullName}</h3>
                            <p className="text-sm text-gray-600">
                              {member.designation} • {member.department}
                            </p>
                            <p className="text-sm text-gray-500">{member.email}</p>
                            {member.specialization && (
                              <Badge variant="outline" className="mt-1 bg-blue-50 text-blue-700 text-xs">
                                {member.specialization}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openMessageDialog(member)}
                            className="hover:bg-orange-50 border-orange-300 text-orange-700"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Message
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewUser(member)}
                            className="hover:bg-gray-50 bg-transparent"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">
                      {searchTerm ? "No Faculty Found 🔍" : "No Faculty Members 👥"}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm
                        ? "No faculty members match your search criteria"
                        : "Faculty members will appear here once they are registered in the system"}
                    </p>
                    <Button 
                      onClick={() => router.push("/admin/add-faculty")}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      <User className="h-4 w-4 mr-2" />
                      Add New Faculty
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>

        {/* Message Dialog */}
        <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Send Message to Faculty</span>
              </DialogTitle>
              <DialogDescription>
                {selectedFaculty && `Sending message to ${selectedFaculty.fullName}`}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Message 📝</Label>
                <Textarea
                  placeholder="Type your message here..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                <p className="text-sm text-orange-700">
                  💡 This message will appear in the faculty member's dashboard with a note "Only to you from admin"
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowMessageDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSendMessage} className="bg-orange-600 hover:bg-orange-700">
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* User Profile Dialog */}
        <Dialog open={showUserProfile} onOpenChange={setShowUserProfile}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Faculty Profile - {selectedUser?.fullName}</span>
              </DialogTitle>
              <DialogDescription>Complete profile information from MongoDB</DialogDescription>
            </DialogHeader>

            {selectedUser && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="flex items-center space-x-4 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <Avatar className="h-20 w-20 border-2 border-orange-300">
                    {selectedUser.profilePhoto ? (
                      <AvatarImage src={selectedUser.profilePhoto} alt={selectedUser.fullName} />
                    ) : (
                      <AvatarFallback className="text-lg bg-orange-100 text-orange-800 font-semibold">
                        {getInitials(selectedUser.fullName)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-800">{selectedUser.fullName}</h2>
                    <p className="text-lg text-orange-600">{selectedUser.designation}</p>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                        {selectedUser.department}
                      </Badge>
                      {selectedUser.specialization && (
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                          {selectedUser.specialization}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Details Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Mail className="h-5 w-5" />
                        <span>Contact Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <p className="text-blue-600">{selectedUser.email}</p>
                      </div>
                      {selectedUser.phone && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Phone</Label>
                          <p className="flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedUser.phone}
                          </p>
                        </div>
                      )}
                      <div>
                        <Label className="text-sm font-medium text-gray-600">Employee ID</Label>
                        <p className="font-mono">EMP{selectedUser._id.slice(-6).toUpperCase()}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Professional Details</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedUser.specialization && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Specialization</Label>
                          <p className="flex items-center">
                            <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedUser.specialization}
                          </p>
                        </div>
                      )}
                      {selectedUser.experience && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Experience</Label>
                          <p className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedUser.experience}
                          </p>
                        </div>
                      )}
                      {selectedUser.qualification && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Qualification</Label>
                          <p className="flex items-center">
                            <Award className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedUser.qualification}
                          </p>
                        </div>
                      )}
                      {selectedUser.dateOfJoining && (
                        <div>
                          <Label className="text-sm font-medium text-gray-600">Date of Joining</Label>
                          <p className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                            {new Date(selectedUser.dateOfJoining).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Certifications Overview */}
                  <Card className="md:col-span-2">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <Award className="h-5 w-5" />
                        <span>Certifications Overview</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {Object.entries(getCertificationsByType(selectedUser.certifications)).map(([type, items]) => (
                          items.length > 0 && (
                            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <FileText className="h-4 w-4 text-gray-500" />
                                <span className="text-sm font-medium capitalize">{getCertificationLabel(type)}</span>
                              </div>
                              <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                {items.length}
                              </Badge>
                            </div>
                          )
                        ))}
                        {(!selectedUser.certifications || selectedUser.certifications.length === 0) && (
                          <div className="col-span-3 text-center py-4">
                            <Award className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-gray-500">No certifications recorded</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Bio Section */}
                {selectedUser.bio && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <User className="h-5 w-5" />
                        <span>About</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 leading-relaxed">{selectedUser.bio}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => openMessageDialog(selectedUser)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Send Message
                  </Button>
                  <Button variant="outline" onClick={() => setShowUserProfile(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  )
}