"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  User,
  Award,
  Bell,
  Settings,
  LogOut,
  BookOpen,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Star,
  Calendar,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  userId: string;
  fullName: string;
  email: string;
  department: string;
  designation: string;
  bio: string;
  phone: string;
  specialization: string;
  experience: string;
  qualification: string;
  dateOfJoining: string;
  profilePhoto: string;
  isSaved: boolean;
}

interface Certification {
  id: string;
  title: string;
  type: "conference" | "fdp" | "journal" | "research";
  organization: string;
  date: string;
  isPinned: boolean;
}

interface DashboardStats {
  totalCertifications: number;
  conferences: number;
  fdps: number;
  journals: number;
  research: number;
  pinned: number;
  upcomingEvents: number;
  pendingTasks: number;
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
    pinned: 0,
    upcomingEvents: 0,
    pendingTasks: 3,
  });
  const [unreadCirculars, setUnreadCirculars] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [profileComplete, setProfileComplete] = useState(false);

  // Fetch user profile and data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const currentUserId = localStorage.getItem("currentUserId");
        if (!currentUserId) {
          router.push("/auth/faculty-login");
          return;
        }

        // Check if profile exists in localStorage first
        const savedProfile = localStorage.getItem(`userProfile_${currentUserId}`);
        
        if (savedProfile) {
          const profileData = JSON.parse(savedProfile);
          setProfile(profileData);
          setProfileComplete(profileData.isSaved && profileData.fullName && profileData.department);
          
          if (!profileData.isSaved || !profileData.fullName || !profileData.department) {
            toast({
              title: "Profile Incomplete",
              description: "Please complete your profile setup",
              variant: "destructive",
            });
            router.push("/staff/profile");
            return;
          }
        } else {
          // No profile found, redirect to profile setup
          toast({
            title: "Welcome! 👋",
            description: "Please set up your profile to continue",
          });
          router.push("/staff/profile");
          return;
        }

        // Fetch certifications from API
        await fetchCertifications(currentUserId);
        
        // Fetch additional stats
        await fetchDashboardStats(currentUserId);

        // Check unread circulars
        const circularViewStatus = localStorage.getItem(`circulars_viewed_${currentUserId}`);
        setUnreadCirculars(circularViewStatus ? 0 : 3);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [router, toast]);

  const fetchCertifications = async (userId: string) => {
    try {
      // Mock API call - replace with actual API endpoint
      const mockCertifications: Certification[] = [
        {
          id: "1",
          title: "International Conference on AI",
          type: "conference",
          organization: "IEEE",
          date: "2024-01-15",
          isPinned: true,
        },
        {
          id: "2",
          title: "FDP on Machine Learning",
          type: "fdp",
          organization: "IIT Madras",
          date: "2024-02-20",
          isPinned: false,
        },
        {
          id: "3",
          title: "Research Paper Publication",
          type: "journal",
          organization: "Springer",
          date: "2024-03-10",
          isPinned: true,
        },
      ];

      setCertifications(mockCertifications);
      
      // Update stats based on certifications
      setStats(prev => ({
        ...prev,
        totalCertifications: mockCertifications.length,
        conferences: mockCertifications.filter(c => c.type === "conference").length,
        fdps: mockCertifications.filter(c => c.type === "fdp").length,
        journals: mockCertifications.filter(c => c.type === "journal").length,
        research: mockCertifications.filter(c => c.type === "research").length,
        pinned: mockCertifications.filter(c => c.isPinned).length,
      }));

    } catch (error) {
      console.error("Error fetching certifications:", error);
      // Fallback to empty array
      setCertifications([]);
    }
  };

  const fetchDashboardStats = async (userId: string) => {
    try {
      // Mock API call for additional stats
      const mockStats = {
        upcomingEvents: 2,
        pendingTasks: 3,
      };

      setStats(prev => ({
        ...prev,
        ...mockStats,
      }));
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

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
    const currentUserId = localStorage.getItem("currentUserId");
    localStorage.setItem(`circulars_viewed_${currentUserId}`, "true");
    setUnreadCirculars(0);
    router.push("/staff/circulars");
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
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

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
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
                <Button 
                  variant="ghost" 
                  className="w-full justify-start relative" 
                  onClick={handleCircularsClick}
                >
                  <Bell className="mr-2 h-4 w-4" /> Admin Communications
                  {unreadCirculars > 0 && (
                    <Badge variant="destructive" className="ml-auto">
                      {unreadCirculars}
                    </Badge>
                  )}
                </Button>
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
                  <span className="text-sm text-gray-600">Upcoming Events</span>
                  <Badge variant="secondary">{stats.upcomingEvents}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pending Tasks</span>
                  <Badge variant="destructive">{stats.pendingTasks}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pinned Certs</span>
                  <Badge variant="outline">{stats.pinned}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Certification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Certifications</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.totalCertifications}</p>
                  </div>
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Conferences</p>
                    <p className="text-3xl font-bold text-green-600">{stats.conferences}</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">FDPs</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.fdps}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Publications</p>
                    <p className="text-3xl font-bold text-orange-600">{stats.journals + stats.research}</p>
                  </div>
                  <FileText className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" /> Recent Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {certifications.length > 0 ? (
                <div className="space-y-4">
                  {certifications.slice(0, 3).map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {cert.isPinned && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        <div>
                          <p className="font-medium">{cert.title}</p>
                          <p className="text-sm text-gray-600">{cert.organization} • {cert.type}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{new Date(cert.date).toLocaleDateString()}</p>
                        <Badge variant={cert.type === "conference" ? "default" : "secondary"}>
                          {cert.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No certifications yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => handleNavigation("/staff/certifications")}
                  >
                    Add Your First Certification
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Profile Completion Status */}
          {profile && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" /> Profile Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Basic Information</span>
                    <Badge variant={profile.fullName && profile.email ? "default" : "destructive"}>
                      {profile.fullName && profile.email ? "Complete" : "Incomplete"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Professional Details</span>
                    <Badge variant={profile.designation && profile.department ? "default" : "destructive"}>
                      {profile.designation && profile.department ? "Complete" : "Incomplete"}
                    </Badge>
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
          )}
        </div>
      </div>
    </div>
  );
}