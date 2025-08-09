// pages/index.tsx
import { useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();

  // Simulated auth store (replace with your real logic)
  const authStore = {
    isAuthenticated: false,
    canAccessAdmin: false
  };

  useEffect(() => {
    if (authStore.isAuthenticated) {
      if (authStore.canAccessAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, []);

  return (
    <div className="landing-page">
      <h1>Welcome to Our App</h1>
      <div className="button-group">
        <Link href="/login" className="btn">Login</Link>
        <Link href="/register" className="btn">Register</Link>
      </div>

      <style jsx>{`
        .landing-page {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          text-align: center;
          background: #f8f9fa;
          font-family: sans-serif;
        }
        .button-group {
          margin-top: 20px;
          display: flex;
          gap: 20px;
        }
        .btn {
          padding: 10px 20px;
          background-color: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          transition: background-color 0.3s ease;
        }
        .btn:hover {
          background-color: #0056b3;
        }
      `}</style>
    </div>
  );
}
