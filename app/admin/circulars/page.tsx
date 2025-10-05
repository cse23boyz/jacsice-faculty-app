"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
import { Bell, ArrowLeft, Crown, LogOut, Plus, Pin, Edit, Trash2, Download, Search, Calendar, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Circular } from "@/lib/db/schema"
import { circularsApi } from "@/lib/api/circulars"
import { notificationsApi } from "@/lib/api/notifications"

export default function AdminCircularsPage() {
  const [circulars, setCirculars] = useState<Circular[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedCircular, setSelectedCircular] = useState<Circular | null>(null)
  const [circularData, setCircularData] = useState({
    heading: "",
    body: "",
    details: "",
    adminNote: "",
  })
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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

 const handleAddCircular = async () => {
  if (!circularData.heading.trim() || !circularData.body.trim()) {
    toast({
      title: "Error ❌",
      description: "Please fill in heading and body",
      variant: "destructive",
    })
    return
  }

  setActionLoading("add")
  try {
    console.log('Sending circular data:', circularData)
    
    const newCircular = await circularsApi.createCircular({
      ...circularData,
      createdBy: user?.id || "admin"
    })

    console.log('Circular created successfully:', newCircular)

    if (newCircular) {
      // Notify all staff users
      try {
        await notificationsApi.createNotification({
          type: 'circular',
          title: circularData.heading,
          content: circularData.body,
          circularId: newCircular.id,
          from: 'Admin',
          userId: 'all'
        })
        console.log('Notification sent for circular:', newCircular.id)
      } catch (notificationError) {
        console.error('Failed to send notifications:', notificationError)
        // Continue even if notification fails
      }

      toast({
        title: "Circular Added! 📢",
        description: "New circular has been created and sent to all staff members",
      })

      setCircularData({ heading: "", body: "", details: "", adminNote: "" })
      setShowAddDialog(false)
      
      // Refresh the list with a small delay to ensure data is saved
      setTimeout(() => {
        loadCirculars()
      }, 500)
    }
  } catch (error: any) {
    console.error('Failed to create circular:', error)
    toast({
      title: "Error ❌",
      description: error.message || "Failed to create circular. Please try again.",
      variant: "destructive",
    })
  } finally {
    setActionLoading(null)
  }
}

  const handleEditCircular = async () => {
    if (!selectedCircular) return

    setActionLoading("edit")
    try {
      await circularsApi.updateCircular(selectedCircular.id, circularData)
      
      toast({
        title: "Circular Updated! ✅",
        description: "Circular has been updated successfully",
      })

      setShowEditDialog(false)
      setSelectedCircular(null)
      setCircularData({ heading: "", body: "", details: "", adminNote: "" })
      loadCirculars() // Refresh the list
    } catch (error) {
      console.error('Failed to update circular:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteCircular = async (circularId: string) => {
  setActionLoading(`delete-${circularId}`)
  try {
    await circularsApi.deleteCircular(circularId)
    
    toast({
      title: "Circular Deleted! 🗑️",
      description: "Circular has been removed successfully",
    })
    
    // Optimistically update the UI
    setCirculars(prev => prev.filter(circular => circular.id !== circularId))
    
  } catch (error) {
    console.error('Failed to delete circular:', error)
    
    // Check if it's a "not found" error - still update UI optimistically
    if (error instanceof Error && error.message.includes('not found')) {
      toast({
        title: "Circular Already Removed",
        description: "This circular was already deleted",
      })
      // Still update the UI
      setCirculars(prev => prev.filter(circular => circular.id !== circularId))
    } else {
      toast({
        title: "Error ❌",
        description: "Failed to delete circular. Please try again.",
        variant: "destructive",
      })
    }
  } finally {
    setActionLoading(null)
  }
}

  const handlePinCircular = async (circularId: string, currentPinnedStatus: boolean) => {
    setActionLoading(`pin-${circularId}`)
    try {
      await circularsApi.pinCircular(circularId, !currentPinnedStatus)
      
      toast({
        title: !currentPinnedStatus ? "Circular Pinned 📌" : "Circular Unpinned 📌",
        description: !currentPinnedStatus ? "Circular has been pinned to top" : "Circular has been unpinned",
      })
      
      loadCirculars() // Refresh the list
    } catch (error) {
      console.error('Failed to pin circular:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDownload = (circular: Circular, format: "pdf" | "word") => {
    toast({
      title: `Downloading as ${format.toUpperCase()} 📥`,
      description: `"${circular.heading}" will be downloaded shortly`,
    })
  }

  const openEditDialog = (circular: Circular) => {
    setSelectedCircular(circular)
    setCircularData({
      heading: circular.heading,
      body: circular.body,
      details: circular.details,
      adminNote: circular.adminNote,
    })
    setShowEditDialog(true)
  }

  const handleLogout = () => {
    setUserRole(null)
    toast({
      title: "Admin Logged Out 👑",
      description: "Thank you for using Admin Portal",
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
      <div className="flex min-h-screen w-full admin-theme dark-orange-theme">
        {/* Sidebar */}
        <Sidebar className="border-r bg-orange-50 dark:bg-orange-950/20">
          <SidebarHeader className="p-4 bg-orange-100 dark:bg-orange-900/30">
            <div className="flex items-center space-x-3">
              <div className="bg-orange-600 p-2 rounded-full">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-800 dark:text-orange-200">Admin Portal</h3>
                <p className="text-sm text-orange-600 dark:text-orange-400">Circulars Management</p>
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
                      onClick={() => router.push("/admin/dashboard")}
                      className="text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to Dashboard</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setShowAddDialog(true)}
                      className="text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add New Circular</span>
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
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Circulars Management 📢</h1>
              </div>
              <Badge className="bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700">
                {circulars.length} Circulars
              </Badge>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-950">
            {/* Search and Add Section */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search circulars by heading or content... 🔍"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
                  />
                </div>
              </div>
              <Button 
                onClick={() => setShowAddDialog(true)} 
                className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                disabled={loading}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Circular
              </Button>
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
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(circular.dateCreated).toLocaleDateString()}</span>
                            </div>
                            <span>By: {circular.createdBy}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePinCircular(circular.id, circular.isPinned)}
                            disabled={actionLoading === `pin-${circular.id}`}
                            className={circular.isPinned ? 
                              "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700" : 
                              "border-orange-300 dark:border-orange-700"
                            }
                          >
                            {actionLoading === `pin-${circular.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Pin className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(circular)}
                            disabled={actionLoading !== null}
                            className="hover:bg-blue-50 dark:hover:bg-blue-900/30 border-orange-300 dark:border-orange-700"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteCircular(circular.id)}
                            disabled={actionLoading === `delete-${circular.id}`}
                            className="hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                          >
                            {actionLoading === `delete-${circular.id}` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
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
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Circulars Found 📢</h3>
                <p className="text-gray-500 dark:text-gray-500 mb-4">
                  {searchTerm ? "No circulars match your search criteria" : "Start by adding your first circular"}
                </p>
                <Button 
                  onClick={() => setShowAddDialog(true)} 
                  className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Circular
                </Button>
              </div>
            )}
          </main>
        </div>

        {/* Add Circular Dialog */}
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-gray-800 dark:text-white">
                <Plus className="h-5 w-5" />
                <span>Add New Circular</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Create a new circular to send to all staff members
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Heading *</label>
                <Input
                  placeholder="Enter circular heading"
                  value={circularData.heading}
                  onChange={(e) => setCircularData({ ...circularData, heading: e.target.value })}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Body *</label>
                <Textarea
                  placeholder="Enter circular body content"
                  value={circularData.body}
                  onChange={(e) => setCircularData({ ...circularData, body: e.target.value })}
                  className="min-h-[120px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Additional Details</label>
                <Textarea
                  placeholder="Enter additional details (optional)"
                  value={circularData.details}
                  onChange={(e) => setCircularData({ ...circularData, details: e.target.value })}
                  className="min-h-[80px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Admin Note</label>
                <Input
                  placeholder="Add a note from admin (optional)"
                  value={circularData.adminNote}
                  onChange={(e) => setCircularData({ ...circularData, adminNote: e.target.value })}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddDialog(false)}
                  className="border-orange-300 dark:border-orange-700"
                  disabled={actionLoading === "add"}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddCircular} 
                  className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                  disabled={actionLoading === "add"}
                >
                  {actionLoading === "add" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Circular
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Circular Dialog */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent className="max-w-2xl bg-white dark:bg-gray-800">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2 text-gray-800 dark:text-white">
                <Edit className="h-5 w-5" />
                <span>Edit Circular</span>
              </DialogTitle>
              <DialogDescription className="text-gray-600 dark:text-gray-400">
                Update the circular information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Heading *</label>
                <Input
                  placeholder="Enter circular heading"
                  value={circularData.heading}
                  onChange={(e) => setCircularData({ ...circularData, heading: e.target.value })}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Body *</label>
                <Textarea
                  placeholder="Enter circular body content"
                  value={circularData.body}
                  onChange={(e) => setCircularData({ ...circularData, body: e.target.value })}
                  className="min-h-[120px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Additional Details</label>
                <Textarea
                  placeholder="Enter additional details (optional)"
                  value={circularData.details}
                  onChange={(e) => setCircularData({ ...circularData, details: e.target.value })}
                  className="min-h-[80px] bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Admin Note</label>
                <Input
                  placeholder="Add a note from admin (optional)"
                  value={circularData.adminNote}
                  onChange={(e) => setCircularData({ ...circularData, adminNote: e.target.value })}
                  className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowEditDialog(false)}
                  className="border-orange-300 dark:border-orange-700"
                  disabled={actionLoading === "edit"}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleEditCircular} 
                  className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                  disabled={actionLoading === "edit"}
                >
                  {actionLoading === "edit" ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4 mr-2" />
                      Update Circular
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  )
}