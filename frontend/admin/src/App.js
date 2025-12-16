import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import UPI from './pages/upi/upi';
import Users from './pages/Users/Users';
import Withdrawals from './pages/Withdrawals/Withdrawals';
import SupportTickets from './pages/SupportTickets/SupportTickets';
import TrackierStats from './pages/TrackierStats/TrackierStats';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App flex flex-col min-h-screen">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/upi"
                element={
                  <ProtectedRoute>
                    <UPI />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute>
                    <Users />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/withdrawals"
                element={
                  <ProtectedRoute>
                    <Withdrawals />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/support-tickets"
                element={
                  <ProtectedRoute>
                    <SupportTickets />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/trackier-stats"
                element={
                  <ProtectedRoute>
                    <TrackierStats />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;


