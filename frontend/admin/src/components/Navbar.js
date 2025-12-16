import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLogOut, FiSettings, FiDollarSign, FiUsers, FiCreditCard, FiMessageCircle, FiBarChart2 } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              Admin Panel
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {user && user.role === 'admin' ? (
              <>
                <Link
                  to="/"
                  className="text-gray-700 hover:text-primary-600 transition"
                >
                  Dashboard
                </Link>
                <Link
                  to="/upi"
                  className="text-gray-700 hover:text-primary-600 transition flex items-center"
                >
                  <FiDollarSign className="mr-1" />
                  UPI
                </Link>
                <Link
                  to="/users"
                  className="text-gray-700 hover:text-primary-600 transition flex items-center"
                >
                  <FiUsers className="mr-1" />
                  Users
                </Link>
                <Link
                  to="/withdrawals"
                  className="text-gray-700 hover:text-primary-600 transition flex items-center"
                >
                  <FiCreditCard className="mr-1" />
                  Withdrawals
                </Link>
                <Link
                  to="/support-tickets"
                  className="text-gray-700 hover:text-primary-600 transition flex items-center"
                >
                  <FiMessageCircle className="mr-1" />
                  Support
                </Link>
                <Link
                  to="/trackier-stats"
                  className="text-gray-700 hover:text-primary-600 transition flex items-center"
                >
                  <FiBarChart2 className="mr-1" />
                  Trackier Stats
                </Link>
                <div className="flex items-center text-gray-700">
                  <FiSettings className="mr-1" />
                  {user.name}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-700 hover:text-primary-600 transition"
                >
                  <FiLogOut className="mr-1" />
                  Logout
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


