"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { S } from "@/lib/constants";
import { useAuth } from "@/components/AuthProvider";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  permissions: string[];
  createdAt: string;
}

export function PanelUsersTab() {
  const { role } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      const usersList: UserProfile[] = [];
      querySnapshot.forEach((doc) => {
        usersList.push({ id: doc.id, ...doc.data() } as UserProfile);
      });
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === "admin") {
      fetchUsers();
    }
  }, [role]);

  const handleRoleChange = (id: string, newRole: string) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, role: newRole } : u)));
  };

  const handlePermissionToggle = (id: string, perm: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        let newPerms = [...u.permissions];
        if (newPerms.includes(perm)) {
          newPerms = newPerms.filter((p) => p !== perm);
        } else {
          newPerms.push(perm);
        }
        // If "all" is checked, just make it ["all"]
        if (perm === "all" && newPerms.includes("all")) {
          newPerms = ["all"];
        } else if (perm !== "all" && newPerms.includes("all")) {
          newPerms = newPerms.filter((p) => p !== "all");
        }
        return { ...u, permissions: newPerms };
      })
    );
  };

  const handleSaveUser = async (user: UserProfile) => {
    setSavingId(user.id);
    try {
      await setDoc(doc(db, "users", user.id), {
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        createdAt: user.createdAt,
      });
      // Optionally show a toast here
    } catch (e) {
      console.error("Failed to save user", e);
    } finally {
      setSavingId(null);
    }
  };

  if (role !== "admin") {
    return (
      <div style={{ padding: "20px", color: S.red }}>
        You do not have permission to view this tab.
      </div>
    );
  }

  const PERMISSION_OPTIONS = ["all", "console", "files", "power", "config"];

  return (
    <div style={{ padding: "20px", color: S.white, flex: 1, overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>Panel Access Management</h2>
        <button
          onClick={fetchUsers}
          disabled={loading}
          style={{
            backgroundColor: S.sidebar,
            border: `1px solid ${S.border}`,
            color: S.white,
            padding: "6px 12px",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: S.muted, padding: "40px" }}>Loading users...</div>
      ) : (
        <div style={{ border: `1px solid ${S.border}`, borderRadius: "4px", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead style={{ backgroundColor: S.sidebar, borderBottom: `1px solid ${S.border}` }}>
              <tr>
                <th style={{ padding: "12px", color: S.muted, fontWeight: "normal", fontSize: "12px" }}>EMAIL</th>
                <th style={{ padding: "12px", color: S.muted, fontWeight: "normal", fontSize: "12px" }}>ROLE</th>
                <th style={{ padding: "12px", color: S.muted, fontWeight: "normal", fontSize: "12px" }}>PERMISSIONS</th>
                <th style={{ padding: "12px", color: S.muted, fontWeight: "normal", fontSize: "12px" }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} style={{ borderBottom: `1px solid ${S.border}` }}>
                  <td style={{ padding: "12px", fontSize: "14px" }}>{user.email}</td>
                  <td style={{ padding: "12px" }}>
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      style={{
                        backgroundColor: S.bg,
                        border: `1px solid ${S.inputBdr}`,
                        color: S.white,
                        padding: "4px 8px",
                        borderRadius: "4px",
                        outline: "none",
                      }}
                    >
                      <option value="pending">Pending</option>
                      <option value="admin">Admin</option>
                      <option value="guest">Guest</option>
                    </select>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {PERMISSION_OPTIONS.map((perm) => (
                        <label key={perm} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: S.muted }}>
                          <input
                            type="checkbox"
                            checked={user.permissions?.includes(perm) || false}
                            onChange={() => handlePermissionToggle(user.id, perm)}
                          />
                          {perm.toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: "12px" }}>
                    <button
                      onClick={() => handleSaveUser(user)}
                      disabled={savingId === user.id}
                      style={{
                        backgroundColor: savingId === user.id ? S.muted : S.cyan,
                        color: "#000",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: "4px",
                        fontWeight: "bold",
                        cursor: "pointer",
                        fontSize: "12px",
                      }}
                    >
                      {savingId === user.id ? "Saving..." : "Save"}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "20px", textAlign: "center", color: S.muted }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
