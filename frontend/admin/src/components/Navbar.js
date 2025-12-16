import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiLogOut, FiSettings, FiDollarSign, FiUsers, FiCreditCard, FiMessageCircle, FiBarChart2, FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-xl sm:text-2xl font-bold text-primary-600" onClick={closeMobileMenu}>
              Admin Panel
            </Link>
          </div>
          
          {/* Desktop Menu */}
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
                  <span className="text-sm sm:text-base">{user.name}</span>
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

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-primary-600 transition p-2"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <FiX className="text-2xl" />
              ) : (
                <FiMenu className="text-2xl" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4">
            {user && user.role === 'admin' ? (
              <div className="flex flex-col space-y-4">
                <Link
                  to="/"
                  className="text-gray-700 hover:text-primary-600 transition py-2 px-4 rounded-lg hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  Dashboard
                </Link>
                <Link
                  to="/upi"
                  className="text-gray-700 hover:text-primary-600 transition flex items-center py-2 px-4 rounded-lg hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  <FiDollarSign className="mr-2" />
                  UPI
                </Link>
                <Link
                  to="/users"
                  className="text-gray-700 hover:text-primary-600 transition flex items-center py-2 px-4 rounded-lg hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  <FiUsers className="mr-2" />
                  Users
                </Link>
                <Link
                  to="/withdrawals"
                  className="text-gray-700 hover:text-primary-600 transition flex items-center py-2 px-4 rounded-lg hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  <FiCreditCard className="mr-2" />
                  Withdrawals
                </Link>
                <Link
                  to="/support-tickets"
                  className="text-gray-700 hover:text-primary-600 transition flex items-center py-2 px-4 rounded-lg hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  <FiMessageCircle className="mr-2" />
                  Support
                </Link>
                <Link
                  to="/trackier-stats"
                  className="text-gray-700 hover:text-primary-600 transition flex items-center py-2 px-4 rounded-lg hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  <FiBarChart2 className="mr-2" />
                  Trackier Stats
                </Link>
                <div className="flex items-center text-gray-700 py-2 px-4">
                  <FiSettings className="mr-2" />
                  {user.name}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-700 hover:text-primary-600 transition py-2 px-4 rounded-lg hover:bg-gray-50 text-left"
                >
                  <FiLogOut className="mr-2" />
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


