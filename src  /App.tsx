import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "sonner";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { ItemDetail } from "./pages/ItemDetail";
import { AddItem } from "./pages/AddItem";
import { AdminPanel } from "./pages/AdminPanel";
import { BrowseItems } from "./pages/BrowseItems";
import { SwapsPage } from "./pages/SwapsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { Navbar } from "./components/Navbar";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/browse" element={<ProtectedRoute><BrowseItems /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/item/:id" element={<ProtectedRoute><ItemDetail /></ProtectedRoute>} />
          <Route path="/add-item" element={<ProtectedRoute><AddItem /></ProtectedRoute>} />
          <Route path="/swaps" element={<ProtectedRoute><SwapsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

function AuthPage() {
  const loggedInUser = useQuery(api.auth.loggedInUser);

  if (loggedInUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (loggedInUser) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="w-full max-w-md mx-auto p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-800 mb-2">Welcome to ReWear</h1>
          <p className="text-green-600">Join the sustainable fashion community</p>
        </div>
        <SignInForm />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Authenticated>
        <AppLayout>
          {children}
        </AppLayout>
      </Authenticated>
      <Unauthenticated>
        <Navigate to="/auth" replace />
      </Unauthenticated>
    </>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
    </>
  );
}
