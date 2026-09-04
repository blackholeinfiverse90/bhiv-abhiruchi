import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import ApiClient from "../lib/apiClient";

export default function StudentRedirect({ children }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function checkStudentStatus() {
      if (isLoading) {
        return;
      }

      if (!isAuthenticated || !user) {
        setIsChecking(false);
        return;
      }

      try {
        const hasIntakeData = Boolean(
          (user?.intake_data && Object.keys(user.intake_data).length > 0) ||
          user?.field_of_study ||
          localStorage.getItem('background_selection') ||
          (user?.id && localStorage.getItem('gurukul_intake_' + user.id))
        );
        const currentPath = location.pathname;
        
        if ((currentPath === "/" || currentPath === "/home") && !hasIntakeData) {
          navigate("/intake", { replace: true });
          return;
        }

        if (currentPath === "/assignment" && !hasIntakeData) {
          navigate("/intake", { replace: true });
          return;
        }

        if (currentPath === "/dashboard" && !hasIntakeData) {
          navigate("/intake", { replace: true });
          return;
        }
      } catch (err) {
        console.error("Error in student redirect check:", err);
      } finally {
        setIsChecking(false);
      }
    }

    checkStudentStatus();
  }, [user, isAuthenticated, isLoading, navigate, location.pathname]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        <span className="ml-3 text-white/70">Checking your progress...</span>
      </div>
    );
  }

  return children;
}