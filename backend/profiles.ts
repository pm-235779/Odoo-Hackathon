import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get current user's profile
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      return null; // Profile should be created elsewhere
    }

    // Get avatar URL if avatar exists
    let avatarUrl = null;
    if (profile.avatar) {
      avatarUrl = await ctx.storage.getUrl(profile.avatar);
    }

    return {
      ...profile,
      avatarUrl,
    };
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    displayName: v.string(),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    avatar: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile) {
      throw new Error("Profile not found");
    }

    await ctx.db.patch(profile._id, {
      displayName: args.displayName,
      bio: args.bio,
      location: args.location,
      avatar: args.avatar,
    });

    return profile._id;
  },
});

// Get user's point transactions
export const getPointTransactions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const transactions = await ctx.db
      .query("pointTransactions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(50);

    return transactions;
  },
});

// Get profile by user ID (for viewing other users)
export const getProfileByUserId = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) return null;

    // Get avatar URL if avatar exists
    let avatarUrl = null;
    if (profile.avatar) {
      avatarUrl = await ctx.storage.getUrl(profile.avatar);
    }

    const user = await ctx.db.get(args.userId);

    return {
      ...profile,
      avatarUrl,
      user: {
        name: user?.name,
        email: user?.email,
      },
    };
  },
});

// Check if current user is admin
export const isCurrentUserAdmin = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;

    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    return profile?.isAdmin || false;
  },
});

// Ensure profile exists
export const ensureProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing._id;

    const user = await ctx.db.get(userId);
    
    // Define admin email addresses
    const adminEmails = [
      "odoo@hackathon",
      "admin@rewear.com",
      "admin@example.com",
      // Add more admin emails as needed
    ];
    
    const isAdmin = user?.email && adminEmails.includes(user.email);
    
    return await ctx.db.insert("profiles", {
      userId,
      displayName: user?.name || user?.email || "Anonymous User",
      points: 0,
      totalItemsListed: 0,
      totalSwapsCompleted: 0,
      joinedAt: Date.now(),
      isAdmin: isAdmin || false,
    });
  },
});
