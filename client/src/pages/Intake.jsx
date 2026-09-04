import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase, SUPABASE_TABLE } from "../lib/supabaseClient";
import ApiClient from "../lib/apiClient";
import { useNavigate, Link } from "react-router-dom";
import DynamicForm from "../components/DynamicForm";
import { FormConfigService } from "../lib/formConfigService";
import { ArrowLeft } from 'lucide-react';
import { useI18n } from "../lib/i18n";
import toast from 'react-hot-toast';

function Intake() {
  const { user, updateUser } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formConfig, setFormConfig] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentFormConfig, setCurrentFormConfig] = useState(null);

  useEffect(() => {
    async function loadFormConfigAndProfile() {
      try {
        let config = await FormConfigService.getActiveFormConfig() || { fields: [] };
        setFormConfig(config);
        setCurrentFormConfig(config);

        const userEmail = user?.email;
        const initialFormData = {
          name: user?.full_name || "",
          email: userEmail || "",
        };

        if (user?.id) {
          try {
            const profileRes = await ApiClient.get(`/students/profile/${user.id}`);
            const savedIntakeStr = localStorage.getItem('gurukul_intake_' + user.id) || localStorage.getItem('background_selection');

            if (profileRes && profileRes.data && profileRes.data.intake_data && Object.keys(profileRes.data.intake_data).length > 0) {
              setIsEditing(true);
              const existingForm = {
                ...profileRes.data.intake_data,
                name: profileRes.data.full_name || user?.full_name || "",
                email: profileRes.data.email || userEmail || "",
              };
              setFormData(existingForm);
            } else if (savedIntakeStr) {
              setIsEditing(true);
              const parsed = JSON.parse(savedIntakeStr);
              setFormData({ ...initialFormData, ...parsed });
            } else {
              setIsEditing(false);
              setFormData(initialFormData);
            }
          } catch {
            const savedIntakeStr = localStorage.getItem('gurukul_intake_' + user.id) || localStorage.getItem('background_selection');
            if (savedIntakeStr) {
              setIsEditing(true);
              const parsed = JSON.parse(savedIntakeStr);
              setFormData({ ...initialFormData, ...parsed });
            } else {
              setIsEditing(false);
              setFormData(initialFormData);
            }
          }
        }
      } catch (err) {
        console.error("Error loading form config or profile:", err);
        setError("Failed to load form configuration");
      } finally {
        setLoadingProfile(false);
      }
    }

    if (user) {
      loadFormConfigAndProfile();
    }
  }, [user]);

  const handleFieldChange = (fieldName, fieldValue, updatedFormData) => {
    setFormData(updatedFormData);
  };

  async function submit(formData) {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Submitting form data:", formData);

      const intakePayload = {
        user_id: user.id,
        email: formData.email || user?.email || "",
        full_name: formData.name || user?.full_name || "",
        field_of_study: formData.field_of_study || "stem",
        selected_domains: formData.selected_domains || [],
        intake_data: {
          ...formData,
          field_of_study: formData.field_of_study,
          class_level: formData.class_level,
          learning_goals: formData.learning_goals
        }
      };

      await ApiClient.post('/students/intake', intakePayload);

      // Store in localStorage for instant offline/redirect availability
      const bgSelection = {
        fieldOfStudy: formData.field_of_study || 'stem',
        classLevel: formData.class_level || 'undergraduate',
        learningGoals: formData.learning_goals || 'Assessment'
      };
      localStorage.setItem('background_selection', JSON.stringify(bgSelection));
      localStorage.setItem('gurukul_intake_' + user.id, JSON.stringify(formData));

      // Update AuthContext user state immediately
      if (updateUser) {
        updateUser({
          intake_data: intakePayload.intake_data,
          field_of_study: intakePayload.field_of_study
        });
      }

      setSuccess(
        isEditing
          ? "Profile updated successfully!"
          : "Assessment intake submitted successfully!"
      );

      toast.success(
        isEditing
          ? "Your profile has been updated!"
          : "Your intake info has been saved!"
      );

      setTimeout(() => {
        navigate("/assignment");
      }, 1000);
    } catch (err) {
      console.error("Submission error:", err);
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p>{t('intake.loadingForm')}</p>
        </div>
      </div>
    );
  }

  if (!currentFormConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-center">
          <p>{t('intake.formConfigNotAvailable')}</p>
          <Link to="/dashboard" className="text-orange-400 hover:text-orange-300 mt-2 inline-block">
            {t('intake.returnToDashboard')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fadeIn">
      {/* Header section */}
      <div className="mb-8">
        <Link 
          to="/dashboard" 
          className="inline-flex items-center text-sm text-white/70 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.backToDashboard')}
        </Link>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-orange-100 to-amber-200 bg-clip-text text-transparent mb-2">
          {isEditing ? t('intake.editYourProfile') : t('intake.welcomeToGurukul')}
        </h1>
        <p className="text-white/70 text-sm sm:text-base">
          {isEditing 
            ? t('intake.updateInfo') 
            : t('intake.tellUsAboutYou')
          }
        </p>
      </div>

      {/* Error and Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/15 border border-red-500/30 rounded-2xl text-red-200 text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}
      
      {success && (
        <div className="mb-6 p-4 bg-green-500/15 border border-green-500/30 rounded-2xl text-green-200 text-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <span>✅</span>
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Dynamic Form Container */}
      <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <DynamicForm
          config={currentFormConfig}
          onSubmit={submit}
          initialData={formData}
          isLoading={loading}
          onFieldChange={handleFieldChange}
          isEditing={isEditing}
          submitButtonText={isEditing ? "Update Intake" : "Submit Intake"}
        />
      </div>
    </div>
  );
}

export default Intake;
