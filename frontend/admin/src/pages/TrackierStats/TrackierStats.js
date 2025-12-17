import React, { useState, useEffect } from 'react';
import { 
  FiMousePointer, 
  FiDownload, 
  FiDollarSign, 
  FiTrendingUp, 
  FiBarChart2,
  FiCalendar,
  FiRefreshCw,
  FiTrash2
} from 'react-icons/fi';
import { 
  getTrackierStats, 
  getTrackierClicks, 
  getTrackierInstalls, 
  getTrackierPayouts,
  deleteClick,
  deleteInstall,
  deletePayout
} from '../../services/adminService';

const TrackierStats = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, clicks, installs, payouts
  const [stats, setStats] = useState(null);
  const [clicks, setClicks] = useState([]);
  const [installs, setInstalls] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  const [hasSynced, setHasSynced] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, dateRange.startDate, dateRange.endDate, currentPage]);

  // Auto-refresh data every 30 seconds to show new installs/postbacks
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing admin panel data...');
      fetchData();
    }, 30000); // Refresh every 30 seconds

    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, [activeTab, dateRange.startDate, dateRange.endDate]); // Re-run when filters change

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.startDate) params.startDate = dateRange.startDate;
      if (dateRange.endDate) params.endDate = dateRange.endDate;

      console.log('Fetching Trackier stats:', { activeTab, params });

      if (activeTab === 'overview') {
        const data = await getTrackierStats(params);
        console.log('Overview stats received:', data);
        setStats(data);
      } else if (activeTab === 'clicks') {
        // Sync click status with postbacks on first load of clicks tab
        const syncParams = hasSynced ? params : { ...params, sync: 'true' };
        if (!hasSynced) {
          setHasSynced(true);
          console.log('🔄 Syncing click status with postbacks...');
        }
        const data = await getTrackierClicks({ ...syncParams, page: currentPage, limit: itemsPerPage });
        console.log('Clicks data received:', data);
        setClicks(data.clicks || []);
        setStats({ clicks: data.stats });
      } else if (activeTab === 'installs') {
        const data = await getTrackierInstalls(params);
        console.log('Installs data received:', data);
        setInstalls(data.installs || []);
        setStats({ installs: data.stats });
      } else if (activeTab === 'payouts') {
        const data = await getTrackierPayouts(params);
        console.log('Payouts data received:', data);
        setPayouts(data.payouts || []);
        setStats({ payouts: data.stats });
      }
      
      // Update last refreshed timestamp
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching Trackier stats:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      alert(`Error fetching statistics: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Reset to first page when date range changes
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  const handleDeleteClick = async (clickId, clickRecordId) => {
    if (!window.confirm(`Are you sure you want to delete this click record?\n\nClick ID: ${clickId}\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await deleteClick(clickRecordId);
      alert('Click record deleted successfully');
      fetchData(); // Refresh data
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error deleting click record';
      alert(errorMessage);
    }
  };

  const handleDeleteInstall = async (installId, clickId) => {
    if (!window.confirm(`Are you sure you want to delete this install/postback record?\n\nClick ID: ${clickId}\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await deleteInstall(installId);
      alert('Install/Postback record deleted successfully');
      fetchData(); // Refresh data
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error deleting install record';
      alert(errorMessage);
    }
  };

  const handleDeletePayout = async (payoutId, clickId, payoutAmount, userName) => {
    if (!window.confirm(`Are you sure you want to delete this payout record?\n\nClick ID: ${clickId}\nUser: ${userName || 'N/A'}\nAmount: ${payoutAmount}\n\nThis will:\n- Delete the payout record\n- Reverse the wallet update (deduct from user's wallet)\n- Mark click as not converted\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await deletePayout(payoutId);
      alert('Payout record deleted successfully. Wallet has been updated.');
      fetchData(); // Refresh data
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error deleting payout record';
      alert(errorMessage);
    }
  };

  if (loading && !stats) {
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
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <FiBarChart2 className="mr-2 text-primary-600" />
              Trackier Statistics
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ⚡ Auto-refreshes every 30 seconds
              {lastUpdated && ` • Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                console.log('🔄 Manual refresh triggered');
                setHasSynced(false); // Reset sync flag to sync again
                fetchData();
              }}
              disabled={loading}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition flex items-center disabled:opacity-50"
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh Now
            </button>
            {activeTab === 'clicks' && (
                    <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    console.log('🔄 Manual sync triggered');
                    const syncParams = { 
                      ...(dateRange.startDate ? { startDate: dateRange.startDate } : {}),
                      ...(dateRange.endDate ? { endDate: dateRange.endDate } : {}),
                      sync: 'true',
                      page: currentPage,
                      limit: itemsPerPage
                    };
                    console.log('Sync params:', syncParams);
                    const data = await getTrackierClicks(syncParams);
                    console.log('Sync response:', data);
                    setClicks(data.clicks || []);
                    setStats({ clicks: data.stats });
                    setHasSynced(false); // Reset to allow sync again
                    alert(`Click status synced! Found ${data.clicks?.length || 0} clicks.`);
                  } catch (error) {
                    console.error('Sync error:', error);
                    alert('Error syncing click status: ' + (error.response?.data?.message || error.message || 'Unknown error'));
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center disabled:opacity-50"
                title="Sync click status with postbacks (fix pending clicks)"
              >
                <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                Sync Status
              </button>
            )}
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex items-center space-x-4">
            <FiCalendar className="text-gray-500" />
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                  className="border border-gray-300 rounded-md px-3 py-2"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => {
                  setActiveTab('clicks');
                  setCurrentPage(1); // Reset to first page when switching tabs
                }}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                  activeTab === 'clicks'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Clicks
              </button>
              <button
                onClick={() => setActiveTab('installs')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                  activeTab === 'installs'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Installs
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition ${
                  activeTab === 'payouts'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Payouts
              </button>
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading statistics...</p>
                </div>
              </div>
            )}
            {!loading && !stats && (
              <div className="text-center py-12">
                <FiBarChart2 className="mx-auto text-6xl text-gray-300 mb-4" />
                <p className="text-gray-600 text-lg">No statistics available</p>
                <p className="text-gray-500 text-sm mt-2">Click the refresh button to load data</p>
              </div>
            )}
            {!loading && stats && (
              <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Total Clicks</p>
                    <p className="text-3xl font-bold">{stats.clicks?.total || 0}</p>
                    <p className="text-blue-100 text-xs mt-1">
                      {stats.clicks?.conversionRate || 0}% converted
                    </p>
                  </div>
                  <FiMousePointer className="text-4xl text-blue-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm mb-1">Total Installs</p>
                    <p className="text-3xl font-bold">{stats.installs?.total || 0}</p>
                    <p className="text-green-100 text-xs mt-1">
                      {stats.installs?.approvalRate || 0}% approved
                    </p>
                  </div>
                  <FiDownload className="text-4xl text-green-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm mb-1">Total Payouts</p>
                    <p className="text-3xl font-bold">{stats.payouts?.total || 0}</p>
                    <p className="text-yellow-100 text-xs mt-1">
                      Avg: {formatCurrency(stats.payouts?.averageAmount || 0)}
                    </p>
                  </div>
                  <FiDollarSign className="text-4xl text-yellow-200 opacity-80" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm mb-1">Total Payout Amount</p>
                    <p className="text-3xl font-bold">{formatCurrency(stats.payouts?.totalAmount || 0)}</p>
                    <p className="text-purple-100 text-xs mt-1">
                      {stats.overall?.conversionRate || 0}% conversion rate
                    </p>
                  </div>
                  <FiTrendingUp className="text-4xl text-purple-200 opacity-80" />
                </div>
              </div>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Clicks Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Clicks:</span>
                    <span className="font-semibold">{stats.clicks?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Converted Clicks:</span>
                    <span className="font-semibold text-green-600">{stats.clicks?.converted || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Conversion Rate:</span>
                    <span className="font-semibold">{stats.clicks?.conversionRate || 0}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Installs Statistics</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Installs:</span>
                    <span className="font-semibold">{stats.installs?.total || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approved:</span>
                    <span className="font-semibold text-green-600">{stats.installs?.approved || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rejected:</span>
                    <span className="font-semibold text-red-600">{stats.installs?.rejected || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Approval Rate:</span>
                    <span className="font-semibold">{stats.installs?.approvalRate || 0}%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Payouts Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-600 text-sm">Total Payouts</p>
                  <p className="text-2xl font-bold">{stats.payouts?.total || 0}</p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(stats.payouts?.totalAmount || 0)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Average Payout</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stats.payouts?.averageAmount || 0)}
                  </p>
                </div>
              </div>
            </div>
              </>
            )}
          </div>
        )}

        {/* Clicks Tab */}
        {activeTab === 'clicks' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Clicks</h2>
              {stats?.clicks && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{stats.clicks.total}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Converted</p>
                    <p className="text-2xl font-bold text-green-600">{stats.clicks.converted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold">{stats.clicks.conversionRate}%</p>
                  </div>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Click ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clicks.map((click) => (
                    <tr key={click._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {click.userId?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{click.userId?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{click.offerId?.title || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">{click.clickId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{click.ipAddress || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          click.converted 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {click.converted ? 'Converted' : 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(click.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeleteClick(click.clickId, click._id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Delete Click Record"
                        >
                          <FiTrash2 className="mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {stats?.clicks?.totalPages > 1 && (
              <div className="bg-white px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, stats.clicks.total)} of {stats.clicks.total} clicks
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, stats.clicks.totalPages) }, (_, i) => {
                        let pageNum;
                        if (stats.clicks.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= stats.clicks.totalPages - 2) {
                          pageNum = stats.clicks.totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 text-sm font-medium rounded-md ${
                              currentPage === pageNum
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(stats.clicks.totalPages, prev + 1))}
                      disabled={currentPage === stats.clicks.totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Installs Tab */}
        {activeTab === 'installs' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Installs / Conversions</h2>
              {stats?.installs && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{stats.installs.total || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-green-600">{stats.installs.approved || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Rejected</p>
                    <p className="text-2xl font-bold text-red-600">{stats.installs.rejected || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Payout</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.installs.totalPayout || 0)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Incoming</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.installs.incoming || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Outgoing</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.installs.outgoing || 0}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              {installs.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Click ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {installs.map((install) => (
                      <tr key={install._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {install.userId?.name || 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">{install.userId?.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{install.offerId?.title || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">{install.clickId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-green-600">
                            {formatCurrency(install.payout)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            install.status === 1 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {install.status === 1 ? 'Approved' : 'Rejected'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            install.source === 'incoming'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {install.source === 'incoming' ? 'Incoming' : 'Outgoing'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(install.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleDeleteInstall(install._id, install.clickId)}
                            className="text-red-600 hover:text-red-900 flex items-center"
                            title="Delete Install/Postback Record"
                          >
                            <FiTrash2 className="mr-1" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <FiDownload className="mx-auto text-4xl text-gray-300 mb-2" />
                  <p>No installs/conversions found</p>
                  <p className="text-sm mt-2">Installs will appear here when users claim offers or when Trackier sends postbacks.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payouts Tab */}
        {activeTab === 'payouts' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold">Payouts</h2>
              {stats?.payouts && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Payouts</p>
                    <p className="text-2xl font-bold">{stats.payouts.totalPayouts}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats.payouts.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Average Payout</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stats.payouts.averagePayout)}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Offer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Click ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payouts.map((payout) => (
                    <tr key={payout._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {payout.userId?.name || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">{payout.userId?.email || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payout.offerId?.title || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-mono">{payout.clickId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-green-600">
                          {formatCurrency(payout.payout)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payout.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleDeletePayout(
                            payout._id, 
                            payout.clickId, 
                            payout.payout, 
                            payout.userId?.name
                          )}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Delete Payout (will reverse wallet update)"
                        >
                          <FiTrash2 className="mr-1" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackierStats;

