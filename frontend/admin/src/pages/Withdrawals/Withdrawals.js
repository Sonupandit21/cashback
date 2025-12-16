import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch, FiCheckCircle, FiXCircle, FiClock, FiUser, FiDollarSign, FiCreditCard, FiTrash2 } from 'react-icons/fi';

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [walletStats, setWalletStats] = useState({
    totalBalance: 0,
    totalWithdrawn: 0,
    pendingAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    completed: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [withdrawalsRes, walletRes] = await Promise.all([
        axios.get('/api/admin/withdrawals'),
        axios.get('/api/admin/wallet-stats')
      ]);
      setWithdrawals(withdrawalsRes.data);
      setWalletStats(walletRes.data);
      calculateStats(withdrawalsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      pending: data.filter(item => item.status === 'pending').length,
      approved: data.filter(item => item.status === 'approved').length,
      rejected: data.filter(item => item.status === 'rejected').length,
      completed: data.filter(item => item.status === 'completed').length
    };
    setStats(stats);
  };

  const handleStatusUpdate = async (id, newStatus, rejectedReason = '') => {
    if (newStatus === 'rejected' && !rejectedReason) {
      const reason = prompt('Please enter rejection reason:');
      if (!reason || !reason.trim()) {
        alert('Rejection reason is required');
        return;
      }
      rejectedReason = reason.trim();
    }

    try {
      await axios.put(`/api/admin/withdrawals/${id}`, { 
        status: newStatus,
        rejectedReason: rejectedReason || undefined
      });
      fetchData(); // Refresh data
      alert(`Withdrawal ${newStatus} successfully`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status');
    }
  };

  const handleDelete = async (id, userName, amount) => {
    if (!window.confirm(`Are you sure you want to delete withdrawal request of ₹${amount} for user "${userName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/withdrawals/${id}`);
      fetchData(); // Refresh data
      alert('Withdrawal request deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting withdrawal request');
    }
  };

  const filteredData = withdrawals.filter(item => {
    const matchesSearch = 
      item.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.upiId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-green-100 text-green-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <FiCheckCircle className="text-green-600" />;
      case 'rejected':
        return <FiXCircle className="text-red-600" />;
      default:
        return <FiClock className="text-yellow-600" />;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Withdrawal Management</h1>
          <p className="text-gray-600">View and manage all withdrawal requests</p>
        </div>

        {/* Wallet Balance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Total Wallet Balance</p>
                <p className="text-3xl font-bold">₹{walletStats.totalBalance?.toLocaleString() || 0}</p>
              </div>
              <FiCreditCard className="text-4xl text-green-200 opacity-80" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiDollarSign className="text-3xl text-blue-600 mr-4" />
              <div>
                <p className="text-gray-600">Total Withdrawn</p>
                <p className="text-2xl font-bold">₹{walletStats.totalWithdrawn?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiClock className="text-3xl text-yellow-600 mr-4" />
              <div>
                <p className="text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold">₹{walletStats.pendingAmount?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Withdrawal Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiDollarSign className="text-3xl text-blue-600 mr-4" />
              <div>
                <p className="text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiClock className="text-3xl text-yellow-600 mr-4" />
              <div>
                <p className="text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiCheckCircle className="text-3xl text-blue-600 mr-4" />
              <div>
                <p className="text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiCheckCircle className="text-3xl text-green-600 mr-4" />
              <div>
                <p className="text-gray-600">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiXCircle className="text-3xl text-red-600 mr-4" />
              <div>
                <p className="text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{stats.rejected}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by user name, email, or UPI ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiDollarSign className="mx-auto text-4xl text-gray-300 mb-2" />
              <p>No withdrawal requests found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      UPI ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Processed At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiUser className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {item.userId?.name || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.userId?.email || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">
                          ₹{item.amount?.toLocaleString() || 0}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {item.upiId}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(item.status)}`}>
                          <span className="mr-1">{getStatusIcon(item.status)}</span>
                          {item.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.processedAt ? formatDate(item.processedAt) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {item.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(item._id, 'approved')}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                                title="Approve"
                              >
                                <FiCheckCircle className="mr-1" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(item._id, 'rejected')}
                                className="text-red-600 hover:text-red-900 flex items-center"
                                title="Reject"
                              >
                                <FiXCircle className="mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                          {item.status === 'approved' && (
                            <button
                              onClick={() => handleStatusUpdate(item._id, 'completed')}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Mark Completed"
                            >
                              <FiCheckCircle className="mr-1" />
                              Mark Completed
                            </button>
                          )}
                          {item.status === 'rejected' && item.rejectedReason && (
                            <div className="text-xs text-gray-500 max-w-xs">
                              Reason: {item.rejectedReason}
                            </div>
                          )}
                          <button
                            onClick={() => handleDelete(item._id, item.userId?.name || 'Unknown', item.amount)}
                            className="text-red-600 hover:text-red-900 flex items-center ml-2"
                            title="Delete Withdrawal Request"
                          >
                            <FiTrash2 className="mr-1" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Withdrawals;





