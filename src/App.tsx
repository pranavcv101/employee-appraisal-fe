import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";
import SignUp from "./pages/SignUp";
import SignInSelect from "./pages/SignInSelect";
import SignIn from "./pages/SignIn";
import AdminDashboard from "./pages/AdminDashboard";
import HRDashboard from "./pages/HRDashboard";
import EmployeePortal from "./pages/EmployeePortal";
import SelfAppraisalForm from "./pages/SelfAppraisalForm";
import LeadReviewForm from "./pages/LeadReviewForm";
import MeetingForm from "./pages/MeetingForm";
import { getDashboardForRole } from "./utils/authRouting";

function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (!user?.role || !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardForRole(user?.role ?? "employee")} replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/signin" element={<SignInSelect />} />
      <Route path="/signin/:portal" element={<SignIn />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/hr"
        element={
          <ProtectedRoute allowedRoles={["hr", "admin"]}>
            <HRDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee"
        element={
          <ProtectedRoute allowedRoles={["employee", "hr", "admin"]}>
            <EmployeePortal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/appraisal/:id"
        element={
          <ProtectedRoute allowedRoles={["employee", "hr", "admin"]}>
            <SelfAppraisalForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/review/:id"
        element={
          <ProtectedRoute allowedRoles={["employee", "hr", "admin"]}>
            <LeadReviewForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employee/meeting/:id"
        element={
          <ProtectedRoute allowedRoles={["employee", "hr", "admin"]}>
            <MeetingForm />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
