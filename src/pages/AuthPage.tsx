import { useState } from "react";
import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import { Toaster } from "sonner";

export default function AuthPage() {
  const [currentPage, setCurrentPage] = useState<"login" | "register">("login");

  const handleNavigate = (page: "login" | "register") => {
    setCurrentPage(page);
  };

  return (
    <div className="w-full h-screen bg-[#131619] flex items-center justify-center p-4">
      {currentPage === "login" ? (
        <LoginPage onNavigate={handleNavigate} />
      ) : (
        <RegisterPage onNavigate={handleNavigate} />
      )}
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
