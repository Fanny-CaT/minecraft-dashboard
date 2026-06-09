"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { S } from "@/lib/constants";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handlePostLogin = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const isAdmin = user.uid === "AGGukM4aXuYsURCTX5eA2SAtwVF3";
        await setDoc(userRef, {
          email: user.email,
          role: isAdmin ? "admin" : "pending",
          permissions: isAdmin ? ["all"] : [],
          createdAt: serverTimestamp()
        });
      }
      router.push("/");
    } catch (e) {
      console.error("Failed to setup user profile", e);
      router.push("/");
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let cred;
      if (isSignUp) {
        cred = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        cred = await signInWithEmailAndPassword(auth, email, password);
      }
      await handlePostLogin(cred.user);
    } catch (err: any) {
      setError(err.message || `Failed to ${isSignUp ? "sign up" : "login"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await handlePostLogin(cred.user);
    } catch (err: any) {
      setError(err.message || "Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: S.bg }}>
      <div style={{
        width: "100%", maxWidth: "420px", padding: "40px", boxSizing: "border-box",
        backgroundColor: S.content, borderRadius: "12px",
        boxShadow: "0 25px 50px -12px rgba(0,0,0,0.7)",
        border: `1px solid rgba(255,255,255,0.05)`
      }}>
        <div className="text-center mb-8">
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: S.white }}>MeowTopia Panel</h1>
          <p style={{ color: S.muted, marginTop: "8px" }}>
            {isSignUp ? "Create an account to request access" : "Sign in to access your dashboard"}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: S.muted, fontWeight: "500" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              style={{
                width: "100%", padding: "12px 16px", boxSizing: "border-box",
                backgroundColor: "rgba(0,0,0,0.2)", border: `1px solid ${S.border}`,
                borderRadius: "6px", color: S.white, outline: "none", fontSize: "14px",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = S.cyan}
              onBlur={(e) => e.target.style.borderColor = S.border}
              required
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "8px", fontSize: "13px", color: S.muted, fontWeight: "500" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", padding: "12px 16px", boxSizing: "border-box",
                backgroundColor: "rgba(0,0,0,0.2)", border: `1px solid ${S.border}`,
                borderRadius: "6px", color: S.white, outline: "none", fontSize: "14px",
                transition: "border-color 0.2s"
              }}
              onFocus={(e) => e.target.style.borderColor = S.cyan}
              onBlur={(e) => e.target.style.borderColor = S.border}
              required
            />
          </div>

          {error && <p style={{ color: S.red, fontSize: "13px", backgroundColor: "rgba(239, 68, 68, 0.1)", padding: "8px 12px", borderRadius: "4px", border: `1px solid rgba(239, 68, 68, 0.2)` }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="button-hover"
            style={{
              width: "100%", padding: "14px", boxSizing: "border-box",
              backgroundColor: S.cyan, color: "#111",
              fontWeight: "600", borderRadius: "6px",
              border: "none", opacity: loading ? 0.7 : 1,
              marginTop: "4px", cursor: "pointer", fontSize: "14px",
              boxShadow: `0 4px 14px rgba(0, 200, 220, 0.2)`
            }}
          >
            {loading ? "Authenticating..." : (isSignUp ? "Sign Up" : "Sign In")}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "16px" }}>
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: "none", border: "none", color: S.cyan,
              textDecoration: "underline", cursor: "pointer", fontSize: "14px"
            }}
          >
            {isSignUp ? "Already have an account? Sign In" : "Need an account? Sign Up"}
          </button>
        </div>

        <div style={{ margin: "24px 0", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: S.border }} />
          <span style={{ padding: "0 12px", color: S.muted, fontSize: "14px" }}>OR</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: S.border }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="button-hover"
          style={{
            width: "100%", padding: "12px", boxSizing: "border-box",
            backgroundColor: "transparent", color: S.white,
            fontWeight: "500", borderRadius: "6px",
            border: `1px solid ${S.border}`, opacity: loading ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
            cursor: "pointer", fontSize: "14px", transition: "background-color 0.2s"
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {isSignUp ? "Sign up with Google" : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}
