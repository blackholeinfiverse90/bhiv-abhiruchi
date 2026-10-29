import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from 'react-dom';
import { Trash2, Download, FileText, Sparkles, Bot } from 'lucide-react';
import toast from "react-hot-toast";
import FormBuilder from "../components/FormBuilder";
import QuestionBankManager from "../components/QuestionBankManager";
import StudentAnalytics from "../components/StudentAnalytics";
import DatabaseTest from "../components/DatabaseTest";
import CategoryManager from "../components/CategoryManager";
import QuestionCategoryManager from "../components/QuestionCategoryManager";
import AIModelConfig from "../components/AIModelConfig";
import { adminAuth } from "../config/admin";
import { FormConfigService } from "../lib/formConfigService";
import { supabase, SUPABASE_TABLE } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";
import ApiClient from "../lib/apiClient";
import ExportService from "../lib/exportService";

const EmptyState = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center text-white">
    <h2 className="text-2xl font-semibold">No records yet</h2>
    <p className="text-white/70 mt-2">Add your first student to get started.</p>
    <button
      onClick={onAdd}
      className="mt-6 inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
    >
      Add Student
    </button>
  </div>
);

function AdminLogin({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");

    // Check admin credentials against Supabase
    const { success, error: loginError } = await adminAuth.login(
      username,
      password
    );

    if (success) {
      toast.success("Welcome to Admin Panel");
      onSuccess();
    } else {
      toast.error(loginError || "Invalid credentials. Please try again.");
      setError(loginError || "Invalid credentials");
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-white/20 bg-white/10 p-4 space-y-3"
    >
      {error && (
        <div className="rounded-md border border-red-400/30 bg-red-500/15 p-2 text-red-200 text-sm">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm text-white/80">Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          placeholder="Enter username"
        />
      </div>
      <div>
        <label className="block text-sm text-white/80">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md bg-white/10 border border-white/20 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          placeholder="Enter password"
        />
      </div>
      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          className="rounded-md bg-orange-500 px-4 py-2 text-sm text-white hover:bg-orange-600"
        >
          Login
        </button>
      </div>
    </form>
  );
}

const initialForm = {
  id: "",
  user_id: "",
  name: "",
  email: "",
  student_id: "",
  grade: "",
  tier: "",
  // Responses fields
  age: "",
  phone: "",
  education_level: "",
  field_of_study: "",
  current_skills: "",
  interests: "",
  goals: "",
  preferred_learning_style: "",
  availability_per_week_hours: "",
  experience_years: "",
};

export default function Admin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(
    () => sessionStorage.getItem("is_admin") === "1" || user?.role === "admin"
  );

  useEffect(() => {
    if (user?.role === "admin") {
      sessionStorage.setItem("is_admin", "1");
      setIsAdmin(true);
    }
  }, [user]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [isEditing, setIsEditing] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const portalRootRef = useRef(null);
  
  useEffect(() => {
    // Create a portal root element if it doesn't exist
    const portalRoot = document.getElementById('portal-root');
    if (!portalRoot) {
      const newPortalRoot = document.createElement('div');
      newPortalRoot.id = 'portal-root';
      document.body.appendChild(newPortalRoot);
      portalRootRef.current = newPortalRoot;
    } else {
      portalRootRef.current = portalRoot;
    }
    
    // Cleanup
    return () => {
      if (portalRootRef.current && !document.getElementById('portal-root')) {
        document.body.removeChild(portalRootRef.current);
      }
    };
  }, []);

  // Form configuration management
  const [activeTab, setActiveTab] = useState("students");
  const [formConfigs, setFormConfigs] = useState([]);
  const [, setActiveFormConfig] = useState(null);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editingFormConfig, setEditingFormConfig] = useState(null);

  // Saved configs management
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [configToActivate, setConfigToActivate] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [configToDelete, setConfigToDelete] = useState(null);

  // Student delete confirmation
  const [studentDeleteConfirm, setStudentDeleteConfirm] = useState(null);

  const filtered = useMemo(() => {
    let list = [...students];
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) =>
        [s.name, s.grade, s.candidate_id, s.student_id, s.email, s.institute_code]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(q))
      );
    }
    // Sort: Whoever has updated/selected their institute appears at the TOP
    return list.sort((a, b) => {
      const aHasInst = Boolean(a.institute_code || a.candidate_id);
      const bHasInst = Boolean(b.institute_code || b.candidate_id);
      if (aHasInst && !bHasInst) return -1;
      if (!aHasInst && bHasInst) return 1;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });
  }, [students, search]);

  async function fetchStudents() {
    setLoading(true);
    setError("");

    let studentList = [];

    // 1. Try MERN Express API
    try {
      const res = await ApiClient.get('/students');
      const list = res?.data || res?.students || (Array.isArray(res) ? res : []);
      if (Array.isArray(list) && list.length > 0) {
        studentList = list;
      }
    } catch (err) {
      console.warn('ApiClient /students fetch failed, falling back to Supabase:', err.message);
    }

    // 2. Fallback to Supabase if MERN API returned empty
    if (studentList.length === 0) {
      const { data, error: err } = await supabase
        .from(SUPABASE_TABLE)
        .select("*")
        .order("created_at", { ascending: false });

      if (err) setError(err.message);
      if (data) studentList = data;
    }

    setStudents(studentList);
    setLoading(false);
  }

  useEffect(() => {
    if (isAdmin) {
      fetchStudents();
      fetchFormConfigs();
    }
  }, [isAdmin]);

  // Form configuration functions
  async function fetchFormConfigs() {
    try {
      const configs = await FormConfigService.getAllFormConfigs();
      setFormConfigs(configs);

      const active = await FormConfigService.getActiveFormConfig();
      setActiveFormConfig(active);
    } catch (err) {
      console.error("Error fetching form configs:", err);
    }
  }

  function openFormBuilder(config = null) {
    setEditingFormConfig(config);
    setShowFormBuilder(true);
  }

  function closeFormBuilder() {
    setShowFormBuilder(false);
    setEditingFormConfig(null);
  }

  async function handleFormConfigSave() {
    await fetchFormConfigs();
    closeFormBuilder();
    setError("");
    // The FormBuilder component already shows the success toast
  }

  async function deleteFormConfig(configId) {
    if (!confirm("Delete this form configuration?")) return;

    const loadingToast = toast.loading("Deleting form configuration...");

    try {
      await FormConfigService.deleteFormConfig(configId);
      await fetchFormConfigs();
      toast.success("Form configuration deleted successfully", {
        id: loadingToast,
      });
    } catch (err) {
      toast.error(err.message || "Failed to delete form configuration", {
        id: loadingToast,
      });
      setError(err.message || "Failed to delete form configuration");
    }
  }

  // Saved configs management functions
  function openActivateModal(config) {
    setConfigToActivate(config);
    setShowActivateModal(true);
  }

  function closeActivateModal() {
    setConfigToActivate(null);
    setShowActivateModal(false);
  }

  async function activateConfig() {
    if (!configToActivate) return;

    const loadingToast = toast.loading("Activating configuration...");

    try {
      await FormConfigService.activatePreset(configToActivate.id);
      await fetchFormConfigs();
      toast.success(`"${configToActivate.name}" is now active`, {
        id: loadingToast,
      });
      closeActivateModal();
    } catch (err) {
      toast.error(err.message || "Failed to activate configuration", {
        id: loadingToast,
      });
      setError(err.message || "Failed to activate configuration");
    }
  }

  function openDeleteModal(config) {
    setConfigToDelete(config);
    setShowDeleteModal(true);
  }

  function closeDeleteModal() {
    setConfigToDelete(null);
    setShowDeleteModal(false);
  }

  async function deleteConfig() {
    if (!configToDelete) return;

    const loadingToast = toast.loading("Deleting configuration...");

    try {
      await FormConfigService.deleteFormConfig(configToDelete.id);
      await fetchFormConfigs();
      toast.success(`"${configToDelete.name}" deleted successfully`, {
        id: loadingToast,
      });
      closeDeleteModal();
    } catch (err) {
      toast.error(err.message || "Failed to delete configuration", {
        id: loadingToast,
      });
      setError(err.message || "Failed to delete configuration");
    }
  }

  function openAdd() {
    setForm(initialForm);
    setIsEditing(false);
    setDrawerOpen(true);
  }

  function openEdit(s) {
    console.log('🛠️ Opening edit for student:', s);
    console.log('📋 Student responses data:', s.responses);
    
    const responses = s.responses || {};
    const formData = {
      id: s.id,
      user_id: s.user_id || "",
      name: s.name || "",
      email: s.email || "",
      student_id: s.student_id || "",
      grade: s.grade || "",
      tier: s.tier || "",
      // Extract responses fields
      age: responses.age || "",
      phone: responses.phone || "",
      education_level: responses.education_level || "",
      field_of_study: responses.field_of_study || "",
      current_skills: Array.isArray(responses.current_skills) 
        ? responses.current_skills.join(", ") 
        : typeof responses.current_skills === 'string' 
          ? responses.current_skills 
          : "",
      interests: responses.interests ? 
        (Array.isArray(responses.interests)
          ? responses.interests.join(", ")
          : typeof responses.interests === 'string'
            ? responses.interests
            : "")
        : "",
      goals: responses.goals || "",
      preferred_learning_style: responses.preferred_learning_style || "",
      availability_per_week_hours: responses.availability_per_week_hours || "",
      experience_years: responses.experience_years || "",
    };
    
    console.log('📝 Setting form data to:', formData);
    setForm(formData);
    setIsEditing(true);
    setDrawerOpen(true);
  }

  function onChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    console.log('🔧 Admin Form Submission Debug:');
    console.log('📝 Form data:', form);
    console.log('✏️ Is Editing:', isEditing);
    console.log('🔑 Student ID for update:', form.id);

    const payload = {
      user_id: form.user_id || null,
      name: form.name || null,
      email: form.email || null,
      student_id: form.student_id || null,
      grade: form.grade || null,
      tier: form.tier || null,
      responses: {
        age: form.age ? Number(form.age) : null,
        phone: form.phone || null,
        education_level: form.education_level || null,
        field_of_study: form.field_of_study || null,
        current_skills:
          form.current_skills
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
        interests:
          form.interests
            ?.split(",")
            .map((s) => s.trim())
            .filter(Boolean) || [],
        goals: form.goals || null,
        preferred_learning_style: form.preferred_learning_style || null,
        availability_per_week_hours: form.availability_per_week_hours
          ? Number(form.availability_per_week_hours)
          : null,
        experience_years: form.experience_years
          ? Number(form.experience_years)
          : null,
      },
      updated_at: new Date().toISOString(),
    };

    console.log('📦 Payload to send:', payload);

    const query = supabase.from(SUPABASE_TABLE);

    const loadingToast = toast.loading(
      isEditing ? "Updating student..." : "Creating student..."
    );

    try {
      let result;
      if (isEditing) {
        console.log('🔄 Performing UPDATE operation for ID:', form.id);
        result = await query.update(payload).eq("id", form.id);
        console.log('📄 Update result:', result);
      } else {
        console.log('➕ Performing INSERT operation');
        result = await query.insert(payload);
        console.log('📄 Insert result:', result);
      }

      const { data, error: err } = result;

      if (err) {
        console.error('❌ Database operation failed:', err);
        console.error('🔍 Error details:', {
          message: err.message,
          details: err.details,
          hint: err.hint,
          code: err.code
        });
        toast.error(`Database Error: ${err.message}`, { id: loadingToast });
        setError(`Database Error: ${err.message} (${err.code})`);
      } else {
        console.log('✅ Database operation successful!');
        console.log('📊 Returned data:', data);
        toast.success(
          isEditing
            ? "Student updated successfully"
            : "Student created successfully",
          { id: loadingToast }
        );
        setDrawerOpen(false);
        setForm(initialForm);
        fetchStudents();
      }
    } catch (error) {
      console.error('💥 Unexpected error during database operation:', error);
      toast.error(`Unexpected Error: ${error.message}`, { id: loadingToast });
      setError(`Unexpected Error: ${error.message}`);
    }

    setLoading(false);
  }

  function onDelete(student) {
    setStudentDeleteConfirm(student);
  }

  async function confirmStudentDelete() {
    if (!studentDeleteConfirm) return;

    const loadingToast = toast.loading("Deleting student and account data...");
    setLoading(true);

    try {
      const deleteId = studentDeleteConfirm.user_id || studentDeleteConfirm.id;
      await ApiClient.delete(`/students/${deleteId}`);

      toast.success(
        `Student "${studentDeleteConfirm.name}" deleted successfully`, 
        { id: loadingToast }
      );
      fetchStudents();
    } catch (error) {
      console.error("Error deleting student:", error);
      toast.error(error.message || "Failed to delete student", { id: loadingToast });
      setError(error.message || "Failed to delete student");
    }

    setLoading(false);
    setStudentDeleteConfirm(null);
  }

  async function handlePurgeTestAccounts() {
    const isConfirmed = window.confirm(
      "Are you sure you want to clean up all test/dummy student accounts? (Accounts matching 'test', 'dummy', 'student@gurukul.com' will be permanently deleted from MongoDB. Admin accounts are preserved.)"
    );
    if (!isConfirmed) return;

    const loadingToast = toast.loading("Purging test accounts...");
    try {
      const res = await ApiClient.post("/students/cleanup-dummy", { deleteTestKeywords: true });
      toast.success(res?.message || "Test accounts purged successfully", { id: loadingToast });
      fetchStudents();
    } catch (err) {
      toast.error(err.message || "Failed to purge test accounts", { id: loadingToast });
    }
  }

  function handleExportStudentsCSV() {
    try {
      ExportService.exportStudentsToCSV(filtered);
      toast.success(`Exported ${filtered.length} student records to CSV`);
    } catch (err) {
      toast.error(err.message || "Export failed");
    }
  }

  function handleExportStudentsJSON() {
    try {
      ExportService.exportAllToJSON({ students: filtered }, 'gurukul_students_backup');
      toast.success(`Exported ${filtered.length} student records to JSON`);
    } catch (err) {
      toast.error(err.message || "Export failed");
    }
  }

  if (!isAdmin) {
    return (
      <div className="max-w-sm mx-auto text-white">
        <h2 className="text-lg font-semibold mb-3">Admin Login</h2>
        <AdminLogin
          onSuccess={() => {
            sessionStorage.setItem("is_admin", "1");
            setIsAdmin(true);
          }}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="toolbar mb-4">
        <h2 className="text-xl font-semibold">Admin Panel</h2>
        <div className="flex items-center gap-2">
          {activeTab === "students" && (
            <>
              <button onClick={fetchStudents} className="btn">
                Refresh
              </button>
              <button onClick={openAdd} className="btn btn-primary">
                Add Student
              </button>
              <button
                onClick={() => {
                  if (!students || students.length === 0) {
                    toast.error("No student records available to export");
                    return;
                  }
                  const payload = {
                    source_system: "abhiruchi",
                    schema_version: "1.0.0",
                    total_records: students.length,
                    exported_at: new Date().toISOString(),
                    candidates: students.map((s) => ({
                      source_system: "abhiruchi",
                      source_reference: s.id || s._id || null,
                      canonical_candidate_id: s.candidate_id || null,
                      candidate_id: s.candidate_id || s.student_id || null,
                      name: s.name,
                      email: s.email,
                      institute_code: s.institute_code || null,
                      cohort_id: s.cohort_id || "COHORT-2026-OCT-A",
                      grade: s.grade,
                      tier: s.tier,
                      responses: s.responses || {},
                      submitted_at: s.created_at
                    }))
                  };
                  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `abhiruchi_sampada_handoff_${new Date().toISOString().slice(0, 10)}.json`;
                  link.click();
                  URL.revokeObjectURL(url);
                  toast.success(`Exported ${students.length} records to canonical Sampada JSON`);
                }}
                className="btn bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30 flex items-center gap-1.5"
                title="Export canonical payload for Sampada intake"
              >
                <Sparkles className="w-4 h-4" />
                Sampada JSON
              </button>
              <button
                onClick={handleExportStudentsCSV}
                className="btn bg-green-500/20 text-green-300 hover:bg-green-500/30 border border-green-500/30 flex items-center gap-1.5"
                title="Export student intake submissions to CSV"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handleExportStudentsJSON}
                className="btn bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 border border-blue-500/30 flex items-center gap-1.5"
                title="Export all student records to JSON"
              >
                <FileText className="w-4 h-4" />
                Export JSON
              </button>
            </>
          )}
          {activeTab === "saved-configs" && (
            <>
              <button onClick={fetchFormConfigs} className="btn">
                Refresh
              </button>
              <button
                onClick={() => {
                  setEditingFormConfig(null);
                  setActiveTab("forms");
                  setShowFormBuilder(true);
                }}
                className="btn btn-primary"
              >
                Create New Config
              </button>
            </>
          )}
          {activeTab === "forms" && (
            <>
              <button
                onClick={() => {
                  setEditingFormConfig(null);
                  setShowFormBuilder(true);
                }}
                className="btn btn-primary"
              >
                Create New Config
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="flex border-b border-white/20">
          <button
            onClick={() => setActiveTab("students")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "students"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            Students ({students.length})
          </button>
          <button
            onClick={() => setActiveTab("saved-configs")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "saved-configs"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            Saved Configs ({formConfigs.length})
          </button>
          <button
            onClick={() => setActiveTab("forms")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "forms"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            Form Builder
          </button>

          <button
            onClick={() => setActiveTab("student-analytics")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "student-analytics"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            Student Analytics
          </button>
          <button
            onClick={() => setActiveTab("question-banks")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "question-banks"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            Question Banks
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "categories"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            Form Categories
          </button>
          <button
            onClick={() => setActiveTab("question-categories")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "question-categories"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            Question Categories
          </button>
          <button
            onClick={() => setActiveTab("ai-model")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === "ai-model"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-orange-400" />
            AI Model (Uniguru/Mitra)
          </button>
          <button
            onClick={() => setActiveTab("database-test")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "database-test"
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-white/70 hover:text-white"
            }`}
          >
            Database Test
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-red-400/30 bg-red-500/15 p-3 text-red-200">
          {error}
        </div>
      )}

      {/* Students Tab */}
      {activeTab === "students" && (
        <>
          <div className="mb-4 flex items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, grade, id, email"
              aria-label="Search"
              className="input sm:w-72"
            />
            <button
              onClick={openAdd}
              className="inline-flex items-center rounded-md bg-orange-500 px-3 py-2 text-white text-sm hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
            >
              Add
            </button>
          </div>

          {loading && students.length === 0 ? (
            <div className="py-10 text-white/70">Loading...</div>
          ) : students.length === 0 ? (
            <EmptyState onAdd={openAdd} />
          ) : (
            <div className="table-wrap overflow-x-auto">
              <table className="w-full text-left text-sm text-white/90">
                <thead className="bg-white/10 text-xs uppercase tracking-wider text-white/70 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Student</th>
                    <th className="px-3 py-3 font-semibold">Candidate ID</th>
                    <th className="px-3 py-3 font-semibold">Institute</th>
                    <th className="px-3 py-3 font-semibold">Grade</th>
                    <th className="px-3 py-3 font-semibold">Tier</th>
                    <th className="hidden md:table-cell px-3 py-3 font-semibold">Joined</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filtered.map((s) => (
                    <tr
                      key={s.id || s._id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{s.name || 'Unnamed Student'}</div>
                        <div className="text-xs text-white/60 truncate max-w-[180px] sm:max-w-xs">{s.email || '—'}</div>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {s.candidate_id ? (
                          <span className="font-mono text-xs px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold shadow-sm">
                            {s.candidate_id}
                          </span>
                        ) : (
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300/70 border border-amber-500/20">
                            {s.student_id ? `${s.student_id} (Legacy)` : 'Pending'}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {s.institute_code ? (
                          <span className="text-xs px-2.5 py-1 rounded bg-neutral-800 text-white border border-white/20 font-medium">
                            {s.institute_code}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300/70 border border-amber-500/20 italic">
                            Pending Selection
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-white/80 whitespace-nowrap">
                        {s.grade || '—'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {s.tier ? (
                          <span
                            className={`rounded-md px-2 py-0.5 text-xs border ${
                              s.tier === "Seed"
                                ? "border-green-400/50 bg-green-500/10 text-green-200"
                                : s.tier === "Tree"
                                ? "border-yellow-400/50 bg-yellow-500/10 text-yellow-200"
                                : s.tier === "Sky"
                                ? "border-blue-400/50 bg-blue-500/10 text-blue-200"
                                : "border-white/30 bg-white/10 text-white/80"
                            }`}
                          >
                            {s.tier}
                          </span>
                        ) : (
                          <span className="text-white/50 text-xs">—</span>
                        )}
                      </td>
                      <td className="hidden md:table-cell px-3 py-3 text-white/60 text-xs whitespace-nowrap">
                        {s.created_at
                          ? new Date(s.created_at).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(s)}
                            className="btn px-2.5 py-1 text-xs"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => onDelete(s)}
                            className="btn px-2.5 py-1 text-xs text-red-300 hover:text-white bg-red-500/20 hover:bg-red-600 border border-red-500/40 flex items-center gap-1 font-medium transition-all shadow-sm"
                            title={`Delete student account for ${s.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {drawerOpen && createPortal(
            <div className="fixed inset-0" style={{ zIndex: 9999999 }}>
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setDrawerOpen(false)}
              />
              <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto bg-white/10 backdrop-blur-xl border-l border-white/20 shadow-xl text-white">
                <div className="flex items-center justify-between border-b border-white/20 p-4">
                  <h2 className="text-lg font-semibold">
                    {isEditing ? "Edit Student" : "Add Student"}
                  </h2>
                  <button
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-md border border-white/30 px-2 py-1 text-sm hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
                <form onSubmit={onSubmit} className="p-4 space-y-4">
                  {/* Basic Information Section */}
                  <div className="border-b border-white/10 pb-4">
                    <h3 className="text-sm font-medium text-white/80 mb-3">
                      Basic Information
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-white/80">
                            Name *
                          </label>
                          <input
                            name="name"
                            value={form.name}
                            onChange={onChange}
                            required
                            className="input"
                            placeholder="Full Name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/80">
                            Email
                          </label>
                          <input
                            name="email"
                            type="email"
                            value={form.email}
                            onChange={onChange}
                            className="input"
                            placeholder="student@example.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-white/80">
                            Student ID
                          </label>
                          <input
                            name="student_id"
                            value={form.student_id}
                            onChange={onChange}
                            className="input"
                            placeholder="STU001"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/80">
                            User ID
                          </label>
                          <input
                            name="user_id"
                            value={form.user_id}
                            onChange={onChange}
                            className="input"
                            placeholder="Clerk User ID"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-white/80">
                            Grade
                          </label>
                          <input
                            name="grade"
                            value={form.grade}
                            onChange={onChange}
                            className="input"
                            placeholder="10th, 11th, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/80">
                            Tier
                          </label>
                          <select
                            name="tier"
                            value={form.tier}
                            onChange={onChange}
                            className="input"
                          >
                            <option value="">Select Tier</option>
                            <option value="Seed">Seed</option>
                            <option value="Tree">Tree</option>
                            <option value="Sky">Sky</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Profile Information Section */}
                  <div className="border-b border-white/10 pb-4">
                    <h3 className="text-sm font-medium text-white/80 mb-3">
                      Profile Information
                    </h3>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-white/80">
                            Age
                          </label>
                          <input
                            name="age"
                            type="number"
                            min="5"
                            max="100"
                            value={form.age}
                            onChange={onChange}
                            className="input"
                            placeholder="17"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/80">
                            Phone
                          </label>
                          <input
                            name="phone"
                            value={form.phone}
                            onChange={onChange}
                            className="input"
                            placeholder="999-000-1234"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-white/80">
                            Education Level
                          </label>
                          <input
                            name="education_level"
                            value={form.education_level}
                            onChange={onChange}
                            className="input"
                            placeholder="High school, Undergraduate, etc."
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-white/80">
                            Field of Study
                          </label>
                          <input
                            name="field_of_study"
                            value={form.field_of_study}
                            onChange={onChange}
                            className="input"
                            placeholder="CS, Math, Humanities, etc."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Learning Profile Section */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-white/80">
                      Learning Profile
                    </h3>

                    <div>
                      <label className="block text-sm text-white/80">
                        Current Skills
                      </label>
                      <div className="text-xs text-white/60 mb-1">
                        Comma separated list
                      </div>
                      <input
                        name="current_skills"
                        value={form.current_skills}
                        onChange={onChange}
                        className="input"
                        placeholder="JavaScript, Algebra, Writing"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-white/80">
                        Interests
                      </label>
                      <div className="text-xs text-white/60 mb-1">
                        Comma separated list
                      </div>
                      <input
                        name="interests"
                        value={form.interests}
                        onChange={onChange}
                        className="input"
                        placeholder="AI, Web dev, Logic"
                      />
                    </div>

                    <div>
                      <label className="block text-sm text-white/80">
                        Goals
                      </label>
                      <textarea
                        name="goals"
                        rows={3}
                        value={form.goals}
                        onChange={onChange}
                        className="textarea"
                        placeholder="What the student wants to achieve"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-white/80">
                          Preferred Learning Style
                        </label>
                        <input
                          name="preferred_learning_style"
                          value={form.preferred_learning_style}
                          onChange={onChange}
                          className="input"
                          placeholder="Video, Text, Interactive"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-white/80">
                          Availability (hours/week)
                        </label>
                        <input
                          name="availability_per_week_hours"
                          type="number"
                          min="0"
                          value={form.availability_per_week_hours}
                          onChange={onChange}
                          className="input"
                          placeholder="6"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-white/80">
                        Experience (years)
                      </label>
                      <input
                        name="experience_years"
                        type="number"
                        min="0"
                        value={form.experience_years}
                        onChange={onChange}
                        className="input"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4 border-t border-white/10">
                    {isEditing ? (
                      <button
                        type="button"
                        onClick={() => {
                          setDrawerOpen(false);
                          onDelete(form);
                        }}
                        className="btn px-3 py-1.5 text-xs text-red-300 hover:text-white bg-red-500/20 hover:bg-red-600 border border-red-500/30 flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        Delete Student
                      </button>
                    ) : (
                      <div />
                    )}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDrawerOpen(false)}
                        className="btn"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                      >
                        {isEditing ? "Save Changes" : "Create"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>,
          document.body
          )}
        </>
      )}

      {/* Saved Configs Tab */}
      {activeTab === "saved-configs" && (
        <div>
          <div className="mb-4 text-sm text-white/70">
            Manage all your saved form configurations. The active configuration
            is currently being used for student registrations.
          </div>

          <div className="space-y-4">
            {formConfigs.length === 0 ? (
              <div className="card text-center py-8">
                <h3 className="text-lg font-medium text-white mb-2">
                  No Configurations Found
                </h3>
                <p className="text-white/70 mb-4">
                  Create your first form configuration to get started.
                </p>
                <button
                  onClick={() => setActiveTab("forms")}
                  className="btn btn-primary"
                >
                  Create Configuration
                </button>
              </div>
            ) : (
              formConfigs.map((config) => (
                <div key={config.id} className="card">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-medium text-white">
                          {config.name}
                        </h3>
                        {config.is_active ? (
                          <span className="px-3 py-1 text-xs bg-green-500/20 text-green-300 rounded-full border border-green-500/30 font-medium">
                            ✓ Active
                          </span>
                        ) : (
                          <span className="px-3 py-1 text-xs bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 font-medium">
                            Saved
                          </span>
                        )}
                      </div>
                      <p className="text-white/70 text-sm mb-3">
                        {config.description || "No description provided"}
                      </p>
                      <div className="flex items-center gap-4 text-white/50 text-xs">
                        <span>{config.fields?.length || 0} fields</span>
                        <span>•</span>
                        <span>
                          Updated{" "}
                          {new Date(config.updated_at).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span>
                          Created{" "}
                          {new Date(config.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {!config.is_active && (
                        <button
                          onClick={() => openActivateModal(config)}
                          className="btn btn-sm bg-green-500 hover:bg-green-600 text-white"
                          title="Make this configuration active"
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setEditingFormConfig(config);
                          setActiveTab("forms");
                          setShowFormBuilder(true);
                        }}
                        className="btn btn-sm"
                        title="Edit this configuration"
                      >
                        Edit
                      </button>
                      {!config.is_active && (
                        <button
                          onClick={() => openDeleteModal(config)}
                          className="btn btn-sm bg-red-500 hover:bg-red-600 text-white"
                          title="Delete this configuration"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6">
            <button
              onClick={() => {
                setEditingFormConfig(null);
                setActiveTab("forms");
                setShowFormBuilder(true);
              }}
              className="btn btn-primary"
            >
              Create New Configuration
            </button>
          </div>
        </div>
      )}

      {/* Form Configuration Tab */}
      {activeTab === "forms" && (
        <div>
          {showFormBuilder ? (
            <div className="card">
              <FormBuilder
                initialConfig={editingFormConfig}
                onSave={handleFormConfigSave}
                onCancel={closeFormBuilder}
              />
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-white/70 mb-4">
                Create a form configuration for student intake.
              </p>
              <button
                onClick={() => openFormBuilder()}
                className="btn btn-primary"
              >
                Create New Configuration
              </button>
            </div>
          )}
        </div>
      )}

      {/* Activate Configuration Modal */}
      {showActivateModal && configToActivate && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999999, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
          onClick={closeActivateModal}
        >
          <div 
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Activate Configuration
              </h3>
              <button
                onClick={closeActivateModal}
                className="text-white/60 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <p className="text-white/80 mb-3">
                Are you sure you want to activate "{configToActivate.name}"?
              </p>
              <p className="text-white/60 text-sm">
                This will make it the active form configuration for all new
                student registrations. The current active configuration will be
                saved as a preset.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeActivateModal}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={activateConfig}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                Activate
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Delete Configuration Modal */}
      {showDeleteModal && configToDelete && createPortal(
        <div 
          className="fixed inset-0 flex items-center justify-center p-4"
          style={{ zIndex: 9999999, background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)' }}
          onClick={closeDeleteModal}
        >
          <div 
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                Delete Configuration
              </h3>
              <button
                onClick={closeDeleteModal}
                className="text-white/60 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="mb-6">
              <p className="text-white/80 mb-3">
                Are you sure you want to delete "{configToDelete.name}"?
              </p>
              <p className="text-red-300 text-sm font-medium">
                ⚠️ This action cannot be undone. The configuration and all its
                settings will be permanently removed.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={closeDeleteModal}
                className="px-4 py-2 text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={deleteConfig}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}



      {/* Student Analytics Tab */}
      {activeTab === "student-analytics" && (
        <div className="card">
          <StudentAnalytics />
        </div>
      )}

      {/* Question Banks Tab */}
      {activeTab === "question-banks" && (
        <div className="card">
          <QuestionBankManager onNavigateTab={(tab) => setActiveTab(tab)} />
        </div>
      )}

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="card">
          <CategoryManager />
        </div>
      )}

      {/* Question Categories Tab */}
      {activeTab === "question-categories" && (
        <div className="card">
          <QuestionCategoryManager />
        </div>
      )}

      {/* AI Model (Uniguru/Mitra) Tab */}
      {activeTab === "ai-model" && (
        <div className="card">
          <AIModelConfig />
        </div>
      )}

      {/* Database Test Tab */}
      {activeTab === "database-test" && (
        <div className="card">
          <DatabaseTest />
        </div>
      )}

      {/* Student Delete Confirmation Modal */}
      {studentDeleteConfirm && createPortal(
        <div 
          style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
            background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)', 
            zIndex: 10000000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.3s ease-out'
          }}
          onClick={() => setStudentDeleteConfirm(null)}
        >
          <div 
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.08) 100%)',
              backdropFilter: 'blur(20px)', border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '20px', padding: '2rem', maxWidth: '400px', width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', 
                background: 'rgba(239, 68, 68, 0.2)', margin: '0 auto 1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Trash2 className="w-8 h-8 text-red-400" />
              </div>
              <h3 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                Delete Student Record?
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                This action cannot be undone. The following data will be permanently deleted:
              </p>
              <ul style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', textAlign: 'left', listStyle: 'disc', paddingLeft: '1.5rem' }}>
                <li>Student profile and intake responses</li>
                <li>Background selection preferences</li>
                <li>All assignment attempts and scores</li>
                <li>Detailed question responses</li>
                <li>Tier information and progress data</li>
              </ul>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => setStudentDeleteConfirm(null)}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.25)', 
                  background: 'rgba(255,255,255,0.12)', color: 'white'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmStudentDelete}
                style={{
                  flex: 1, padding: '0.75rem', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #dc2626, #ef4444)', 
                  color: 'white', border: 'none'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
