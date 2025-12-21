import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Login from './components/Auth/Login';
import Dashboard from './components/Dashboard/Dashboard';
import SearchPage from './components/Search/SearchPage';
import UserManagement from './components/Users/UserManagement';
import ReportAttack from './components/Attacks/ReportAttack';
import AttacksList from './components/Attacks/AttacksList';
import AttackDetail from './components/Attacks/AttackDetail';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/search"
              element={
                <PrivateRoute>
                  <SearchPage />
                </PrivateRoute>
              }
            />
            <Route
              path="/users"
              element={
                <PrivateRoute>
                  <UserManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/attacks"
              element={
                <PrivateRoute>
                  <AttacksList />
                </PrivateRoute>
              }
            />
            <Route
              path="/attacks/:id"
              element={
                <PrivateRoute>
                  <AttackDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/attacks/:id/edit"
              element={
                <PrivateRoute>
                  <ReportAttack />
                </PrivateRoute>
              }
            />
            <Route
              path="/report-attack"
              element={
                <PrivateRoute>
                  <ReportAttack />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

