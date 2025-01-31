import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { useSetAtom } from "jotai";
import { userAuthAtom } from "@/lib/atoms";

export const Route = createLazyFileRoute("/login")({
  component: LoginComponent,
});

function LoginComponent() {
  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleInputChange = (name, value) => {
    setCredentials((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const { mutateAsync: loginUser, isPending: loginIsPending } = useMutation({
    mutationFn: async (user_input) => {
      const response = await fetch("http://127.0.0.1:5000/api/login", {
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({ ...user_input }),
      });
      const data = await response.json();
      return data;
    },
  });

  const navigate = useNavigate();
  const setUserAuth = useSetAtom(userAuthAtom);

  const handleLogin = async () => {
    try {
      const response = await loginUser(credentials);
      setUserAuth({ token: response.access_token, userId: response.user_id });
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Side - Image */}
      <div className="w-1/2 relative overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1585506942812-e72b29cef752?q=80&w=1928&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Login"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right Side - Login Form */}
      <div className="w-1/4 p-8 flex flex-col justify-center mx-auto">
        <h2 className="text-3xl font-bold mb-8">Welcome Back</h2>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}>
          <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={credentials.email}
            onChange={(e) => handleInputChange("email", e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Enter your email"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type="password"
            value={credentials.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Enter your password"
          />
        </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              !credentials.email || !credentials.password || loginIsPending
            }
          >
            Login
          </Button>
        </form>
      </div>
    </div>
  );
}
