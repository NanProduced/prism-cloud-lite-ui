import { useNavigate } from "react-router-dom";
import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import { Toaster } from "sonner";

interface AuthPageProps {
  page: "login" | "register";
}

export default function AuthPage({ page }: AuthPageProps) {
  const navigate = useNavigate();

  const handleNavigate = (target: "login" | "register") => {
    navigate("/" + target);
  };

  return (
    <div className="w-full h-screen bg-[#131619] flex items-center justify-center p-4">
      {page === "login" ? (
        <LoginPage onNavigate={handleNavigate} />
      ) : (
        <RegisterPage onNavigate={handleNavigate} />
      )}
      <Toaster position="top-center" theme="dark" />
    </div>
  );
}
