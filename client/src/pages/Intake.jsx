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

const APPROVED_INSTITUTES = [
  { code: 'MSSU', name: 'MSSU - Maharashtra State Skills University' },
  { code: 'DYP-A', name: 'DYP-A - D.Y. Patil Akurdi' },
  { code: 'SIT-S', name: 'SIT-S - Symbiosis Institute of Technology' },
  { code: 'SIPS-S', name: 'SIPS-S - Sandip Institute of Pharmaceutical Sciences' },
  { code: 'VJTI', name: 'VJTI - Veermata Jijabai Technological Institute' }
];

function Intake() {
  const { user, updateUser } = useAuth();
  const { t } = useI18n();
  const [mintedCandidateId, setMintedCandidateId] = useState("");
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [formConfig, setFormConfig] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentFormConfig, setCurrentFormConfig] = useState(null);

  const isInstituteLocked = Boolean(mintedCandidateId && formData.institute_code);

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

            const studentDoc = profileRes?.data;
            if (studentDoc && (studentDoc.intake_data && Object.keys(studentDoc.intake_data).length > 0 || studentDoc.institute_code)) {
              setIsEditing(true);
              const existingForm = {
                ...(studentDoc.intake_data || {}),
                name: studentDoc.full_name || user?.full_name || "",
                email: studentDoc.email || userEmail || "",
                institute_code: studentDoc.institute_code || studentDoc.intake_data?.institute_code || "",
              };
              setFormData(existingForm);
              if (studentDoc.candidate_id) {
                setMintedCandidateId(studentDoc.candidate_id);
              }
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

    async function submit(dynamicFormData) {
    if (!user) {
      setError("User not authenticated");
      return;
    }

    // Merge parent formData (holding institute_code) with dynamic form inputs
    const mergedData = {
      ...formData,
      ...(dynamicFormData || {}),
      institute_code: formData.institute_code || dynamicFormData?.institute_code
    };

    if (!mergedData.institute_code) {
      setError("Please select your Institute before submitting.");
      toast.error("Please select your Institute before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("Submitting merged intake data:", mergedData);

      const intakePayload = {
        user_id: user.id,
        email: mergedData.email || user?.email || "",
        full_name: mergedData.name || user?.full_name || "",
        institute_code: mergedData.institute_code,
        field_of_study: mergedData.field_of_study || "stem",
        selected_domains: mergedData.selected_domains || [],
        intake_data: {
          ...mergedData,
          field_of_study: mergedData.field_of_study,
          class_level: mergedData.class_level,
          learning_goals: mergedData.learning_goals,
          institute_code: mergedData.institute_code
        }
      };

      const intakeRes = await ApiClient.post('/students/intake', intakePayload);
      const minted = intakeRes?.candidate_id || intakeRes?.data?.candidate_id;
      if (minted) {
        setMintedCandidateId(minted);
      }

      // Store in localStorage for instant offline/redirect availability
      const bgSelection = {
        fieldOfStudy: mergedData.field_of_study || 'stem',
        classLevel: mergedData.class_level || 'undergraduate',
        learningGoals: mergedData.learning_goals || 'Assessment'
      };
      localStorage.setItem('background_selection', JSON.stringify(bgSelection));
      localStorage.setItem('gurukul_intake_' + user.id, JSON.stringify(mergedData));

      // Update AuthContext user state immediately
      if (updateUser) {
        updateUser({
          intake_data: intakePayload.intake_data,
          field_of_study: intakePayload.field_of_study,
          institute_code: mergedData.institute_code
        });
      }

      setFormData(mergedData);

      if (isEditing) {
        setSuccess("Profile and institute affiliation updated successfully!");
        toast.success("Profile and institute updated successfully!");
        // DO NOT start assignment when editing profile! Navigate to dashboard
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
        return;
      }

      setSuccess(`Assessment intake submitted! Canonical ID: ${minted || 'Issued'}`);
      toast.success(`Canonical ID Issued: ${minted || 'Enrolled'}! Redirecting to Dashboard...`, { duration: 3000 });

      // Navigate to dashboard where user can choose when to start assignment
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
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
          {t('intake.backToDashboard') || 'Back to Dashboard'}
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

      {/* Canonical Institute Selector Card */}
      <div className="mb-8 rounded-3xl border border-white/15 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-orange-500/15 transition-all duration-500"></div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 text-base shadow-sm">
              🏛️
            </span>
            <div>
              <label htmlFor="institute_select" className="text-sm font-semibold tracking-wide text-white">
                Select Your Institute
              </label>
              <span className="ml-2 text-[11px] font-medium uppercase tracking-wider text-orange-400/90 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                Mandatory for BHIV Enrolment
              </span>
            </div>
          </div>
          {formData.institute_code && (
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full self-start sm:self-auto border ${
              isInstituteLocked
                ? "text-blue-300 bg-blue-500/15 border-blue-500/30"
                : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
            }`}>
              {isInstituteLocked ? (
                <>🔒 {APPROVED_INSTITUTES.find(i => i.code === formData.institute_code)?.code || formData.institute_code} (Locked)</>
              ) : (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {APPROVED_INSTITUTES.find(i => i.code === formData.institute_code)?.code || formData.institute_code} Selected
                </>
              )}
            </span>
          )}
        </div>

        <p className="text-xs text-white/60 mb-4 leading-relaxed">
          Please select your affiliated college or university. Your canonical Candidate ID will be generated with this institution code.
        </p>

        <div className="relative">
          <select
            id="institute_select"
            disabled={isInstituteLocked}
            value={formData.institute_code || ""}
            onChange={(e) => handleFieldChange("institute_code", e.target.value, { ...formData, institute_code: e.target.value })}
            className={`w-full rounded-2xl border px-4 py-3.5 pr-10 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 appearance-none ${
              isInstituteLocked
                ? "bg-slate-950/60 border-white/10 text-white/70 cursor-not-allowed opacity-75"
                : !formData.institute_code
                ? "bg-slate-950/90 border-amber-500/40 text-amber-200/90 focus:border-orange-400 focus:ring-orange-400/20 shadow-[0_0_15px_rgba(245,158,11,0.08)] cursor-pointer"
                : "bg-slate-950/90 border-white/20 text-white focus:border-emerald-400 focus:ring-emerald-400/20 cursor-pointer"
            }`}
            style={{ backgroundColor: isInstituteLocked ? "#070b14" : "#0b0f19", color: "#f8fafc" }}
          >
            <option value="" disabled style={{ backgroundColor: "#0b0f19", color: "#94a3b8" }}>
              -- Choose your Institute (Required) --
            </option>
            {APPROVED_INSTITUTES.map((inst) => (
              <option
                key={inst.code}
                value={inst.code}
                style={{ backgroundColor: "#0b0f19", color: "#f8fafc" }}
              >
                {inst.name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-white/50">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {!formData.institute_code ? (
          <p className="mt-2.5 text-[11px] font-medium text-amber-300/80 flex items-center gap-1.5">
            <span>⚠️</span> Please select an institute above before submitting your intake form.
          </p>
        ) : isInstituteLocked ? (
          <p className="mt-2.5 text-[11px] font-medium text-blue-300/80 flex items-center gap-1.5">
            <span>🔒</span> Institution Affiliation is permanently locked to your Candidate ID. Contact administrator for transfer requests.
          </p>
        ) : (
          <p className="mt-2.5 text-[11px] font-medium text-emerald-300/80 flex items-center gap-1.5">
            <span>ℹ️</span> First-time enrollment: Once submitted, your chosen institute will be permanently locked.
          </p>
        )}
      </div>

      {mintedCandidateId && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-400/40 rounded-2xl text-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
          <div>
            <span className="text-sm font-medium">🎓 Canonical Candidate ID Issued: <strong className="font-mono text-white text-base ml-1">{mintedCandidateId}</strong></span>
            <div className="text-xs text-emerald-300/80 mt-1">Enrolment registered with Sampada & Hackaverse ecosystem.</div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-500/30 text-emerald-200 px-2.5 py-1 rounded-full font-semibold border border-emerald-400/30">VERIFIED</span>
            {(formData.email || user?.email) && (
              <a
                href={`${import.meta.env.VITE_PRAVESH_URL || "http://localhost:5174"}/login?email=${encodeURIComponent(formData.email || user?.email || "")}&auto=true`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:opacity-90 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 border border-white/20 hover:scale-105"
                title="Launch Pravesh with your enrolled email"
              >
                <span>⚡</span>
                <span>Open Pravesh</span>
              </a>
            )}
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
