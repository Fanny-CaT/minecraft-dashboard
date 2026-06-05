"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, User } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { S } from "@/lib/constants";

export default function LoginPage() {
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
          createdAt: new Date().toISOString()
        });
      }
      router.push("/");
    } catch (e) {
      console.error("Failed to setup user profile", e);
      router.push("/");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await handlePostLogin(cred.user);
    } catch (err: any) {
      setError(err.message || "Failed to login");
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
        width: "100%", maxWidth: "400px", padding: "32px",
        backgroundColor: S.content, borderRadius: "8px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
        border: `1px solid ${S.border}`
      }}>
        <div className="text-center mb-8">
          <h1 style={{ fontSize: "24px", fontWeight: "bold", color: S.white }}>MeowTopia Panel</h1>
          <p style={{ color: S.muted, marginTop: "8px" }}>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              style={{
                width: "100%", padding: "12px 16px",
                backgroundColor: S.sidebar, border: `1px solid ${S.inputBdr}`,
                borderRadius: "4px", color: S.white, outline: "none"
              }}
              required
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={{
                width: "100%", padding: "12px 16px",
                backgroundColor: S.sidebar, border: `1px solid ${S.inputBdr}`,
                borderRadius: "4px", color: S.white, outline: "none"
              }}
              required
            />
          </div>

          {error && <p style={{ color: S.red, fontSize: "14px" }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px",
              backgroundColor: S.cyan, color: "#fff",
              fontWeight: "bold", borderRadius: "4px",
              border: "none", opacity: loading ? 0.7 : 1,
              marginTop: "8px"
            }}
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        <div style={{ margin: "24px 0", display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: S.border }} />
          <span style={{ padding: "0 12px", color: S.muted, fontSize: "14px" }}>OR</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: S.border }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: "100%", padding: "12px",
            backgroundColor: S.white, color: "#000",
            fontWeight: "bold", borderRadius: "4px",
            border: "none", opacity: loading ? 0.7 : 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
