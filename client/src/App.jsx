import React, { useState, useEffect, useCallback, useRef } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import Hero from "./pages/Hero/Hero";
import About from "./pages/About/About";
import Skills from "./pages/Skills/Skills";
import Timeline from "./pages/Timeline/Timeline";
import Services from "./pages/Services/Services";
import ProjectDetails from "./pages/Services/ProjectDetails";
import Contact from "./pages/Contact/Contact";
import AdminPanel from "./pages/Admin/AdminPanel";
import Footer from "./components/Footer/Footer";
import { authService } from "./services/authService";
import { apiService } from "./services/apiService";
import { socketService } from "./services/SocketService";
import SystemStatusContext from "./context/SystemStatusContext";
import SecurityContext from "./context/SecurityContext";

export default function App() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [sent, setSent] = useState(false);

  const [security, setSecurity] = useState({
    token: null,
    user: null,
  });

  const [socketConnected, setSocketConnected] = useState(false);
  const [adminSecretPath, setAdminSecretPath] = useState("");
  const [adminPathResolved, setAdminPathResolved] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    status: 'operational',
    isOperational: true,
    statusText: 'Available for Opportunities',
    statusLabel: 'Available',
    loading: true,
    error: null,
    updatedAt: null,
  });

  // Controls whether the socket message is visible
  const [showSocketStatus, setShowSocketStatus] = useState(false);
  const statusTimerRef = useRef(null);

  const scheduleStatusCheck = useCallback((delayMs) => {
    if (statusTimerRef.current) {
      clearTimeout(statusTimerRef.current);
    }

    statusTimerRef.current = setTimeout(() => {
      statusTimerRef.current = null;
      refreshSystemStatus();
    }, delayMs);
  }, []);

  const refreshSystemStatus = useCallback(async () => {
    try {
      const response = await apiService.get('/system/status');
      const payload = response?.data || response;
      const nextStatus = {
        status: payload?.status || 'operational',
        isOperational: payload?.isOperational ?? true,
        statusText: payload?.statusText || 'Available for Opportunities',
        statusLabel: payload?.statusLabel || 'Available',
        loading: false,
        error: null,
        updatedAt: payload?.updatedAt || new Date().toISOString(),
      };

      setSystemStatus(nextStatus);
      scheduleStatusCheck(600000);
      return nextStatus;
    } catch (error) {
      const fallback = {
        status: 'offline',
        isOperational: false,
        statusText: 'System temporarily offline',
        statusLabel: 'Offline',
        loading: false,
        error: error?.message || 'System status unavailable',
        updatedAt: new Date().toISOString(),
      };

      setSystemStatus(fallback);
      scheduleStatusCheck(60000);
      return fallback;
    }
  }, [scheduleStatusCheck]);

  useEffect(() => {
    refreshSystemStatus();

    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
        statusTimerRef.current = null;
      }
    };
  }, [refreshSystemStatus]);

  useEffect(() => {
    const token = authService.getToken();
    const user = authService.getUser();

    if (token && user) {
      setSecurity({ token, user });
      apiService.setToken(token);

      socketService
        .connect(token)
        .then(() => {
          setSocketConnected(true);
          setShowSocketStatus(true);

          // Hide after 2 seconds
          setTimeout(() => {
            setShowSocketStatus(false);
          }, 2000);
        })
        .catch(() => {
          setSocketConnected(false);
          setShowSocketStatus(true);

          // Hide after 2 seconds
          setTimeout(() => {
            setShowSocketStatus(false);
          }, 2000);
        });
    }
  }, []);

  useEffect(() => {
    let active = true;

    apiService
      .getAdminPath()
      .then((path) => {
        if (active) {
          setAdminSecretPath(path);
        }
      })
      .catch(() => {
        if (active) {
          setAdminSecretPath("");
        }
      })
      .finally(() => {
        if (active) {
          setAdminPathResolved(true);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  function sanitizeInput(str) {
    return apiService.sanitize(str || "");
  }

  function handleChange(e) {
    const name = sanitizeInput(e.target.name);
    const value = sanitizeInput(e.target.value);

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name || !form.email || !form.message) return;

    if (!apiService.validateEmail(form.email)) {
      alert("Invalid email");
      return;
    }

    setSent(true);

    setForm({
      name: "",
      email: "",
      subject: "",
      message: "",
    });

    setTimeout(() => setSent(false), 4000);
  }

  function scrollTo(id) {
    const el = document.getElementById(id);

    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
      });
    }
  }

  // Cleanup socket
  useEffect(() => {
    return () => {
      socketService.disconnect();
    };
  }, []);

  if (!adminPathResolved) {
    return (
      <div className="min-h-screen bg-linear-to-b from-slate-50 to-white text-slate-900 font-sans antialiased flex items-center justify-center">
        <div className="text-sm text-slate-500">Loading...</div>
      </div>
    );
  }

  return (
    <SecurityContext.Provider value={security}>
      <SystemStatusContext.Provider value={{ ...systemStatus, refreshStatus: refreshSystemStatus }}>
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 font-sans antialiased">

          <Navbar onNavigate={scrollTo} />

          <Routes>
            <Route
              path="/"
              element={
                <>
                  <Hero onNavigate={scrollTo} />
                  <About />
                  <Skills />
                  <Timeline />
                  <Services />

                  <Contact
                    form={form}
                    sent={sent}
                    onChange={handleChange}
                    onSubmit={handleSubmit}
                  />

                  <Footer onNavigate={scrollTo} />
                </>
              }
            />

          {adminSecretPath && (
            <>
              <Route
                path={`/${adminSecretPath}/*`}
                element={<AdminPanel />}
              />

              <Route
                path={`/${adminSecretPath}`}
                element={
                  <Navigate
                    to={`/${adminSecretPath}/dashboard`}
                    replace
                  />
                }
              />
            </>
          )}

            <Route path="/project/:id" element={<ProjectDetails />} />

            <Route
              path="*"
              element={<Navigate to="/" replace />}
            />
          </Routes>

          {/* Socket status - visible for only 2 seconds */}
          {process.env.NODE_ENV === "development" &&
            showSocketStatus && (
              <div
                style={{
                  position: "fixed",
                  bottom: "1rem",
                  right: "1rem",
                  padding: "0.5rem 1rem",
                  background: socketConnected
                    ? "#22c55e"
                    : "#ef4444",
                  color: "white",
                  borderRadius: "0.5rem",
                  fontSize: "0.75rem",
                  zIndex: 9999,
                  boxShadow:
                    "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              >
                {socketConnected
                  ? "🟢 Socket Connected"
                  : "🔴 Socket Disconnected"}
              </div>
            )}
        </div>
      </SystemStatusContext.Provider>
    </SecurityContext.Provider>
  );
}
