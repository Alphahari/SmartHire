// pages/login.tsx
import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/router";

interface LoginForm {
  email: string;
  password: string;
}

export default function Login() {
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>({ email: "", password: "" });
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Simulated authentication store (replace with your real auth logic)
  const authStore = {
    isAuthenticated: false,
    canAccessAdmin: false,
    login: async (credentials: LoginForm) => {
      // Replace with API request
      if (credentials.email === "admin@example.com" && credentials.password === "admin") {
        authStore.isAuthenticated = true;
        authStore.canAccessAdmin = true;
      } else if (credentials.email === "user@example.com" && credentials.password === "user") {
        authStore.isAuthenticated = true;
        authStore.canAccessAdmin = false;
      } else {
        throw new Error("Invalid credentials");
      }
    },
    fetchUser: async () => {
      // Fetch user details from API
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await authStore.login(form);
      await authStore.fetchUser();
      if (authStore.canAccessAdmin) {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      setErrorMessage(error.message || "Invalid credentials. Please try again.");
    }
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
    <div className="container mt-5">
      <div className="row justify-content-center">
        <form onSubmit={handleLogin} className="col-md-6">
          <div className="form-group mb-3">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group mb-3">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">Login</button>
          <p className="mt-3 text-center">
            Don&apos;t have an account?{" "}
            <a href="/register">Register Now</a>
          </p>
          {errorMessage && (
            <div className="alert alert-danger mt-3 text-center">
              {errorMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
