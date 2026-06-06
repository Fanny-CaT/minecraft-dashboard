const fs = require('fs');

let page = fs.readFileSync('app/page.tsx', 'utf8');

// The block we injected previously:
const oldInject = `  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const [userRole, setUserRole] = useState<string>("loading");
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  
  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
      } else {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserRole(data.role || "pending");
          setUserPermissions(data.permissions || []);
        } else {
          setUserRole("pending");
        }
      }
    });
    return () => unsubscribe();
  }, [router]);`;

const newClean = `  const [mounted, setMounted] = useState(false);
  const { user, role, permissions } = useAuth();
  
  useEffect(() => {
    setMounted(true);
  }, []);`;

page = page.replace(oldInject, newClean);

// The old pending screen we injected
const oldPending = `  if (!mounted) return null;
  
  if (userRole === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: S.bg, color: S.white }}>
        <p>Loading your profile...</p>
      </div>
    );
  }
  
  if (userRole === "pending") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ backgroundColor: S.bg, color: S.white }}>
        <div style={{ padding: "40px", backgroundColor: S.content, borderRadius: "8px", border: \`1px solid \${S.border}\`, textAlign: "center", maxWidth: "400px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "16px", color: S.red }}>Access Pending</h2>
          <p style={{ color: S.muted, marginBottom: "24px" }}>
            Your account has been created, but an administrator needs to approve your access before you can view the dashboard.
          </p>
          <button onClick={() => auth.signOut()} style={{ padding: "10px 20px", backgroundColor: S.sidebar, color: S.white, border: \`1px solid \${S.border}\`, borderRadius: "4px", cursor: "pointer" }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }`;

const newMounted = `  if (!mounted) return null;`;

page = page.replace(oldPending, newMounted);

// Add useAuth import
page = page.replace('import { onAuthStateChanged } from "firebase/auth";\nimport { useRouter } from "next/navigation";', 'import { useAuth } from "@/components/AuthProvider";');

fs.writeFileSync('app/page.tsx', page);
console.log("Cleaned page.tsx");
