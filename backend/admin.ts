import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Get all pending items for admin review
export const getPendingItems = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile?.isAdmin) {
      throw new Error("Not authorized - admin access required");
    }

    const items = await ctx.db
      .query("items")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")
      .collect();

    return Promise.all(
      items.map(async (item) => {
        const uploader = await ctx.db.get(item.uploaderId);
        const uploaderProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", item.uploaderId))
          .first();

        // Get first image URL
        const imageUrl = item.images.length > 0 
          ? await ctx.storage.getUrl(item.images[0])
          : null;

        return {
          ...item,
          imageUrl,
          uploader: {
            name: uploader?.name || uploaderProfile?.displayName || uploader?.email || "Anonymous",
            email: uploader?.email,
          },
        };
      })
    );
  },
});

// Approve or reject an item
export const reviewItem = mutation({
  args: {
    itemId: v.id("items"),
    action: v.union(v.literal("approve"), v.literal("reject")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile?.isAdmin) {
      throw new Error("Not authorized - admin access required");
    }

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");
    if (item.status !== "pending") throw new Error("Item already reviewed");

    if (args.action === "approve") {
      // Approve the item
      await ctx.db.patch(args.itemId, {
        status: "approved",
        isAvailable: true,
      });

      // Award points to the uploader for listing the item (only on approval)
      await ctx.runMutation(api.points.awardPoints, {
        userId: item.uploaderId,
        amount: 5,
        type: "item_listed",
        description: "Points earned for approved item listing",
        relatedItemId: args.itemId,
      });

      // Create notification for uploader
      await ctx.db.insert("notifications", {
        userId: item.uploaderId,
        type: "item_approved",
        title: "Item Approved!",
        message: `Your item "${item.title}" has been approved and is now live. You earned 5 points!`,
        isRead: false,
        relatedItemId: args.itemId,
      });
    } else {
      // Reject the item
      await ctx.db.patch(args.itemId, {
        status: "rejected",
        rejectionReason: args.rejectionReason,
      });

      // Create notification for uploader
      await ctx.db.insert("notifications", {
        userId: item.uploaderId,
        type: "item_rejected",
        title: "Item Rejected",
        message: `Your item "${item.title}" was rejected. ${args.rejectionReason || "Please review our guidelines and try again."}`,
        isRead: false,
        relatedItemId: args.itemId,
      });
    }

    return args.itemId;
  },
});

// Get admin dashboard stats
export const getAdminStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile?.isAdmin) {
      throw new Error("Not authorized - admin access required");
    }

    const [pendingItems, totalItems, totalUsers, totalSwaps] = await Promise.all([
      ctx.db.query("items").withIndex("by_status", (q) => q.eq("status", "pending")).collect(),
      ctx.db.query("items").collect(),
      ctx.db.query("profiles").collect(),
      ctx.db.query("swaps").collect(),
    ]);

    return {
      pendingItems: pendingItems.length,
      totalItems: totalItems.length,
      totalUsers: totalUsers.length,
      totalSwaps: totalSwaps.length,
      approvedItems: totalItems.filter(item => item.status === "approved").length,
      rejectedItems: totalItems.filter(item => item.status === "rejected").length,
    };
  },
});

// Get all users for admin management
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user is admin
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!profile?.isAdmin) {
      throw new Error("Not authorized - admin access required");
    }

    const profiles = await ctx.db.query("profiles").collect();
    
    return Promise.all(
      profiles.map(async (profile) => {
        const user = await ctx.db.get(profile.userId);
        return {
          ...profile,
          user: {
            name: user?.name,
            email: user?.email,
          },
        };
      })
    );
  },
});

// Toggle admin status for a user
export const toggleAdminStatus = mutation({
  args: {
    targetUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if current user is admin
    const currentUserProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (!currentUserProfile?.isAdmin) {
      throw new Error("Not authorized - admin access required");
    }

    // Don't allow users to remove their own admin status
    if (userId === args.targetUserId) {
      throw new Error("Cannot modify your own admin status");
    }

    const targetProfile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.targetUserId))
      .first();

    if (!targetProfile) {
      throw new Error("User profile not found");
    }

    await ctx.db.patch(targetProfile._id, {
      isAdmin: !targetProfile.isAdmin,
    });

    return targetProfile._id;
  },
});

// Make current user admin (for initial setup)
export const makeCurrentUserAdmin = mutation({
  args: {},
  handler: async (ctx) => {
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
      isAdmin: true,
    });

    return profile._id;
  },
});
