import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useState } from "react";
import { toast } from "sonner";

export function ItemDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapType, setSwapType] = useState<"item" | "points">("item");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [pointsOffered, setPointsOffered] = useState("");
  const [message, setMessage] = useState("");

  const item = useQuery(api.items.getItemById, id ? { itemId: id as any } : "skip");
  const profile = useQuery(api.profiles.getCurrentProfile);
  const userItems = useQuery(api.items.getUserItems);
  const createSwapRequest = useMutation(api.swaps.createSwapRequest);
  const toggleFavorite = useMutation(api.items.toggleFavorite);

  if (item === undefined || profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Item not found</h2>
          <p className="text-gray-600 mb-6">The item you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/browse"
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Browse Other Items
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = item.uploaderId === profile?.userId;
  const availableUserItems = userItems?.filter(userItem => 
    userItem.status === "approved" && 
    userItem.isAvailable && 
    userItem._id !== item._id
  ) || [];

  const conditionColors = {
    "like-new": "bg-green-100 text-green-800",
    "excellent": "bg-blue-100 text-blue-800",
    "good": "bg-yellow-100 text-yellow-800",
    "fair": "bg-orange-100 text-orange-800",
  };

  const handleSwapRequest = async () => {
    try {
      if (swapType === "item" && !selectedItemId) {
        toast.error("Please select an item to offer");
        return;
      }
      if (swapType === "points" && (!pointsOffered || parseInt(pointsOffered) <= 0)) {
        toast.error("Please enter a valid point amount");
        return;
      }

      await createSwapRequest({
        ownerItemId: item._id as any,
        requesterItemId: selectedItemId as any,

        message: message || undefined,

      });

      toast.success("Swap request sent!");
      setShowSwapModal(false);
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to send swap request");
      console.error(error);
    }
  };

  const handleToggleFavorite = async () => {
    try {
      await toggleFavorite({ itemId: item._id as any });
      toast.success("Favorite updated!");
    } catch (error) {
      toast.error("Failed to update favorite");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-green-700 mb-6"
        >
          <span>←</span>
          <span>Back</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-2xl bg-white shadow-lg">
              <img
                src={item.imageUrls?.[0] || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=600&fit=crop"}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            {item.imageUrls && item.imageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {item.imageUrls.slice(1, 5).map((url, index) => (
                  <div key={index} className="aspect-square overflow-hidden rounded-lg bg-white shadow">
                    <img
                      src={url || ""}
                      alt={`${item.title} ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{item.title}</h1>
              <div className="flex items-center space-x-4 mb-4">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  conditionColors[item.condition as keyof typeof conditionColors]
                }`}>
                  {item.condition}
                </span>
                <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                  Size {item.size}
                </span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  {item.pointValue} pts
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>

              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{item.description}</p>
            </div>

            {/* Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Category</h4>
                <p className="text-gray-600 capitalize">{item.category}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Type</h4>
                <p className="text-gray-600 capitalize">{item.type}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-1">Color</h4>
                <p className="text-gray-600 capitalize">{item.color}</p>
              </div>
              {item.brand && (
                <div>
                  <h4 className="font-medium text-gray-800 mb-1">Brand</h4>
                  <p className="text-gray-600">{item.brand}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {item.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Owner Info */}
            <div className="border-t pt-6">
              <h4 className="font-medium text-gray-800 mb-3">Listed by</h4>
              <div className="flex items-center space-x-3">
                {item.uploader.avatar ? (
                  <img
                    src={item.uploader.avatar}
                    alt={item.uploader.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <span className="text-green-700 font-medium">
                      {item.uploader.name[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-800">{item.uploader.name}</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
    
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-6">
              {!isOwner && item.isAvailable && (
                <button
                  onClick={() => setShowSwapModal(true)}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Request Swap
                </button>
              )}
              
              <button
                onClick={handleToggleFavorite}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ❤️ Save
              </button>
            </div>

            {!item.isAvailable && (
              <div className="bg-gray-100 text-gray-600 px-4 py-3 rounded-lg text-center">
                This item is no longer available
              </div>
            )}
          </div>
        </div>

        {/* Swap Modal */}
        {showSwapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-gray-800">Request Swap</h3>
                  <button
                    onClick={() => setShowSwapModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                {/* Swap Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Swap Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSwapType("item")}
                      className={`p-3 rounded-lg border text-center ${
                        swapType === "item"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-2xl mb-1">🔄</div>
                      <div className="text-sm font-medium">Item Swap</div>
                    </button>
                    <button
                      onClick={() => setSwapType("points")}
                      className={`p-3 rounded-lg border text-center ${
                        swapType === "points"
                          ? "border-green-500 bg-green-50 text-green-700"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="text-2xl mb-1">🌱</div>
                      <div className="text-sm font-medium">Point Redemption</div>
                    </button>
                  </div>
                </div>

                {/* Item Selection */}
                {swapType === "item" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Item to Offer
                    </label>
                    {availableUserItems.length > 0 ? (
                      <select
                        value={selectedItemId}
                        onChange={(e) => setSelectedItemId(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">Choose an item...</option>
                        {availableUserItems.map((userItem) => (
                          <option key={userItem._id} value={userItem._id}>
                            {userItem.title} - {userItem.pointValue} pts
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <p>You don't have any available items to offer.</p>
                        <Link
                          to="/add-item"
                          className="text-green-600 hover:text-green-700 font-medium"
                        >
                          List an item first →
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* Points Input */}
                {swapType === "points" && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points to Offer
                    </label>
                    <input
                      type="number"
                      value={pointsOffered}
                      onChange={(e) => setPointsOffered(e.target.value)}
                      placeholder={`Suggested: ${item.pointValue} points`}
                      min="1"
                      max={profile?.points || 0}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      You have {profile?.points || 0} points available
                    </p>
                  </div>
                )}

                {/* Message */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal message..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowSwapModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSwapRequest}
                    disabled={
                      (swapType === "item" && !selectedItemId) ||
                      (swapType === "points" && (!pointsOffered || parseInt(pointsOffered) <= 0))
                    }
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send Request
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
