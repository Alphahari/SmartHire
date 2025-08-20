"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();
  // const authStore = {
  //   isAuthenticated: false,
  //   canAccessAdmin: false
  // };

  // useEffect(() => {
  //   if (authStore.isAuthenticated) {
  //     if (authStore.canAccessAdmin) {
  //       router.push("/admin/dashboard");
  //     } else {
  //       router.push("/dashboard");
  //     }
  //   }
  // }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center px-6">
      <div className="text-center max-w-md w-full space-y-8">
        <h1 className="text-4xl font-extrabold text-gray-800">
          Welcome to Our App
        </h1>
        <p className="text-gray-600 text-lg">
          Your journey starts here. Join us today.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition duration-200 shadow"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 transition duration-200"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
