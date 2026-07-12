import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import Fleet from "./pages/Fleet";
import Drivers from "./pages/Drivers";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import FuelExpenses from "./pages/FuelExpenses";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";
import Signup from "./pages/Signup";
import AccountRequests from "./pages/AccountRequests";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<Login />}
        />
        <Route
  path="/forgot-password"
  element={<ForgotPassword />}
/>

<Route
  path="/reset-password/:token"
  element={<ResetPassword />}
/>

        <Route path="/signup" element={<Signup />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
  path="/fleet"
  element={
    <ProtectedRoute>
      <Fleet />
    </ProtectedRoute>
  }
/>

<Route
  path="/drivers"
  element={
    <ProtectedRoute>
      <Drivers />
    </ProtectedRoute>
  }
/>

<Route
  path="/trips"
  element={
    <ProtectedRoute>
      <Trips />
    </ProtectedRoute>
  }
/>

<Route
  path="/maintenance"
  element={
    <ProtectedRoute>
      <Maintenance />
    </ProtectedRoute>
  }
/>

<Route
  path="/fuel-expenses"
  element={
    <ProtectedRoute>
      <FuelExpenses />
    </ProtectedRoute>
  }
/>


<Route
  path="/analytics"
  element={
    <ProtectedRoute>
      <Analytics />
    </ProtectedRoute>
  }
/>

<Route
  path="/settings"
  element={
    <ProtectedRoute>
      <SettingsPage />
    </ProtectedRoute>
  }
/>

<Route
  path="/account-requests"
  element={
    <ProtectedRoute>
      <AccountRequests />
    </ProtectedRoute>
  }
/>

        <Route
          path="/"
          element={<Navigate to="/dashboard" replace />}
        />

        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;