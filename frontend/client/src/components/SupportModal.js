import React, { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { FiX, FiCheckCircle } from 'react-icons/fi';

const SupportModal = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    upiId: '',
    email: user?.email || '',
    issueType: '',
    description: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const issueTypes = [
    'Cashback not received',
    'Process error',
    'UPI issue',
    'Payment failure',
    'Other'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(formData.email.trim())) {
        newErrors.email = 'Invalid email format';
      }
    }

    if (!formData.issueType) {
      newErrors.issueType = 'Please select an issue type';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      const headers = {};
      if (user && localStorage.getItem('token')) {
        headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
      }

      await axios.post('/api/support', formData, { headers });

      setSuccess(true);
      // Reset form
      setFormData({
        name: user?.name || '',
        upiId: '',
        email: user?.email || '',
        issueType: '',
        description: ''
      });

      // Close modal after 2 seconds
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      setErrors({
        submit: error.response?.data?.message || 'Error submitting ticket. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition"
        >
          <FiX className="text-2xl" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">NEED HELP?</h2>

        {success ? (
          <div className="text-center py-8">
            <FiCheckCircle className="text-5xl text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900 mb-2">Ticket Submitted!</p>
            <p className="text-gray-600">We'll get back to you soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Your Name"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                }`}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            {/* UPI ID */}
            <div>
              <label htmlFor="upiId" className="block text-sm font-medium text-gray-700 mb-1">
                UPI ID
              </label>
              <input
                type="text"
                id="upiId"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="example@upi"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.upiId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                }`}
              />
              {errors.upiId && (
                <p className="mt-1 text-sm text-red-600">{errors.upiId}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your@email.com"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            {/* Issue Type */}
            <div>
              <label htmlFor="issueType" className="block text-sm font-medium text-gray-700 mb-1">
                Issue Type
              </label>
              <select
                id="issueType"
                name="issueType"
                value={formData.issueType}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                  errors.issueType ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                }`}
              >
                <option value="">Select an issue</option>
                {issueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
              {errors.issueType && (
                <p className="mt-1 text-sm text-red-600">{errors.issueType}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your issue in detail"
                rows="4"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 resize-y ${
                  errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-purple-500'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>

            {/* Submit Error */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting...' : 'SUBMIT TICKET'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SupportModal;














