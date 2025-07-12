import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function AdminPanel() {
  // Removed selectedStatus since we only show pending items
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [isPopulating, setIsPopulating] = useState(false);

  const isAdmin = useQuery(api.profiles.isCurrentUserAdmin);
  const stats = useQuery(api.admin.getAdminStats);
  const items = useQuery(api.admin.getPendingItems);
  
  const reviewItem = useMutation(api.admin.reviewItem);
  const populateData = useMutation(api.populateData.populateWithTestData);

  if (isAdmin === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleApprove = async (itemId: string) => {
    try {
      await reviewItem({ itemId: itemId as any, action: "approve" });
      toast.success("Item approved successfully!");
    } catch (error) {
      toast.error("Failed to approve item");
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      await reviewItem({ 
        itemId: selectedItemId as any, 
        action: "reject",
        rejectionReason: rejectReason 
      });
      toast.success("Item rejected");
      setShowRejectModal(false);
      setRejectReason("");
      setSelectedItemId("");
    } catch (error) {
      toast.error("Failed to reject item");
    }
  };

  // Remove delete functionality for now

  const handlePopulateData = async () => {
    if (!confirm("This will add 100 new users and 100 new items to the database. Continue?")) {
      return;
    }

    setIsPopulating(true);
    try {
      const result = await populateData({});
      toast.success(`Successfully added ${result.usersCreated} users and ${result.itemsCreated} items!`);
    } catch (error) {
      toast.error("Failed to populate data");
      console.error(error);
    } finally {
      setIsPopulating(false);
    }
  };

  const openRejectModal = (itemId: string) => {
    setSelectedItemId(itemId);
    setShowRejectModal(true);
  };

  const statusOptions = [
    { value: "pending", label: "Pending Review" },
    { value: "approved", label: "Approved" },
    { value: "rejected", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">Admin Panel</h1>
          <p className="text-lg text-gray-600">Manage items and monitor platform activity</p>
        </div>

        {/* Data Population */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Populate Test Data</h3>
              <p className="text-gray-600">Add 100 users and 100 items for testing and demo purposes</p>
            </div>
            <button
              onClick={handlePopulateData}
              disabled={isPopulating}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPopulating ? "Adding Data..." : "Add Test Data"}
            </button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
              <div className="text-sm text-gray-600">Total Items</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingItems}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-2xl font-bold text-green-600">{stats.approvedItems}</div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Users</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-2xl font-bold text-indigo-600">{stats.totalSwaps}</div>
              <div className="text-sm text-gray-600">Total Swaps</div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-4">
              <div className="text-2xl font-bold text-emerald-600">{stats.totalSwaps}</div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </div>
        )}

        {/* Pending Items Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800">Pending Items for Review</h2>
          <p className="text-gray-600">Review and approve or reject submitted items</p>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Items ({items?.length || 0})
            </h2>
          </div>

          {items && items.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {items.map((item: any) => (
                <div key={item._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          📷
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 truncate">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            by {item.uploader.name} ({item.uploader.email})
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className="text-sm text-gray-500">
                              {item.category} • Size {item.size} • {item.condition}
                            </span>
                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                              {item.pointValue} pts
                            </span>
                          </div>
                          {item.rejectionReason && (
                            <p className="text-sm text-red-600 mt-2">
                              Rejection reason: {item.rejectionReason}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2 ml-4">
                          {item.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleApprove(item._id)}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 transition-colors text-sm"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => openRejectModal(item._id)}
                                className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-700 transition-colors text-sm"
                              >
                                Reject
                              </button>
                            </>
                          )}

                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                No items found
              </h3>
              <p className="text-gray-600">
                No pending items to review at the moment.
              </p>
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Reject Item</h3>
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Please provide a clear reason for rejection..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowRejectModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject Item
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
