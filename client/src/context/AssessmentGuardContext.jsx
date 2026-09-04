import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const AssessmentGuardContext = createContext(null);

export function AssessmentGuardProvider({ children }) {
  const [isAssessmentActive, setIsAssessmentActive] = useState(false);
  const [pendingTarget, setPendingTarget] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [cancelCallback, setCancelCallback] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Intercept browser back / forward buttons when assessment is active
  useEffect(() => {
    const handlePopState = () => {
      if (isAssessmentActive && location.pathname === '/assignment') {
        window.history.pushState(null, '', location.pathname);
        setPendingTarget('BACK');
        setShowConfirmModal(true);
      }
    };

    if (isAssessmentActive && location.pathname === '/assignment') {
      window.addEventListener('popstate', handlePopState);
    }

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isAssessmentActive, location.pathname]);

  // Intercept tab/browser close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isAssessmentActive && location.pathname === '/assignment') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAssessmentActive, location.pathname]);

  const requestNavigation = (target) => {
    if (isAssessmentActive && location.pathname === '/assignment') {
      setPendingTarget(() => target);
      setShowConfirmModal(true);
      return false; // Intercepted
    }
    return true; // Proceed directly
  };

  const confirmLeave = () => {
    if (cancelCallback) {
      try {
        cancelCallback();
      } catch (err) {
        console.warn('Cancel callback error:', err);
      }
    }
    setIsAssessmentActive(false);
    setShowConfirmModal(false);

    const target = pendingTarget;
    setPendingTarget(null);

    if (target === 'BACK') {
      navigate(-1);
    } else if (typeof target === 'function') {
      target();
    } else if (typeof target === 'string') {
      navigate(target);
    }
  };

  const cancelLeave = () => {
    setShowConfirmModal(false);
    setPendingTarget(null);
  };

  return (
    <AssessmentGuardContext.Provider
      value={{
        isAssessmentActive,
        setIsAssessmentActive,
        requestNavigation,
        setCancelCallback
      }}
    >
      {children}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-md p-6 sm:p-7 rounded-3xl border border-white/20 bg-slate-950/95 shadow-2xl space-y-6 text-center">
            
            {/* Warning Icon Badge */}
            <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500/20 to-red-500/20 border border-amber-500/40 flex items-center justify-center shadow-inner">
              <AlertTriangle className="w-8 h-8 text-amber-400 animate-pulse" />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-wide">
                Cancel Assessment Loading?
              </h3>
              <p className="text-sm text-white/70 leading-relaxed px-2">
                Assessment generation or test is currently active. Navigating away will cancel loading and discard current progress.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={cancelLeave}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white/90 bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-200 hover:scale-105"
              >
                No, Stay Here
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-700 hover:to-amber-700 shadow-lg shadow-red-500/20 transition-all duration-200 hover:scale-105"
              >
                Yes, Cancel & Leave
              </button>
            </div>

          </div>
        </div>
      )}
    </AssessmentGuardContext.Provider>
  );
}

export function useAssessmentGuard() {
  const context = useContext(AssessmentGuardContext);
  if (!context) {
    return {
      isAssessmentActive: false,
      setIsAssessmentActive: () => {},
      requestNavigation: () => true,
      setCancelCallback: () => {}
    };
  }
  return context;
}
