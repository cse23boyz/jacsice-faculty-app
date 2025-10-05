"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { ArrowLeft, User, LogOut, Award, Calendar, FileText, Loader2, Building, MapPin, Clock } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Certification {
  id: string
  title: string
  type: "conference" | "fdp" | "journal" | "research" | "seminar" | "project"
  organization: string
  date: string
  duration: string
  description: string
  isPinned: boolean
  dateCreated: string
  createdBy: string
}

export default function StaffCertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    conferences: 0,
    fdp: 0,
    journals: 0,
    research: 0,
    seminars: 0,
    projects: 0
  })

  const router = useRouter()
  const { user, setUserRole } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadCertifications()
  }, [])

  const loadCertifications = async () => {
    setLoading(true)
    try {
      // Try to load from API first
      const response = await fetch('/api/circulars')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Transform circulars to certifications format
          const certs = data.data.map((circular: any) => ({
            id: circular.id,
            title: circular.heading,
            type: this.mapCircularToCertType(circular.body),
            organization: "JACSICE Admin",
            date: circular.dateCreated,
            duration: "N/A",
            description: circular.body,
            isPinned: circular.isPinned,
            dateCreated: circular.dateCreated,
            createdBy: circular.createdBy
          }))
          setCertifications(certs)
        } else {
          throw new Error('API returned error')
        }
      } else {
        throw new Error('API call failed')
      }
    } catch (error) {
      console.error('Error loading certifications from API:', error)
      // Fallback to localStorage or sample data
      loadFromLocalStorage()
    } finally {
      setLoading(false)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const savedCertifications = localStorage.getItem('staffCertifications')
      if (savedCertifications) {
        setCertifications(JSON.parse(savedCertifications))
      } else {
        // Set sample data
        setCertifications([
          {
            id: 'cert_1',
            title: 'Advanced Teaching Methodology Workshop',
            type: 'fdp',
            organization: 'JACSICE Training Center',
            date: '2024-01-15',
            duration: '3 days',
            description: 'Comprehensive workshop on modern teaching methodologies and student engagement techniques.',
            isPinned: true,
            dateCreated: '2024-01-15T00:00:00.000Z',
            createdBy: 'admin'
          },
          {
            id: 'cert_2',
            title: 'International Conference on Computer Science',
            type: 'conference',
            organization: 'IEEE Computer Society',
            date: '2024-02-20',
            duration: '2 days',
            description: 'Presented research paper on artificial intelligence applications in education.',
            isPinned: false,
            dateCreated: '2024-02-20T00:00:00.000Z',
            createdBy: 'admin'
          },
          {
            id: 'cert_3',
            title: 'Journal Publication - Machine Learning Review',
            type: 'journal',
            organization: 'Springer Nature',
            date: '2024-03-10',
            duration: 'N/A',
            description: 'Published research article in international journal on machine learning advancements.',
            isPinned: true,
            dateCreated: '2024-03-10T00:00:00.000Z',
            createdBy: 'admin'
          }
        ])
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    }
  }

  const mapCircularToCertType = (content: string): Certification['type'] => {
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes('conference') || lowerContent.includes('workshop')) return 'conference'
    if (lowerContent.includes('fdp') || lowerContent.includes('faculty development')) return 'fdp'
    if (lowerContent.includes('journal') || lowerContent.includes('publication')) return 'journal'
    if (lowerContent.includes('research') || lowerContent.includes('study')) return 'research'
    if (lowerContent.includes('seminar') || lowerContent.includes('webinar')) return 'seminar'
    if (lowerContent.includes('project') || lowerContent.includes('guidance')) return 'project'
    return 'seminar' // default
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "conference":
        return "bg-blue-100 text-blue-800 border-blue-300"
      case "fdp":
        return "bg-green-100 text-green-800 border-green-300"
      case "journal":
        return "bg-purple-100 text-purple-800 border-purple-300"
      case "research":
        return "bg-orange-100 text-orange-800 border-orange-300"
      case "seminar":
        return "bg-pink-100 text-pink-800 border-pink-300"
      case "project":
        return "bg-indigo-100 text-indigo-800 border-indigo-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
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

  const handleLogout = () => {
    setUserRole(null)
    toast({
      title: "Logged Out 👋",
      description: "Thank you for using Staff Portal",
    })
    router.push("/")
  }

  const calculateStats = (certs: Certification[]) => {
    const stats = {
      total: certs.length,
      conferences: certs.filter(c => c.type === 'conference').length,
      fdp: certs.filter(c => c.type === 'fdp').length,
      journals: certs.filter(c => c.type === 'journal').length,
      research: certs.filter(c => c.type === 'research').length,
      seminars: certs.filter(c => c.type === 'seminar').length,
      projects: certs.filter(c => c.type === 'project').length
    }
    setStats(stats)
  }

  useEffect(() => {
    calculateStats(certifications)
  }, [certifications])

  const sortedCertifications = [...certifications].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.date).getTime() - new Date(a.date).getTime()
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full staff-theme dark-orange-theme">
        {/* Sidebar */}
        <Sidebar className="border-r bg-orange-50 dark:bg-orange-950/20">
          <SidebarHeader className="p-4 bg-orange-100 dark:bg-orange-900/30">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-600 p-2 rounded-full">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">Staff Portal</h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">Certifications</p>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="text-orange-700 dark:text-orange-300">Navigation 🧭</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => router.push("/staff/dashboard")}
                      className="text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => router.push("/staff/circulars")}
                      className="text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    >
                      <FileText className="h-4 w-4" />
                      <span>View Circulars</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="text-orange-700 dark:text-orange-300">Certification Stats 📊</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="space-y-2 p-2">
                  <Card className="p-3 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Total</span>
                      </div>
                      <Badge className="bg-orange-100 dark:bg-orange-800 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-600">
                        {stats.total}
                      </Badge>
                    </div>
                  </Card>

                  <Card className="p-3 bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Conferences</span>
                      </div>
                      <Badge className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-600">
                        {stats.conferences}
                      </Badge>
                    </div>
                  </Card>

                  <Card className="p-3 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">FDP</span>
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600">
                        {stats.fdp}
                      </Badge>
                    </div>
                  </Card>

                  <Card className="p-3 bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Journals</span>
                      </div>
                      <Badge className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-600">
                        {stats.journals}
                      </Badge>
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
              className="w-full border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 bg-transparent"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout 👋
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          <header className="border-b bg-white dark:bg-gray-900 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">My Certifications 🎓</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700">
                  {certifications.length} Certifications
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCertifications()}
                  disabled={loading}
                  className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-950">
            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading certifications...</span>
              </div>
            )}

            {/* Certifications List */}
            {!loading && sortedCertifications.length > 0 ? (
              <div className="grid gap-6">
                {sortedCertifications.map((certification) => (
                  <Card 
                    key={certification.id} 
                    className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-800"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <CardTitle className="text-xl text-gray-800 dark:text-white">
                              {certification.title}
                            </CardTitle>
                            {certification.isPinned && (
                              <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
                                📌 Pinned
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 mb-3">
                            <Badge className={`${getTypeColor(certification.type)} border`}>
                              {getTypeIcon(certification.type)}
                              <span className="ml-1 capitalize">{certification.type}</span>
                            </Badge>
                            
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Building className="h-4 w-4 mr-1" />
                              {certification.organization}
                            </div>
                            
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(certification.date)}
                            </div>
                            
                            {certification.duration && certification.duration !== 'N/A' && (
                              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                                <Clock className="h-4 w-4 mr-1" />
                                {certification.duration}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Description:</h4>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{certification.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-4 border-t border-orange-200 dark:border-orange-800">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Added on {formatDate(certification.dateCreated)}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                          >
                            <Award className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !loading && (
              <div className="text-center py-12">
                <Award className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Certifications Available 🎓</h3>
                <p className="text-gray-500 dark:text-gray-500 mb-4">
                  No certifications have been added to your profile yet.
                </p>
                <Button 
                  onClick={() => router.push("/staff/dashboard")} 
                  variant="outline"
                  className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}