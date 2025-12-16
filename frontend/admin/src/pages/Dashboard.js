import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiPlus, FiEdit, FiTrash2, FiDollarSign, FiUsers, FiGift, FiTrendingUp, FiStar, FiMessageCircle, FiClock, FiCheckCircle, FiXCircle, FiDatabase, FiActivity, FiServer } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [offers, setOffers] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    cashbackAmount: '',
    currency: 'USD',
    instructions: '',
    offerLink: '',
    trackierOfferId: '',
    isActive: true,
    isFeatured: false,
    minAmount: '',
    maxUsers: '',
    image: null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, offersRes, ticketsRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/offers'),
        axios.get('/api/admin/support-tickets')
      ]);
      setStats(statsRes.data);
      setOffers(offersRes.data);
      // Get recent 5 support tickets
      setSupportTickets(ticketsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      await axios.put(`/api/admin/support-tickets/${ticketId}`, { status: newStatus });
      fetchData(); // Refresh data
      alert(`Ticket ${newStatus} successfully`);
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating status');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      open: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    if (type === 'file') {
      setFormData({ ...formData, image: files[0] });
    } else if (type === 'checkbox') {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => {
      if (key !== 'image' && formData[key] !== null && formData[key] !== '') {
        data.append(key, formData[key]);
      }
    });
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      if (editingOffer) {
        await axios.put(`/api/admin/offers/${editingOffer._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post('/api/admin/offers', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving offer');
    }
  };

  const handleEdit = (offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description,
      category: offer.category,
      cashbackAmount: offer.cashbackAmount,
      currency: offer.currency,
      instructions: offer.instructions,
      offerLink: offer.offerLink,
      trackierOfferId: offer.trackierOfferId || '',
      isActive: offer.isActive,
      isFeatured: offer.isFeatured,
      minAmount: offer.minAmount || '',
      maxUsers: offer.maxUsers || '',
      image: null
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this offer?')) return;
    
    try {
      await axios.delete(`/api/admin/offers/${id}`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error deleting offer');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      cashbackAmount: '',
      currency: 'USD',
      instructions: '',
      offerLink: '',
      trackierOfferId: '',
      isActive: true,
      isFeatured: false,
      minAmount: '',
      maxUsers: '',
      image: null
    });
    setEditingOffer(null);
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center"
          >
            <FiPlus className="mr-2" />
            Add Offer
          </button>
        </div>



        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiUsers className="text-3xl text-primary-600 mr-4" />
              <div>
                <p className="text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiGift className="text-3xl text-green-600 mr-4" />
              <div>
                <p className="text-gray-600">Total Offers</p>
                <p className="text-2xl font-bold">{stats.totalOffers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiTrendingUp className="text-3xl text-blue-600 mr-4" />
              <div>
                <p className="text-gray-600">Active Offers</p>
                <p className="text-2xl font-bold">{stats.activeOffers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiStar className="text-3xl text-yellow-600 mr-4" />
              <div>
                <p className="text-gray-600">Featured Offers</p>
                <p className="text-2xl font-bold">{stats.featuredOffers || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiDollarSign className="text-3xl text-yellow-600 mr-4" />
              <div>
                <p className="text-gray-600">Total Claims</p>
                <p className="text-2xl font-bold">{stats.totalClaims || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Support Tickets Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Total Support Tickets</p>
                <p className="text-3xl font-bold">{stats.totalSupportTickets || 0}</p>
              </div>
              <FiMessageCircle className="text-4xl text-purple-200 opacity-80" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiClock className="text-3xl text-yellow-600 mr-4" />
              <div>
                <p className="text-gray-600">Open Tickets</p>
                <p className="text-2xl font-bold">{stats.openSupportTickets || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiClock className="text-3xl text-blue-600 mr-4" />
              <div>
                <p className="text-gray-600">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgressSupportTickets || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <FiCheckCircle className="text-3xl text-green-600 mr-4" />
              <div>
                <p className="text-gray-600">Resolved</p>
                <p className="text-2xl font-bold">{stats.resolvedSupportTickets || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Support Tickets */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <FiMessageCircle className="mr-2 text-purple-500" />
              Recent Support Tickets
            </h2>
            <button
              onClick={() => navigate('/support-tickets')}
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              View All →
            </button>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {supportTickets.length > 0 ? (
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
                  {supportTickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ticket.name}</div>
                        <div className="text-sm text-gray-500">{ticket.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ticket.issueType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate" title={ticket.description}>
                          {ticket.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {ticket.status === 'open' && (
                            <>
                              <button
                                onClick={() => handleStatusUpdate(ticket._id, 'in_progress')}
                                className="text-blue-600 hover:text-blue-900"
                                title="Mark In Progress"
                              >
                                <FiClock />
                              </button>
                              <button
                                onClick={() => handleStatusUpdate(ticket._id, 'resolved')}
                                className="text-green-600 hover:text-green-900"
                                title="Resolve"
                              >
                                <FiCheckCircle />
                              </button>
                            </>
                          )}
                          {ticket.status === 'in_progress' && (
                            <button
                              onClick={() => handleStatusUpdate(ticket._id, 'resolved')}
                              className="text-green-600 hover:text-green-900"
                              title="Resolve"
                            >
                              <FiCheckCircle />
                            </button>
                          )}
                          {ticket.status === 'resolved' && (
                            <button
                              onClick={() => handleStatusUpdate(ticket._id, 'closed')}
                              className="text-gray-600 hover:text-gray-900"
                              title="Close"
                            >
                              <FiXCircle />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FiMessageCircle className="mx-auto text-4xl text-gray-300 mb-2" />
                <p>No support tickets yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Featured Offers Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <FiStar className="mr-2 text-yellow-500" />
              Featured Offers
            </h2>
            <span className="text-sm text-gray-600">
              {offers.filter(o => o.isFeatured).length} featured offer(s)
            </span>
          </div>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {offers.filter(o => o.isFeatured).length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-yellow-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cashback
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {offers.filter(o => o.isFeatured).map((offer) => (
                    <tr key={offer._id} className="hover:bg-yellow-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FiStar className="text-yellow-500 mr-2" />
                          <div className="text-sm font-medium text-gray-900">{offer.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{offer.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-semibold">{offer.cashbackAmount}%</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          offer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {offer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(offer)}
                          className="text-primary-600 hover:text-primary-900 mr-4"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(offer._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <FiStar className="mx-auto text-4xl text-gray-300 mb-2" />
                <p>No featured offers yet. Mark offers as "Featured" to see them here.</p>
              </div>
            )}
          </div>
        </div>

        {/* All Offers Table */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold mb-4">All Offers</h2>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cashback
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {offers.map((offer) => (
                <tr key={offer._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{offer.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{offer.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{offer.cashbackAmount}%</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      offer.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {offer.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(offer)}
                      className="text-primary-600 hover:text-primary-900 mr-4"
                    >
                      <FiEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(offer._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FiTrash2 />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium mb-4">
                  {editingOffer ? 'Edit Offer' : 'Add New Offer'}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        name="title"
                        required
                        value={formData.title}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <input
                        type="text"
                        name="category"
                        required
                        value={formData.category}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        name="description"
                        required
                        rows="3"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cashback Amount (%)</label>
                      <input
                        type="number"
                        name="cashbackAmount"
                        required
                        step="0.01"
                        value={formData.cashbackAmount}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Currency</label>
                      <select
                        name="currency"
                        value={formData.currency}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                        <option value="INR">INR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min Amount</label>
                      <input
                        type="number"
                        name="minAmount"
                        step="0.01"
                        value={formData.minAmount}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Max Users</label>
                      <input
                        type="number"
                        name="maxUsers"
                        value={formData.maxUsers}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Instructions</label>
                      <textarea
                        name="instructions"
                        required
                        rows="3"
                        value={formData.instructions}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Offer Link</label>
                      <input
                        type="url"
                        name="offerLink"
                        required
                        value={formData.offerLink}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Trackier Offer ID</label>
                      <input
                        type="text"
                        name="trackierOfferId"
                        value={formData.trackierOfferId}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Image</label>
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleInputChange}
                        className="mt-1 block w-full"
                      />
                      {editingOffer && editingOffer.imageUrl && !formData.image && (
                        <img src={editingOffer.imageUrl} alt="Current" className="mt-2 h-20 w-20 object-cover rounded" />
                      )}
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary-600"
                      />
                      <label className="ml-2 text-sm text-gray-700">Active</label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="isFeatured"
                        checked={formData.isFeatured}
                        onChange={handleInputChange}
                        className="rounded border-gray-300 text-primary-600"
                      />
                      <label className="ml-2 text-sm text-gray-700">Featured</label>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-4 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        resetForm();
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                    >
                      {editingOffer ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;










