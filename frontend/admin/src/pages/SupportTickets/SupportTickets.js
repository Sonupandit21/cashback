import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiSearch, FiClock, FiCheckCircle, FiXCircle, FiUser, FiMail, FiMessageCircle, FiTrash2 } from 'react-icons/fi';

const SupportTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [issueTypeFilter, setIssueTypeFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const response = await axios.get('/api/admin/support-tickets');
      setTickets(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Error fetching support tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const stats = {
      total: data.length,
      open: data.filter(item => item.status === 'open').length,
      in_progress: data.filter(item => item.status === 'in_progress').length,
      resolved: data.filter(item => item.status === 'resolved').length,
      closed: data.filter(item => item.status === 'closed').length
    };
    setStats(stats);
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axios.put(`/api/admin/support-tickets/${id}`, { status: newStatus });
      fetchTickets(); // Refresh data
      alert(`Ticket ${newStatus} successfully`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status');
    }
  };

  const handleDelete = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to delete support ticket from "${userName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await axios.delete(`/api/admin/support-tickets/${id}`);
      fetchTickets(); // Refresh data
      alert('Support ticket deleted successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting ticket');
    }
  };

  const filteredData = tickets.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.upiId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesIssueType = issueTypeFilter === 'all' || item.issueType === issueTypeFilter;
    
    return matchesSearch && matchesStatus && matchesIssueType;
  });

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <FiCheckCircle className="text-green-600" />;
      case 'closed':
        return <FiXCircle className="text-gray-600" />;
      case 'in_progress':
        return <FiClock className="text-blue-600" />;
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
          <h1 className="text-3xl font-bold mb-2">Support Tickets</h1>
          <p className="text-gray-600">View and manage all customer support requests</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiMessageCircle className="text-3xl text-blue-600 mr-4" />
              <div>
                <p className="text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiClock className="text-3xl text-yellow-600 mr-4" />
              <div>
                <p className="text-gray-600">Open</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiClock className="text-3xl text-blue-600 mr-4" />
              <div>
                <p className="text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{stats.in_progress}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiCheckCircle className="text-3xl text-green-600 mr-4" />
              <div>
                <p className="text-gray-600">Resolved</p>
                <p className="text-2xl font-bold">{stats.resolved}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiXCircle className="text-3xl text-gray-600 mr-4" />
              <div>
                <p className="text-gray-600">Closed</p>
                <p className="text-2xl font-bold">{stats.closed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, UPI ID, or description..."
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
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <select
                value={issueTypeFilter}
                onChange={(e) => setIssueTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Issue Types</option>
                <option value="Cashback not received">Cashback not received</option>
                <option value="Process error">Process error</option>
                <option value="UPI issue">UPI issue</option>
                <option value="Payment failure">Payment failure</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredData.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiMessageCircle className="mx-auto text-4xl text-gray-300 mb-2" />
              <p>No support tickets found</p>
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
                      Issue Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredData.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiUser className="text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {ticket.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {ticket.email}
                            </div>
                            {ticket.upiId && (
                              <div className="text-xs text-gray-400">
                                UPI: {ticket.upiId}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {ticket.issueType}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={ticket.description}>
                          {ticket.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(ticket.status)}`}>
                          <span className="mr-1">{getStatusIcon(ticket.status)}</span>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(ticket.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {ticket.status === 'open' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(ticket._id, 'in_progress')}
                                className="text-blue-600 hover:text-blue-900 flex items-center"
                                title="Mark In Progress"
                              >
                                <FiClock className="mr-1" />
                                In Progress
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(ticket._id, 'resolved')}
                                className="text-green-600 hover:text-green-900 flex items-center"
                                title="Resolve"
                              >
                                <FiCheckCircle className="mr-1" />
                                Resolve
                              </button>
                            </>
                          )}
                          {ticket.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusUpdate(ticket._id, 'resolved')}
                              className="text-green-600 hover:text-green-900 flex items-center"
                              title="Resolve"
                            >
                              <FiCheckCircle className="mr-1" />
                              Resolve
                            </button>
                          )}
                          {ticket.status === 'resolved' && (
                            <button
                              onClick={() => handleStatusUpdate(ticket._id, 'closed')}
                              className="text-gray-600 hover:text-gray-900 flex items-center"
                              title="Close"
                            >
                              <FiXCircle className="mr-1" />
                              Close
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(ticket._id, ticket.name)}
                            className="text-red-600 hover:text-red-900 flex items-center ml-2"
                            title="Delete Ticket"
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

export default SupportTickets;

















