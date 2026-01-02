import { useNavigate } from "react-router-dom";
import LoginPage from "./auth/LoginPage";
import RegisterPage from "./auth/RegisterPage";
import ForgotPasswordPage from "./auth/ForgotPasswordPage";

interface AuthPageProps {
  page: "login" | "register" | "forgot-password";
}

export default function AuthPage({ page }: AuthPageProps) {
  const navigate = useNavigate();

  const handleNavigate = (target: "login" | "register" | "forgot-password") => {
    navigate("/" + target);
  };

  const renderPage = () => {
    switch (page) {
      case "login":
        return <LoginPage onNavigate={handleNavigate} />;
      case "register":
        return <RegisterPage onNavigate={handleNavigate} />;
      case "forgot-password":
        return <ForgotPasswordPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="w-full h-screen bg-background flex items-center justify-center p-4">
      {renderPage()}
    </div>
  );
}
