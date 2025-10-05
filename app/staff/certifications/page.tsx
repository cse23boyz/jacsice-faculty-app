"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { ArrowLeft, User, LogOut, Award, Plus, Save, Star, Calendar, Building, FileText, Upload, Trash2, Edit, Download, Eye, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/hooks/use-toast"

interface Certification {
  id: string
  title: string
  type: "conference" | "fdp" | "journal" | "research" | "seminar" | "project" | "workshop" | "certification"
  organization: string
  date: string
  duration: string
  description: string
  isPinned: boolean
  dateCreated: string
  createdBy: string
  certificateFile?: string
  fileName?: string
}

export default function StaffCertificationsPage() {
  const [certifications, setCertifications] = useState<Certification[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingCert, setEditingCert] = useState<Certification | null>(null)
  const [certToDelete, setCertToDelete] = useState<Certification | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const router = useRouter()
  const { user, setUserRole } = useAuth()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    type: "" as Certification['type'],
    organization: "",
    date: "",
    duration: "",
    description: "",
    certificateFile: ""
  })

  useEffect(() => {
    loadCertifications()
  }, [])

  const loadCertifications = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/certifications')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setCertifications(data.data)
        } else {
          throw new Error('Failed to load certifications')
        }
      } else {
        throw new Error('API call failed')
      }
    } catch (error) {
      console.error('Error loading certifications:', error)
      // Fallback to localStorage
      const savedCertifications = localStorage.getItem('staffCertifications')
      if (savedCertifications) {
        setCertifications(JSON.parse(savedCertifications))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload JPEG, PNG, or PDF files only",
        variant: "destructive",
      })
      return
    }

    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload files smaller than 10MB",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setAnalyzing(true)

    try {
      // First upload the file
      const uploadFormData = new FormData()
      uploadFormData.append('certificate', file)

      toast({
        title: "Uploading Certificate...",
        description: "Please wait while we upload your certificate",
      })

      const uploadResponse = await fetch('/api/certificates/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Upload failed')
      }

      const uploadResult = await uploadResponse.json()

      // Then analyze the certificate
      toast({
        title: "Analyzing Certificate...",
        description: "AI is extracting information from your certificate",
      })

      const analyzeResponse = await fetch('/api/certificates/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileUrl: uploadResult.fileUrl,
          fileName: file.name
        }),
      })

      if (analyzeResponse.ok) {
        const analyzedData = await analyzeResponse.json()
        
        // Auto-fill form with analyzed data
        setFormData({
          title: analyzedData.title || file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          type: analyzedData.type || "certification",
          organization: analyzedData.organization || "Unknown Organization",
          date: analyzedData.date || new Date().toISOString().split('T')[0],
          duration: analyzedData.duration || "",
          description: analyzedData.description || `Certificate uploaded from ${file.name}`,
          certificateFile: uploadResult.fileUrl
        })
        
        setShowForm(true)
        setEditingCert(null)

        toast({
          title: "Certificate Analyzed! 🤖",
          description: "Form auto-filled with AI-extracted data. Please review and save.",
        })
      } else {
        throw new Error('Analysis failed')
      }
    } catch (error) {
      console.error('Error processing certificate:', error)
      toast({
        title: "Processing Failed",
        description: "Could not process certificate. Please fill the form manually.",
        variant: "destructive",
      })
      
      // Still show form for manual entry
      setFormData({
        title: file.name.replace(/\.[^/.]+$/, ""),
        type: "certification",
        organization: "",
        date: new Date().toISOString().split('T')[0],
        duration: "",
        description: "",
        certificateFile: ""
      })
      setShowForm(true)
    } finally {
      setUploading(false)
      setAnalyzing(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (!formData.title || !formData.type || !formData.organization || !formData.date) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        setLoading(false)
        return
      }

      const certificationData = {
        ...formData,
        isPinned: false,
        dateCreated: new Date().toISOString(),
        createdBy: user?.id || "staff",
        fileName: formData.certificateFile ? formData.certificateFile.split('/').pop() : undefined
      }

      const response = await fetch('/api/certifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(certificationData),
      })

      if (response.ok) {
        const result = await response.json()
        
        toast({
          title: "Certification Saved! 🎉",
          description: "Your certification has been saved to the database",
        })

        // Reset form and reload certifications
        setFormData({
          title: "",
          type: "" as Certification['type'],
          organization: "",
          date: "",
          duration: "",
          description: "",
          certificateFile: ""
        })
        setShowForm(false)
        setEditingCert(null)
        
        await loadCertifications()
      } else {
        throw new Error('Failed to save certification')
      }
    } catch (error) {
      console.error('Error saving certification:', error)
      toast({
        title: "Save Failed",
        description: "Could not save certification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!certToDelete) return

    try {
      const response = await fetch(`/api/certifications/${certToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: "Certification Deleted! 🗑️",
          description: "Your certification has been permanently deleted",
        })

        // Remove from local state
        setCertifications(prev => prev.filter(cert => cert.id !== certToDelete.id))
        
        // Also update localStorage
        const updatedCerts = certifications.filter(cert => cert.id !== certToDelete.id)
        localStorage.setItem('staffCertifications', JSON.stringify(updatedCerts))
      } else {
        throw new Error('Failed to delete certification')
      }
    } catch (error) {
      console.error('Error deleting certification:', error)
      toast({
        title: "Delete Failed",
        description: "Could not delete certification. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCertToDelete(null)
      setShowDeleteDialog(false)
    }
  }

  const handleDownload = (certification: Certification) => {
    if (certification.certificateFile) {
      // Create a temporary link to download the file
      const link = document.createElement('a')
      link.href = certification.certificateFile
      link.download = certification.fileName || `certificate_${certification.id}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast({
        title: "Download Started",
        description: "Your certificate is being downloaded",
      })
    } else {
      toast({
        title: "No File Available",
        description: "This certification doesn't have an attached file",
        variant: "destructive",
      })
    }
  }

  const handleView = (certification: Certification) => {
    if (certification.certificateFile) {
      window.open(certification.certificateFile, '_blank')
    } else {
      toast({
        title: "No File Available",
        description: "This certification doesn't have an attached file",
        variant: "destructive",
      })
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
      case "workshop":
        return "bg-teal-100 text-teal-800 border-teal-300"
      case "certification":
        return "bg-red-100 text-red-800 border-red-300"
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
      case "workshop":
        return <Award className="h-4 w-4" />
      case "certification":
        return <Award className="h-4 w-4" />
      default:
        return <Award className="h-4 w-4" />
    }
  }

  const cancelForm = () => {
    setFormData({
      title: "",
      type: "" as Certification['type'],
      organization: "",
      date: "",
      duration: "",
      description: "",
      certificateFile: ""
    })
    setEditingCert(null)
    setShowForm(false)
  }

  const sortedCertifications = [...certifications].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime()
  })

  const stats = {
    total: certifications.length,
    withFiles: certifications.filter(c => c.certificateFile).length,
    conferences: certifications.filter(c => c.type === 'conference').length,
    fdp: certifications.filter(c => c.type === 'fdp').length,
    journals: certifications.filter(c => c.type === 'journal').length,
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
              <SidebarGroupLabel className="text-orange-700 dark:text-orange-300">Quick Upload ⚡</SidebarGroupLabel>
              <SidebarGroupContent>
                <div className="p-2">
                  <input
                    type="file"
                    id="certificate-upload-sidebar"
                    accept="image/*,application/pdf"
                    onChange={handleCertificateUpload}
                    className="hidden"
                    disabled={uploading || analyzing}
                  />
                  <Label
                    htmlFor="certificate-upload-sidebar"
                    className={`flex items-center w-full justify-start p-3 rounded-md cursor-pointer text-sm border border-dashed border-orange-300 dark:border-orange-700 ${
                      uploading || analyzing 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'hover:bg-orange-100 dark:hover:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {uploading || analyzing ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Upload Certificate (AI)'}
                  </Label>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                    Upload certificate image/PDF for AI analysis and auto-fill
                  </p>
                </div>
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

                  <Card className="p-3 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-green-800 dark:text-green-200">With Files</span>
                      </div>
                      <Badge className="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 border-green-300 dark:border-green-600">
                        {stats.withFiles}
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
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  id="certificate-upload-header"
                  accept="image/*,application/pdf"
                  onChange={handleCertificateUpload}
                  className="hidden"
                  disabled={uploading || analyzing}
                />
                <Label htmlFor="certificate-upload-header">
                  <Button 
                    variant="outline" 
                    className="bg-blue-50 hover:bg-blue-100 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300"
                    disabled={uploading || analyzing}
                  >
                    {uploading || analyzing ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4 mr-2" />
                    )}
                    {uploading ? 'Uploading...' : analyzing ? 'Analyzing...' : 'Upload Certificate'}
                  </Button>
                </Label>
                <Button 
                  onClick={() => {
                    setEditingCert(null)
                    setShowForm(!showForm)
                  }} 
                  className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Certification
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-950">
            <div className="max-w-6xl mx-auto space-y-6">
              {/* Add Certification Form */}
              {showForm && (
                <Card className="bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-800">
                  <CardHeader>
                    <CardTitle className="text-gray-800 dark:text-white">
                      {editingCert ? "Edit Certification" : "Add New Certification"}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-400">
                      {editingCert ? "Update your certification details" : "Fill in the details of your certification or upload a file for AI analysis"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="title" className="text-gray-800 dark:text-gray-200">Title *</Label>
                          <Input
                            id="title"
                            placeholder="e.g., Machine Learning Workshop"
                            value={formData.title}
                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                            required
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="type" className="text-gray-800 dark:text-gray-200">Type *</Label>
                          <Select value={formData.type} onValueChange={(value: Certification['type']) => setFormData({...formData, type: value})}>
                            <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conference">Conference</SelectItem>
                              <SelectItem value="fdp">FDP (Faculty Development Program)</SelectItem>
                              <SelectItem value="journal">Journal Publication</SelectItem>
                              <SelectItem value="research">Research Project</SelectItem>
                              <SelectItem value="seminar">Seminar/Webinar</SelectItem>
                              <SelectItem value="workshop">Workshop</SelectItem>
                              <SelectItem value="certification">Professional Certification</SelectItem>
                              <SelectItem value="project">Project Guided</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="organization" className="text-gray-800 dark:text-gray-200">Organization *</Label>
                          <Input
                            id="organization"
                            placeholder="e.g., IEEE, ACM, University Name"
                            value={formData.organization}
                            onChange={(e) => setFormData({...formData, organization: e.target.value})}
                            required
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="date" className="text-gray-800 dark:text-gray-200">Date *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                            required
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="duration" className="text-gray-800 dark:text-gray-200">Duration</Label>
                          <Input
                            id="duration"
                            placeholder="e.g., 3 days, 1 week, 6 months"
                            value={formData.duration}
                            onChange={(e) => setFormData({...formData, duration: e.target.value})}
                            className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description" className="text-gray-800 dark:text-gray-200">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your certification, what you learned, achievements, etc."
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          rows={4}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        />
                      </div>

                      {formData.certificateFile && (
                        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                          <Label className="text-green-800 dark:text-green-200">Certificate File Attached</Label>
                          <p className="text-sm text-green-700 dark:text-green-300">
                            File will be saved with this certification
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={cancelForm}
                          className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={loading}
                          className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Certification
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Certifications List */}
              {loading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                  <span className="ml-2 text-gray-600 dark:text-gray-400">Loading certifications...</span>
                </div>
              ) : sortedCertifications.length > 0 ? (
                <div className="grid gap-6">
                  {sortedCertifications.map((certification) => (
                    <Card 
                      key={certification.id} 
                      className="hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 border-orange-200 dark:border-orange-800 group"
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
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  Pinned
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
                                {new Date(certification.date).toLocaleDateString()}
                              </div>
                              
                              {certification.duration && (
                                <Badge variant="outline" className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300">
                                  {certification.duration}
                                </Badge>
                              )}

                              {certification.certificateFile && (
                                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700">
                                  <FileText className="h-3 w-3 mr-1" />
                                  File Attached
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {certification.certificateFile && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleView(certification)}
                                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownload(certification)}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setFormData({
                                  title: certification.title,
                                  type: certification.type,
                                  organization: certification.organization,
                                  date: certification.date,
                                  duration: certification.duration,
                                  description: certification.description,
                                  certificateFile: certification.certificateFile || ""
                                })
                                setEditingCert(certification)
                                setShowForm(true)
                              }}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setCertToDelete(certification)
                                setShowDeleteDialog(true)
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>

                      {certification.description && (
                        <CardContent>
                          <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                            {certification.description}
                          </CardDescription>
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Award className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">No Certifications Yet 🎓</h3>
                  <p className="text-gray-500 dark:text-gray-500 mb-4">
                    Start building your professional portfolio by adding your first certification.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button 
                      onClick={() => setShowForm(true)} 
                      className="bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Certification
                    </Button>
                    <input
                      type="file"
                      id="certificate-upload-empty"
                      accept="image/*,application/pdf"
                      onChange={handleCertificateUpload}
                      className="hidden"
                    />
                    <Label htmlFor="certificate-upload-empty">
                      <Button variant="outline" className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300">
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
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="bg-white dark:bg-gray-800">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-800 dark:text-white">
                Delete Certification
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                Are you sure you want to delete "{certToDelete?.title}"? This action cannot be undone and will permanently remove this certification from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300">
                Cancel
              </AlertDialogCancel>
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