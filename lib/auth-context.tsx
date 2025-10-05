"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface AuthContextType {
  userRole: string | null
  setUserRole: (role: string | null) => void
  department: string | null
  setDepartment: (department: string | null) => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [department, setDepartment] = useState<string | null>(null)

  useEffect(() => {
    // Check for existing auth on mount
    const role = localStorage.getItem("role")
    const userDept = localStorage.getItem("department")
    
    if (role) {
      setUserRole(role)
    }
    if (userDept) {
      setDepartment(userDept)
    }
  }, [])

  const isAdmin = userRole === "admin" || userRole === "superadmin"

  return (
    <AuthContext.Provider value={{ 
      userRole, 
      setUserRole, 
      department, 
      setDepartment,
      isAdmin 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}