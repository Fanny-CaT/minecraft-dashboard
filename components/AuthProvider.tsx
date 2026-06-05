"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";
import { S } from "@/lib/constants";

interface AuthContextType {
  user: User | null;
  role: string;
  permissions: string[];
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: "loading",
  permissions: [],
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string>("loading");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (!currentUser) {
        setRole("guest");
        setPermissions([]);
        setLoading(false);
        if (pathname !== "/login") {
          router.push("/login");
        }
      } else {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setRole(data.role || "pending");
            setPermissions(data.permissions || []);
          } else {
            setRole("pending");
          }
        } catch (e) {
          console.error("Failed to fetch user role", e);
          setRole("pending");
        } finally {
          setLoading(false);
        }
      }
    });
    return () => unsubscribe();
  }, [router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-6" style={{ backgroundColor: S.bg, color: S.white }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes meowPulse {
            0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 20px ${S.cyan}40; }
            50% { opacity: 0.6; transform: scale(0.92); box-shadow: 0 0 40px ${S.cyan}20; }
          }
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}} />
        
        {/* Animated Logo Block */}
        <div style={{
          width: "60px", height: "60px", 
          backgroundColor: S.cyan, 
          borderRadius: "14px",
          animation: "meowPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        }} />
        
        {/* Skeleton Bars */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", width: "160px", alignItems: "center" }}>
          <div style={{ height: "8px", width: "100%", backgroundColor: S.sidebar, borderRadius: "4px", overflow: "hidden", position: "relative" }}>
             <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)`, animation: "shimmer 1.5s infinite" }} />
          </div>
          <div style={{ height: "8px", width: "60%", backgroundColor: S.sidebar, borderRadius: "4px", overflow: "hidden", position: "relative" }}>
             <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)`, animation: "shimmer 1.5s infinite" }} />
          </div>
        </div>
        
        <p style={{ marginTop: "4px", fontSize: "11px", color: S.muted, fontWeight: "bold", letterSpacing: "2px", textTransform: "uppercase" }}>
          Authenticating
        </p>
      </div>
    );
  }

  // Only block access if they are logged in but pending AND they aren't on the login page
  if (role === "pending" && pathname !== "/login") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: S.bg, color: S.white }}>
        <div style={{ padding: "40px", backgroundColor: S.content, borderRadius: "8px", border: `1px solid ${S.border}`, textAlign: "center", maxWidth: "400px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: S.red }}>Access Pending</h2>
          <p style={{ color: S.muted, marginBottom: "24px" }}>
            Your account has been created, but an administrator needs to approve your access before you can view the dashboard.
          </p>
          <button onClick={() => auth.signOut()} style={{ padding: "10px 20px", backgroundColor: S.sidebar, color: S.white, border: `1px solid ${S.border}`, borderRadius: "4px", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role, permissions, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
