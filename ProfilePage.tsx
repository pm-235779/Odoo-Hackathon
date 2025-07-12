import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ProfilePage() {
  const profile = useQuery(api.profiles.getCurrentProfile);
  const updateProfile = useMutation(api.profiles.updateProfile);
  const generateUploadUrl = useMutation(api.items.generateUploadUrl);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    location: "",
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize form data when profile loads
  React.useEffect(() => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        location: profile.location || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;

    try {
      setIsUploading(true);
      let avatarId = profile.avatar;

      // Upload new avatar if selected
      if (avatarFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": avatarFile.type },
          body: avatarFile,
        });
        
        if (!result.ok) {
          throw new Error("Failed to upload avatar");
        }
        
        const { storageId } = await result.json();
        avatarId = storageId;
      }

      await updateProfile({
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        avatar: avatarId,
      });

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      setAvatarFile(null);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Profile update error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || "",
        bio: profile.bio || "",
        location: profile.location || "",
      });
    }
    setIsEditing(false);
    setAvatarFile(null);
  };

  if (profile === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile not found</h2>
          <p className="text-gray-600">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-green-800 mb-2">My Profile</h1>
          <p className="text-lg text-gray-600">
            Manage your personal information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Profile Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Edit Profile
                  </button>
                )}
              </div>

              {/* Avatar Section */}
              <div className="flex items-center space-x-6 mb-8">
                <div className="relative">
                  {profile.avatar ? (
                    <img
                      src={profile.avatarUrl || ""}
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover border-4 border-green-100"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-green-200 rounded-full flex items-center justify-center border-4 border-green-100">
                      <span className="text-3xl font-bold text-green-700">
                        {profile.displayName?.[0]?.toUpperCase() || "U"}
                      </span>
                    </div>
                  )}
                  
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-green-600 text-white p-2 rounded-full cursor-pointer hover:bg-green-700 transition-colors">
                      <span className="text-xs">📷</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {profile.displayName || "Anonymous User"}
                  </h3>
                  <p className="text-gray-600">Member since {new Date(profile.joinedAt || Date.now()).toLocaleDateString()}</p>
                  {avatarFile && (
                    <p className="text-sm text-green-600 mt-1">New avatar selected</p>
                  )}
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your display name"
                    />
                  ) : (
                    <p className="text-gray-800 py-2">{profile.displayName || "Not set"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  {isEditing ? (
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                      placeholder="Tell us about yourself..."
                    />
                  ) : (
                    <p className="text-gray-800 py-2">{profile.bio || "No bio added yet"}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your location"
                    />
                  ) : (
                    <p className="text-gray-800 py-2">{profile.location || "Not set"}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex space-x-4 mt-8">
                  <button
                    onClick={handleSave}
                    disabled={isUploading}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isUploading}
                    className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            {/* Points Card */}
            {!profile.isAdmin && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌱</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">Eco Points</h3>
                  <p className="text-3xl font-bold text-green-600">{profile.points}</p>
                  <p className="text-sm text-gray-600 mt-2">Keep swapping to earn more!</p>
                </div>
              </div>
            )}

            {/* Stats Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Items Listed</span>
                  <span className="font-semibold text-blue-600">{profile.totalItemsListed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Swaps Completed</span>
                  <span className="font-semibold text-purple-600">{profile.totalSwapsCompleted}</span>
                </div>
                {profile.isAdmin && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Role</span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      Admin
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Achievement Card */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Achievements</h3>
              <div className="space-y-3">
                {profile.totalItemsListed >= 1 && (
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🎯</span>
                    <span className="text-sm text-green-700">First Item Listed</span>
                  </div>
                )}
                {profile.totalSwapsCompleted >= 1 && (
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🔄</span>
                    <span className="text-sm text-green-700">First Swap Completed</span>
                  </div>
                )}
                {profile.totalSwapsCompleted >= 10 && (
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🏆</span>
                    <span className="text-sm text-green-700">Swap Master</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
