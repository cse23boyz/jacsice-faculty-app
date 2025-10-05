"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Bell, ArrowLeft, User, LogOut, Pin, Download, Search, Calendar, Loader2, Eye } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Circular } from "@/lib/db/schema"
import { circularsApi } from "@/lib/api/circulars"

export default function StaffCircularsPage() {
  const [circulars, setCirculars] = useState<Circular[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null)

  const router = useRouter()
  const { user, setUserRole } = useAuth()
  const { toast } = useToast()

  useEffect(() => {
    loadCirculars()
  }, [])

  const loadCirculars = async (search?: string) => {
    setLoading(true)
    try {
      const response = await circularsApi.getCirculars(search)
      if (response.success) {
        setCirculars(response.data)
      }
    } catch (error) {
      console.error('Error loading circulars:', error)
      toast({
        title: "Error ❌",
        description: "Failed to load circulars",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    loadCirculars(value)
  }

  const handleDownload = (circular: Circular, format: "pdf" | "word") => {
    toast({
      title: `Downloading as ${format.toUpperCase()} 📥`,
      description: `"${circular.heading}" will be downloaded shortly`,
    })
    
    // Simulate download
    const content = `
Circular: ${circular.heading}
Date: ${new Date(circular.dateCreated).toLocaleDateString()}
Content: ${circular.body}
${circular.details ? `Details: ${circular.details}` : ''}
${circular.adminNote ? `Admin Note: ${circular.adminNote}` : ''}
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${circular.heading.replace(/\s+/g, '_')}.${format === 'pdf' ? 'pdf' : 'docx'}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleLogout = () => {
    setUserRole(null)
    toast({
      title: "Logged Out 👋",
      description: "Thank you for using Staff Portal",
    })
    router.push("/")
  }

  const filteredCirculars = circulars.filter(
    (circular) =>
      circular.heading.toLowerCase().includes(searchTerm.toLowerCase()) ||
      circular.body.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const sortedCirculars = [...filteredCirculars].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
  })

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
                <p className="text-sm text-orange-600 dark:text-orange-400">Circulars</p>
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
                      onClick={() => loadCirculars()}
                      className="text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    >
                      <Eye className="h-4 w-4" />
                      <span>Refresh Circulars</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
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
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Staff Circulars 📢</h1>
              </div>
              <div className="flex items-center space-x-4">
                <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700">
                  {circulars.length} Circulars
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => loadCirculars()}
                  disabled={loading}
                  className="border-orange-300 dark:border-orange-700"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-950">
            {/* Search Section */}
            <div className="mb-6">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search circulars by heading or content... 🔍"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                />
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading circulars...</span>
              </div>
            )}

            {/* Circulars List */}
            {!loading && sortedCirculars.length > 0 ? (
              <div className="space-y-4">
                {sortedCirculars.map((circular) => (
                  <Card 
                    key={circular.id} 
                    className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-800"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <CardTitle className="text-xl text-gray-800 dark:text-white">
                              {circular.heading}
                            </CardTitle>
                            {circular.isPinned && (
                              <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700">
                                <Pin className="h-3 w-3 mr-1" />
                                Pinned
                              </Badge>
                            )}
                            <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                              New
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(circular.dateCreated).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                            </div>
                            <Badge variant="outline" className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300">
                              From Admin
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Content:</h4>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-line">{circular.body}</p>
                      </div>

                      {circular.details && (
                        <div>
                          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">Additional Details:</h4>
                          <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{circular.details}</p>
                        </div>
                      )}

                      {circular.adminNote && (
                        <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                          <h4 className="font-medium text-orange-800 dark:text-orange-200 mb-1">Admin Note:</h4>
                          <p className="text-orange-700 dark:text-orange-300 whitespace-pre-line">{circular.adminNote}</p>
                        </div>
                      )}

                      <div className="flex gap-2 pt-4 border-t border-orange-200 dark:border-orange-800">
                        {/* <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(circular, "pdf")}
                          className="bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button> */}
                        {/* <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(circular, "word")}
                          className="bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Word
                        </Button> */}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !loading && (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Circulars Available 📢</h3>
                <p className="text-gray-500 dark:text-gray-500 mb-4">
                  {searchTerm ? "No circulars match your search criteria" : "No circulars have been published yet"}
                </p>
                <Button 
                  onClick={() => loadCirculars()} 
                  variant="outline"
                  className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}