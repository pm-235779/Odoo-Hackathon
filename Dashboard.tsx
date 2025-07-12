import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link } from "react-router-dom";
import { ItemCard } from "../components/ItemCard";
import { PointsLeaderboard } from "../components/PointsLeaderboard";
import { PointsInfo } from "../components/PointsInfo";
import { toast } from "sonner";

export function Dashboard() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const userItems = useQuery(api.items.getUserItems);
  const userFavorites = useQuery(api.items.getUserFavorites);
  const sentRequests = useQuery(api.swaps.getUserSwapRequests);
  const receivedRequests = useQuery(api.swaps.getReceivedSwapRequests);
  const pointTransactions = useQuery(api.profiles.getPointTransactions);
  const isAdmin = useQuery(api.profiles.isCurrentUserAdmin);

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const pendingReceivedRequests = receivedRequests?.filter(req => req.status === "pending") || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-green-800 mb-2">
                Welcome back, {profile?.displayName}!
              </h1>
              <p className="text-lg text-gray-600">
                Manage your items, track swaps, and grow your eco-impact
              </p>
            </div>

          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 ${profile?.isAdmin ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-6 mb-8`}>
          {!profile?.isAdmin && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Eco Points</p>
                  <p className="text-3xl font-bold text-green-600">{profile?.points || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🌱</span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Items Listed</p>
                <p className="text-3xl font-bold text-blue-600">{profile?.totalItemsListed || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Swaps Completed</p>
                <p className="text-3xl font-bold text-purple-600">{profile?.totalSwapsCompleted || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔄</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Requests Alert */}
        {pendingReceivedRequests.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h3 className="font-semibold text-yellow-800">
                    You have {pendingReceivedRequests.length} pending swap request{pendingReceivedRequests.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-yellow-700">Review and respond to incoming swap requests</p>
                </div>
              </div>
              <Link
                to="/swaps"
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
              >
                View Requests
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/add-item"
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                <span className="text-3xl">➕</span>
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">List New Item</h3>
              <p className="text-gray-600">Add clothes to your wardrobe and earn points</p>
            </div>
          </Link>

          <Link
            to="/browse"
            className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow group"
          >
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="font-semibold text-lg text-gray-800 mb-2">Browse Items</h3>
              <p className="text-gray-600">Discover amazing pre-loved fashion</p>
            </div>
          </Link>
        </div>

        {/* My Items */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Items</h2>
            <Link
              to="/add-item"
              className="text-green-600 hover:text-green-700 font-medium"
            >
              Add New Item →
            </Link>
          </div>
          
          {userItems === undefined ? (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading your items...</p>
            </div>
          ) : userItems && userItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userItems.slice(0, 8).map((item) => (
                <div key={item._id} className="relative">
                  <ItemCard item={item as any} />
                  <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium z-10 ${
                    item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    item.status === 'approved' ? 'bg-green-100 text-green-800' :
                    item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {item.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No items yet</h3>
              <p className="text-gray-600 mb-6">Start by listing your first item to earn points!</p>
              <Link
                to="/add-item"
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                List Your First Item
              </Link>
            </div>
          )}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Favorites */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Favorites</h2>
              <Link
                to="/browse"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Browse More →
              </Link>
            </div>
          
          {userFavorites && userFavorites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {userFavorites.slice(0, 4).map((item) => 
                item && <ItemCard key={item._id} item={item as any} />
              )}
            </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                <div className="text-6xl mb-4">❤️</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No favorites yet</h3>
                <p className="text-gray-600 mb-6">Browse items and save your favorites!</p>
                <Link
                  to="/browse"
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Start Browsing
                </Link>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {!profile?.isAdmin && <PointsInfo />}
            <PointsLeaderboard />
          </div>
        </div>
      </div>
    </div>
  );
}
