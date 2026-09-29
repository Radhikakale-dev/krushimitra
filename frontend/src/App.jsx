/**
 * App.jsx
 * KrushiMitra AI — Root Application with Routing
 * All routes defined here with role-based protection.
 */
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import ErrorBoundary from './components/ui/ErrorBoundary';
import OfflineIndicator from './components/ui/OfflineIndicator';

// ── Auth Pages ─────────────────────────────────────────────────────────────────
import Login            from './pages/Login';
import Register         from './pages/Register';
import RegisterEmployee from './pages/RegisterEmployee';
import ForgotPassword   from './pages/ForgotPassword';
import EmailVerification from './pages/EmailVerification';

// ── App Pages ──────────────────────────────────────────────────────────────────
import Dashboard        from './pages/Dashboard';
import Products         from './pages/Products';
import Categories       from './pages/Categories';
import POS              from './pages/POS';
import Settings         from './pages/Settings';
import Customers        from './pages/Customers';
import Suppliers        from './pages/Suppliers';
import Inventory        from './pages/Inventory';
import Reports          from './pages/Reports';
import Expenses         from './pages/Expenses';
import UsersManagement  from './pages/UsersManagement';
import Unauthorized     from './pages/Unauthorized';
import AIAssistant      from './components/AIAssistant';


function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <OfflineIndicator />
          <Router>
            <Routes>
              {/* ── Public Routes ───────────────────────────────────────────── */}
              <Route path="/login"             element={<Login />} />
              <Route path="/register"          element={<Register />} />
              <Route path="/register-employee" element={<RegisterEmployee />} />
              <Route path="/forgot-password"   element={<ForgotPassword />} />
              <Route path="/email-verification" element={<EmailVerification />} />
              <Route path="/unauthorized"      element={<Unauthorized />} />

              {/* ── Protected App Shell ─────────────────────────────────────── */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                {/* Default redirect */}
                <Route index element={<Navigate to="/dashboard" replace />} />

                {/* Dashboard — all roles */}
                <Route path="dashboard" element={<Dashboard />} />

                {/* POS Billing — all roles */}
                <Route path="pos" element={
                  <ProtectedRoute allowedRoles={['admin', 'employee']}>
                    <POS />
                  </ProtectedRoute>
                } />

                {/* Product Management — admin only */}
                <Route path="products" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Products />
                  </ProtectedRoute>
                } />

                {/* Category Management — admin only */}
                <Route path="categories" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Categories />
                  </ProtectedRoute>
                } />

                {/* Inventory — admin only */}
                <Route path="inventory" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Inventory />
                  </ProtectedRoute>
                } />

                {/* Customers — all roles */}
                <Route path="customers" element={
                  <ProtectedRoute allowedRoles={['admin', 'employee']}>
                    <Customers />
                  </ProtectedRoute>
                } />

                {/* Suppliers — admin only */}
                <Route path="suppliers" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Suppliers />
                  </ProtectedRoute>
                } />

                {/* Expenses — admin only */}
                <Route path="expenses" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Expenses />
                  </ProtectedRoute>
                } />

                {/* Reports — admin only */}
                <Route path="reports" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Reports />
                  </ProtectedRoute>
                } />

                {/* User Management — admin only */}
                <Route path="users" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <UsersManagement />
                  </ProtectedRoute>
                } />

                {/* Settings — admin only */}
                <Route path="settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                } />
              </Route>

              {/* ── Catch-all ────────────────────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Router>

          {/* ── Global Toast Notifications ──────────────────────────────────── */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#0f172a',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                fontSize: '13px',
                fontFamily: 'Inter, system-ui, sans-serif',
              },
              success: {
                iconTheme: { primary: '#22c55e', secondary: '#0f172a' },
              },
              error: {
                iconTheme: { primary: '#ef4444', secondary: '#0f172a' },
              },
            }}
          />
          <AIAssistant />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
