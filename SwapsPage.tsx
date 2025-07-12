import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import { Link } from "react-router-dom";

export function SwapsPage() {
  const sentRequests = useQuery(api.swaps.getUserSwapRequests);
  const receivedRequests = useQuery(api.swaps.getReceivedSwapRequests);
  const respondToSwap = useMutation(api.swaps.respondToSwapRequest);
  const completeSwap = useMutation(api.swaps.completeSwap);

  const [selectedSwap, setSelectedSwap] = useState<any>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");

  const handleRespond = async (response: "accepted" | "rejected") => {
    if (!selectedSwap) return;

    try {
      await respondToSwap({
        swapId: selectedSwap._id,
        response,
        rejectionReason: response === "rejected" ? responseMessage || undefined : undefined,
      });
      toast.success(`Swap ${response} successfully!`);
      setShowResponseModal(false);
      setSelectedSwap(null);
      setResponseMessage("");
    } catch (error) {
      toast.error(`Failed to ${response} swap`);
    }
  };

  const handleComplete = async (swapId: string) => {
    try {
      await completeSwap({ swapId: swapId as any });
      toast.success("Swap marked as completed!");
    } catch (error) {
      toast.error("Failed to complete swap");
    }
  };

  const openResponseModal = (swap: any) => {
    setSelectedSwap(swap);
    setShowResponseModal(true);
  };

  if (sentRequests === undefined || receivedRequests === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">My Swaps</h1>
          <p className="text-lg text-gray-600">
            Manage your swap requests and track exchanges
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sent Requests</p>
                <p className="text-3xl font-bold text-blue-600">{sentRequests?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📤</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Received Requests</p>
                <p className="text-3xl font-bold text-purple-600">{receivedRequests?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📥</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {[...sentRequests || [], ...receivedRequests || []].filter(s => s.status === "pending").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sent Requests */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Sent Requests</h2>
            
            {sentRequests && sentRequests.length > 0 ? (
              <div className="space-y-4">
                {sentRequests.map((swap) => (
                  <div key={swap._id} className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        swap.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        swap.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        swap.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {swap.status}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(swap._creationTime).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Requested Item */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Requested Item</h4>
                        {swap.ownerItem ? (
                          <Link
                            to={`/item/${swap.ownerItem._id}`}
                            className="block hover:bg-gray-50 rounded-lg p-3 border"
                          >
                            <h5 className="font-medium text-gray-800">{swap.ownerItem.title}</h5>
                            <p className="text-sm text-gray-600">
                              {swap.ownerItem.category} • Size {swap.ownerItem.size}
                            </p>
                            <p className="text-sm text-green-600">
                              {swap.ownerItem.pointValue} points
                            </p>
                          </Link>
                        ) : (
                          <p className="text-gray-500">Item not found</p>
                        )}
                      </div>

                      {/* Your Offered Item */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Your Item</h4>
                        {swap.requesterItem ? (
                          <Link
                            to={`/item/${swap.requesterItem._id}`}
                            className="block hover:bg-gray-50 rounded-lg p-3 border"
                          >
                            <h5 className="font-medium text-gray-800">{swap.requesterItem.title}</h5>
                            <p className="text-sm text-gray-600">
                              {swap.requesterItem.category} • Size {swap.requesterItem.size}
                            </p>
                            <p className="text-sm text-green-600">
                              {swap.requesterItem.pointValue} points
                            </p>
                          </Link>
                        ) : (
                          <p className="text-gray-500">Item not found</p>
                        )}
                      </div>
                    </div>

                    {/* Owner Info */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-sm text-gray-600">
                        Owner: <strong>{swap.owner?.name}</strong>
                      </span>
                    </div>

                    {/* Message */}
                    {swap.message && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700">{swap.message}</p>
                      </div>
                    )}

                    {/* Response Message */}
                    {swap.rejectionReason && (
                      <div className="bg-red-50 rounded-lg p-3 mb-4">
                        <strong>Rejection Reason:</strong> {swap.rejectionReason}
                      </div>
                    )}

                    {/* Actions */}
                    {swap.status === "accepted" && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleComplete(swap._id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark as Completed
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">📤</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No sent requests</h3>
                <p className="text-gray-600">Start browsing items to make swap requests!</p>
              </div>
            )}
          </div>

          {/* Received Requests */}
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Received Requests</h2>
            
            {receivedRequests && receivedRequests.length > 0 ? (
              <div className="space-y-4">
                {receivedRequests.map((swap) => (
                  <div key={swap._id} className="bg-white rounded-2xl shadow-lg p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        swap.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        swap.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        swap.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {swap.status}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(swap._creationTime).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* Your Item */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Your Item</h4>
                        {swap.ownerItem ? (
                          <Link
                            to={`/item/${swap.ownerItem._id}`}
                            className="block hover:bg-gray-50 rounded-lg p-3 border"
                          >
                            <h5 className="font-medium text-gray-800">{swap.ownerItem.title}</h5>
                            <p className="text-sm text-gray-600">
                              {swap.ownerItem.category} • Size {swap.ownerItem.size}
                            </p>
                            <p className="text-sm text-green-600">
                              {swap.ownerItem.pointValue} points
                            </p>
                          </Link>
                        ) : (
                          <p className="text-gray-500">Item not found</p>
                        )}
                      </div>

                      {/* Their Offered Item */}
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Their Item</h4>
                        {swap.requesterItem ? (
                          <Link
                            to={`/item/${swap.requesterItem._id}`}
                            className="block hover:bg-gray-50 rounded-lg p-3 border"
                          >
                            <h5 className="font-medium text-gray-800">{swap.requesterItem.title}</h5>
                            <p className="text-sm text-gray-600">
                              {swap.requesterItem.category} • Size {swap.requesterItem.size}
                            </p>
                            <p className="text-sm text-green-600">
                              {swap.requesterItem.pointValue} points
                            </p>
                          </Link>
                        ) : (
                          <p className="text-gray-500">Item not found</p>
                        )}
                      </div>
                    </div>

                    {/* Requester Info */}
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-sm text-gray-600">
                        From: <strong>{swap.requester?.name}</strong>
                      </span>
                    </div>

                    {/* Message */}
                    {swap.message && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <p className="text-sm text-gray-700">{swap.message}</p>
                      </div>
                    )}

                    {/* Response Message */}
                    {swap.rejectionReason && (
                      <div className="bg-red-50 rounded-lg p-3 mb-4">
                        <strong>Your Rejection Reason:</strong> {swap.rejectionReason}
                      </div>
                    )}

                    {/* Actions */}
                    {swap.status === "pending" && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleRespond("accepted")}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => openResponseModal(swap)}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}

                    {swap.status === "accepted" && (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleComplete(swap._id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Mark as Completed
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">📥</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No received requests</h3>
                <p className="text-gray-600">When others want to swap with your items, they'll appear here!</p>
              </div>
            )}
          </div>
        </div>

        {/* Response Modal */}
        {showResponseModal && selectedSwap && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">Reject Swap Request</h3>
                  <button
                    onClick={() => setShowResponseModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason (Optional)
                  </label>
                  <textarea
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder="Let them know why you're rejecting this swap..."
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowResponseModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRespond("rejected")}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject Swap
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
