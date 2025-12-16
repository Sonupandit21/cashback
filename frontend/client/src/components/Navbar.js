import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FiUser, FiLogOut, FiSettings, FiHelpCircle } from 'react-icons/fi';
import SupportModal from './SupportModal';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showSupportModal, setShowSupportModal] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-primary-600">
              BrandShapers
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition">
              Home
            </Link>
            <Link to="/offers" className="text-gray-700 hover:text-primary-600 transition">
              Offers
            </Link>
            <button
              onClick={() => setShowSupportModal(true)}
              className="flex items-center text-gray-700 hover:text-primary-600 transition"
            >
              <FiHelpCircle className="mr-1" />
              Support
            </button>
            
            {user ? (
              <>
                <Link
                  to="/usersadmin"
                  className="flex items-center text-gray-700 hover:text-primary-600 transition"
                >
                  <FiUser className="mr-1" />
                  Wallet
                </Link>
                <Link
                  to="/profile"
                  className="flex items-center text-gray-700 hover:text-primary-600 transition"
                >
                  <FiUser className="mr-1" />
                  {user.name}
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center text-gray-700 hover:text-primary-600 transition"
                >
                  <FiLogOut className="mr-1" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-primary-600 transition"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Support Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
    </nav>
  );
};

export default Navbar;

