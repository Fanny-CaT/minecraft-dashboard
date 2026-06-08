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
      
      // Global fetch interceptor removed for security. Use fetchWithAuth instead.      
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
      <div className="min-h-screen flex items-center justify-center flex-col gap-8" style={{ backgroundColor: S.bg, color: S.white }}>
        <style dangerouslySetInnerHTML={{ __html: `
          .cube-grid {
            width: 50px;
            height: 50px;
            margin: 0 auto;
          }
          .cube-grid .cube {
            width: 33.33%;
            height: 33.33%;
            background-color: ${S.cyan};
            float: left;
            animation: cubeGridScaleDelay 1.3s infinite ease-in-out;
            box-shadow: inset 0 0 0 1px rgba(0,0,0,0.2);
          }
          .cube-grid .cube1 { animation-delay: 0.2s; }
          .cube-grid .cube2 { animation-delay: 0.3s; }
          .cube-grid .cube3 { animation-delay: 0.4s; }
          .cube-grid .cube4 { animation-delay: 0.1s; }
          .cube-grid .cube5 { animation-delay: 0.2s; }
          .cube-grid .cube6 { animation-delay: 0.3s; }
          .cube-grid .cube7 { animation-delay: 0.0s; }
          .cube-grid .cube8 { animation-delay: 0.1s; }
          .cube-grid .cube9 { animation-delay: 0.2s; }

          @keyframes cubeGridScaleDelay {
            0%, 70%, 100% { transform: scale3D(1, 1, 1); }
            35% { transform: scale3D(0, 0, 1); }
          }
        `}} />
        
        <div className="cube-grid">
          <div className="cube cube1"></div>
          <div className="cube cube2"></div>
          <div className="cube cube3"></div>
          <div className="cube cube4"></div>
          <div className="cube cube5"></div>
          <div className="cube cube6"></div>
          <div className="cube cube7"></div>
          <div className="cube cube8"></div>
          <div className="cube cube9"></div>
        </div>
        
        <p style={{ fontSize: "11px", color: S.muted, fontWeight: "bold", letterSpacing: "3px", textTransform: "uppercase" }}>
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
