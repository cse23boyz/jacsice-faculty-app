"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  User,
  Award,
  Bell,
  Settings,
  LogOut,
  BookOpen,
  Users,
  FileText,
  Clock,
  Star,
  Calendar,
  BarChart3,
  Download,
  Key,
  Upload,
  Mail,
  Phone,
  Bookmark,
  Eye,
  EyeOff,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  _id: string;
  id: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  bio?: string;
  phone?: string;
  specialization?: string;
  experience?: string;
  qualification?: string;
  dateOfJoining?: string;
  profilePhoto?: string;
  isSaved: boolean;
}

interface Certification {
  _id: string;
  id: string;
  title: string;
  type: "conference" | "fdp" | "journal" | "research" | "seminar" | "project";
  organization: string;
  date: string;
  isPinned: boolean;
  duration?: string;
  description?: string;
}

interface DashboardStats {
  totalCertifications: number;
  conferences: number;
  fdps: number;
  journals: number;
  research: number;
  seminars: number;
  projects: number;
  pinned: number;
  upcomingEvents: number;
  pendingTasks: number;
  unreadCirculars: number;
}

export default function StaffDashboard() {
  const router = useRouter();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    totalCertifications: 0,
    conferences: 0,
    fdps: 0,
    journals: 0,
    research: 0,
    seminars: 0,
    projects: 0,
    pinned: 0,
    upcomingEvents: 0,
    pendingTasks: 0,
    unreadCirculars: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);

  // Password reset states
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [passwordResetData, setPasswordResetData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch user profile and data from MongoDB
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("facultyToken");
        if (!token) {
          router.push("/auth/faculty-login");
          return;
        }

        // Fetch profile from MongoDB
        const profileResponse = await fetch("/api/faculty/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            // Profile not found, redirect to profile setup
            toast({
              title: "Profile Setup Required",
              description: "Please complete your profile to continue",
            });
            router.push("/staff/profile");
            return;
          }
          throw new Error(`Profile fetch failed: ${profileResponse.status}`);
        }

        const profileData = await profileResponse.json();
        setProfile(profileData);
        
        // Check if profile is complete - only require basic fields
        const isComplete = !!(profileData.fullName && profileData.email && profileData.department && profileData.designation);
        setProfileComplete(isComplete);
        
        if (!isComplete) {
          toast({
            title: "Profile Incomplete",
            description: "Please complete your profile setup",
            variant: "destructive",
          });
          router.push("/staff/profile");
          return;
        }

        // Only fetch other data if profile is complete
        // Fetch certifications from MongoDB
        const certsResponse = await fetch("/api/faculty/certifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (certsResponse.ok) {
          const certsData = await certsResponse.json();
          setCertifications(certsData);
        }

        // Fetch dashboard stats
        const statsResponse = await fetch("/api/faculty/dashboard-stats", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          setStats(prev => ({ ...prev, ...statsData }));
        }

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setCheckingProfile(false);
      }
    };

    fetchDashboardData();
  }, [router, toast]);

  const handleLogout = () => {
    localStorage.removeItem("currentUserId");
    localStorage.removeItem("facultyToken");
    localStorage.removeItem("facultyProfile");
    localStorage.removeItem("role");
    
    toast({
      title: "Logged Out Successfully! 👋",
      description: "See you next time!",
    });
    router.push("/auth/faculty-login");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  const handleCircularsClick = () => {
    setStats(prev => ({ ...prev, unreadCirculars: 0 }));
    router.push("/staff/circulars");
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResettingPassword(true);

    try {
      const token = localStorage.getItem("facultyToken");
      
      if (!passwordResetData.currentPassword || !passwordResetData.newPassword || !passwordResetData.confirmPassword) {
        toast({
          title: "Missing Information",
          description: "Please fill in all password fields",
          variant: "destructive",
        });
        return;
      }

      if (passwordResetData.newPassword !== passwordResetData.confirmPassword) {
        toast({
          title: "Passwords Don't Match",
          description: "New password and confirm password must match",
          variant: "destructive",
        });
        return;
      }

      if (passwordResetData.newPassword.length < 6) {
        toast({
          title: "Password Too Short",
          description: "New password must be at least 6 characters long",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwordResetData.currentPassword,
          newPassword: passwordResetData.newPassword
        }),
      });

      if (response.ok) {
        toast({
          title: "Password Changed Successfully! ✅",
          description: "Your password has been updated successfully",
        });
        
        // Reset form and close modal
        setPasswordResetData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
        setShowPasswordReset(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }
    } catch (error: any) {
      console.error("Password change error:", error);
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handlePasswordInputChange = (field: string, value: string) => {
    setPasswordResetData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
        a.download = `profile_${profile?.fullName}_${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
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

  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast({
        title: "Invalid File",
        description: "Please upload an image or PDF file",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("facultyToken");
      const formData = new FormData();
      formData.append("certificate", file);

      toast({
        title: "Analyzing Certificate...",
        description: "Please wait while we extract information from your certificate",
      });

      const response = await fetch("/api/certificates/analyze", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const analyzedData = await response.json();
        
        // Create URLSearchParams for auto-fill
        const params = new URLSearchParams({
          autoFill: "true",
          title: encodeURIComponent(analyzedData.title || ""),
          type: analyzedData.type || "conference",
          organization: encodeURIComponent(analyzedData.organization || ""),
          date: analyzedData.date || new Date().toISOString().split('T')[0],
          duration: analyzedData.duration || "",
          description: encodeURIComponent(analyzedData.description || "")
        });

        router.push(`/staff/certifications?${params.toString()}`);

        toast({
          title: "Certificate Analyzed! 🤖",
          description: "Certification form auto-filled with extracted data",
        });
      } else {
        throw new Error("Analysis failed");
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Could not analyze certificate. Please fill manually.",
        variant: "destructive",
      });
    }

    // Reset file input
    event.target.value = '';
  };

  const getInitials = (name: string) => {
    if (!name) return "👨‍🏫";
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCertificationIcon = (type: string) => {
    switch (type) {
      case "conference":
        return <Users className="h-4 w-4" />;
      case "fdp":
        return <BookOpen className="h-4 w-4" />;
      case "journal":
        return <FileText className="h-4 w-4" />;
      case "research":
        return <Award className="h-4 w-4" />;
      case "seminar":
        return <Calendar className="h-4 w-4" />;
      case "project":
        return <Bookmark className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  // Show loading only when checking profile
  if (isLoading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Don't show the dashboard if profile is not complete
  if (!profileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-6 max-w-md text-center">
          <CardContent>
            <User className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Setup Required</h2>
            <p className="text-gray-600 mb-6">Please complete your profile to access the dashboard</p>
            <Button 
              onClick={() => router.push("/staff/profile")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Complete Profile Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show dashboard only when profile is complete and data is loaded
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="p-6">
          <CardContent className="text-center">
            <p className="text-gray-600 mb-4">Profile not found. Please complete your profile setup.</p>
            <Button 
              onClick={() => router.push("/staff/profile")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Complete Setup
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Avatar className="h-14 w-14 border-2 border-blue-200 shadow-md">
              <AvatarImage 
                src={profile.profilePhoto} 
                alt={profile.fullName}
                className="object-cover"
              />
              <AvatarFallback className="bg-blue-100 text-blue-800 text-lg font-semibold">
                {getInitials(profile.fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome, {profile.fullName}!</h1>
              <p className="text-gray-600">
                {profile.designation} • {profile.department}
                {profile.specialization && ` • ${profile.specialization}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" onClick={() => handleNavigation("/staff/profile")}>
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Quick Actions Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" /> Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => handleNavigation("/staff/my-profile")}
                >
                  <User className="mr-2 h-4 w-4" /> My Profile
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => handleNavigation("/staff/profile")}
                >
                  <Settings className="mr-2 h-4 w-4" /> Update Profile
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => handleNavigation("/staff/certifications")}
                >
                  <Award className="mr-2 h-4 w-4" /> Manage Certifications
                </Button>
                
                {/* Certificate Upload */}
                <div className="pt-2">
                  <input
                    type="file"
                    id="certificate-upload"
                    accept="image/*,application/pdf"
                    onChange={handleCertificateUpload}
                    className="hidden"
                  />
                  <Label
                    htmlFor="certificate-upload"
                    className="flex items-center w-full justify-start p-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm border border-dashed border-gray-300"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Certificate (AI Analysis)
                  </Label>
                </div>

                <Button 
                  variant="ghost" 
                  className="w-full justify-start relative" 
                  onClick={handleCircularsClick}
                >
                  <Bell className="mr-2 h-4 w-4" /> Admin Communications
                  {stats.unreadCirculars > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {stats.unreadCirculars}
                    </Badge>
                  )}
                </Button>
                
                {/* Password Reset */}
                <Button 
                  variant="ghost" 
                  className="w-full justify-start" 
                  onClick={() => setShowPasswordReset(true)}
                >
                  <Key className="mr-2 h-4 w-4" /> Change Password
                </Button>

                {/* Download Options */}
                <div className="border-t pt-2 mt-2 space-y-1">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full justify-start text-xs" 
                    onClick={() => handleDownloadProfile("pdf")}
                  >
                    <Download className="mr-2 h-3 w-3" /> Download PDF
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="w-full justify-start text-xs" 
                    onClick={() => handleDownloadProfile("xlsx")}
                  >
                    <Download className="mr-2 h-3 w-3" /> Download XLSX
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" /> Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Certifications</span>
                  <Badge variant="secondary">{stats.totalCertifications}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pinned Certifications</span>
                  <Badge variant="outline">{stats.pinned}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Unread Circulars</span>
                  <Badge variant={stats.unreadCirculars > 0 ? "destructive" : "outline"}>
                    {stats.unreadCirculars}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Upcoming Events</span>
                  <Badge variant="secondary">{stats.upcomingEvents}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="mr-2 h-5 w-5" /> Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {profile.email}
                </div>
                {profile.phone && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {profile.phone}
                  </div>
                )}
                <div className="flex items-center text-sm text-gray-600">
                  <User className="h-4 w-4 mr-2" />
                  {profile.department}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Certification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white"
              onClick={() => handleNavigation("/staff/certifications")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-100">Total Certifications</p>
                    <p className="text-3xl font-bold">{stats.totalCertifications}</p>
                  </div>
                  <Award className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-green-500 to-green-600 text-white"
              onClick={() => handleNavigation("/staff/certifications?type=conference")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-100">Conferences</p>
                    <p className="text-3xl font-bold">{stats.conferences}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-purple-500 to-purple-600 text-white"
              onClick={() => handleNavigation("/staff/certifications?type=fdp")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-100">FDPs</p>
                    <p className="text-3xl font-bold">{stats.fdps}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer bg-gradient-to-br from-orange-500 to-orange-600 text-white"
              onClick={() => handleNavigation("/staff/certifications?type=journal")}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-100">Publications</p>
                    <p className="text-3xl font-bold">{stats.journals + stats.research}</p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Certifications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" /> Recent Certifications
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleNavigation("/staff/certifications")}
              >
                View All
              </Button>
            </CardHeader>
            <CardContent>
              {certifications.length > 0 ? (
                <div className="space-y-4">
                  {certifications.slice(0, 5).map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {cert.isPinned && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                          {getCertificationIcon(cert.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{cert.title}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{cert.organization}</span>
                            <span>•</span>
                            <span className="capitalize">{cert.type}</span>
                            <span>•</span>
                            <span>{new Date(cert.date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={cert.isPinned ? "default" : "outline"}>
                        {cert.isPinned ? "Pinned" : "Certified"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Certifications Yet</h3>
                  <p className="text-gray-500 mb-4">Start building your professional portfolio</p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Button 
                      onClick={() => handleNavigation("/staff/certifications")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Add Certification
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
                      <Button 
                        variant="outline"
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Certificate
                      </Button>
                    </Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Completion & Export */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Profile Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" /> Profile Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Basic Information</span>
                    <Badge variant="default">Complete</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Professional Details</span>
                    <Badge variant="default">Complete</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Profile Photo</span>
                    <Badge variant={profile.profilePhoto ? "default" : "secondary"}>
                      {profile.profilePhoto ? "Uploaded" : "Not Uploaded"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Additional Information</span>
                    <Badge variant={profile.specialization || profile.qualification ? "default" : "secondary"}>
                      {profile.specialization || profile.qualification ? "Partial" : "Not Started"}
                    </Badge>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => handleNavigation("/staff/profile")}
                >
                  Update Profile
                </Button>
              </CardContent>
            </Card>

            {/* Quick Export */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Download className="mr-2 h-5 w-5" /> Export Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Download your complete profile with all certifications in your preferred format.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      onClick={() => handleDownloadProfile("pdf")}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button 
                      onClick={() => handleDownloadProfile("xlsx")}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      XLSX
                    </Button>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500">
                      Includes: Personal info, professional details, and all certifications
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="mr-2 h-5 w-5" /> Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.unreadCirculars > 0 && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">New Circulars Available</p>
                        <p className="text-sm text-blue-700">{stats.unreadCirculars} unread announcements</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handleCircularsClick}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      View
                    </Button>
                  </div>
                )}
                
                {stats.totalCertifications === 0 && (
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Award className="h-5 w-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-yellow-900">No Certifications Added</p>
                        <p className="text-sm text-yellow-700">Start building your professional portfolio</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleNavigation("/staff/certifications")}
                      variant="outline"
                    >
                      Add Now
                    </Button>
                  </div>
                )}

                {!profile.profilePhoto && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="font-medium text-orange-900">Profile Photo Missing</p>
                        <p className="text-sm text-orange-700">Add a photo to complete your profile</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleNavigation("/staff/profile")}
                      variant="outline"
                    >
                      Add Photo
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordReset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Change Password</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowPasswordReset(false);
                  setPasswordResetData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                  });
                }}
              >
                ×
              </Button>
            </div>
            
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter your current password"
                    value={passwordResetData.currentPassword}
                    onChange={(e) => handlePasswordInputChange("currentPassword", e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password (min. 6 characters)"
                    value={passwordResetData.newPassword}
                    onChange={(e) => handlePasswordInputChange("newPassword", e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={passwordResetData.confirmPassword}
                    onChange={(e) => handlePasswordInputChange("confirmPassword", e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-gray-600 space-y-1 p-3 bg-gray-50 rounded-lg">
                <p className="font-medium">Password requirements:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>At least 6 characters long</li>
                  <li>New password and confirm password must match</li>
                  <li>You must know your current password</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowPasswordReset(false);
                    setPasswordResetData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: ""
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isResettingPassword}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isResettingPassword ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Changing...
                    </div>
                  ) : (
                    "Change Password"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}