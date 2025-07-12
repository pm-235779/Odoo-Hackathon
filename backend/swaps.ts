import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { calculateRedemptionPoints } from "./points";
import { api } from "./_generated/api";

// Create swap request
export const createSwapRequest = mutation({
  args: {
    ownerItemId: v.id("items"),
    requesterItemId: v.id("items"),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const ownerItem = await ctx.db.get(args.ownerItemId);
    if (!ownerItem) throw new Error("Item not found");
    if (!ownerItem.isAvailable) throw new Error("Item not available");
    if (ownerItem.uploaderId === userId) throw new Error("Cannot swap your own item");

    const requesterItem = await ctx.db.get(args.requesterItemId);
    if (!requesterItem) throw new Error("Your item not found");
    if (!requesterItem.isAvailable) throw new Error("Your item not available");
    if (requesterItem.uploaderId !== userId) throw new Error("You don't own this item");

    const swapId = await ctx.db.insert("swaps", {
      requesterId: userId,
      ownerId: ownerItem.uploaderId,
      requesterItemId: args.requesterItemId,
      ownerItemId: args.ownerItemId,
      status: "pending",
      message: args.message,
    });

    // Create notification for item owner
    await ctx.db.insert("notifications", {
      userId: ownerItem.uploaderId,
      type: "swap_request",
      title: "New Swap Request",
      message: `Someone wants to swap for your ${ownerItem.title}`,
      isRead: false,
      relatedItemId: args.ownerItemId,
      relatedSwapId: swapId,
    });

    return swapId;
  },
});

// Respond to swap request
export const respondToSwapRequest = mutation({
  args: {
    swapId: v.id("swaps"),
    response: v.union(v.literal("accepted"), v.literal("rejected")),
    rejectionReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const swap = await ctx.db.get(args.swapId);
    if (!swap) throw new Error("Swap not found");
    if (swap.ownerId !== userId) throw new Error("Not authorized");
    if (swap.status !== "pending") throw new Error("Swap already processed");

    await ctx.db.patch(args.swapId, {
      status: args.response,
      rejectionReason: args.rejectionReason,
    });

    if (args.response === "accepted") {
      // Mark items as unavailable
      await ctx.db.patch(swap.ownerItemId, { isAvailable: false });
      await ctx.db.patch(swap.requesterItemId, { isAvailable: false });
    }

    // Create notification for requester
    const ownerItem = await ctx.db.get(swap.ownerItemId);
    await ctx.db.insert("notifications", {
      userId: swap.requesterId,
      type: args.response === "accepted" ? "swap_accepted" : "swap_rejected",
      title: args.response === "accepted" ? "Swap Accepted!" : "Swap Rejected",
      message: args.response === "accepted" 
        ? `Your swap request for ${ownerItem?.title} was accepted!`
        : `Your swap request for ${ownerItem?.title} was rejected.`,
      isRead: false,
      relatedSwapId: args.swapId,
    });

    return args.swapId;
  },
});

// Get user's swap requests (sent)
export const getUserSwapRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const swaps = await ctx.db
      .query("swaps")
      .withIndex("by_requester", (q) => q.eq("requesterId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      swaps.map(async (swap) => {
        const ownerItem = await ctx.db.get(swap.ownerItemId);
        const requesterItem = await ctx.db.get(swap.requesterItemId);

        const owner = await ctx.db.get(swap.ownerId);
        const ownerProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", swap.ownerId))
          .first();

        return {
          ...swap,
          ownerItem,
          requesterItem,
          owner: {
            name: owner?.name || ownerProfile?.displayName || owner?.email || "Anonymous",
          },
        };
      })
    );
  },
});

// Get swap requests for user's items (received)
export const getReceivedSwapRequests = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const swaps = await ctx.db
      .query("swaps")
      .withIndex("by_owner", (q) => q.eq("ownerId", userId))
      .order("desc")
      .collect();

    return Promise.all(
      swaps.map(async (swap) => {
        const ownerItem = await ctx.db.get(swap.ownerItemId);
        const requesterItem = await ctx.db.get(swap.requesterItemId);

        const requester = await ctx.db.get(swap.requesterId);
        const requesterProfile = await ctx.db
          .query("profiles")
          .withIndex("by_user", (q) => q.eq("userId", swap.requesterId))
          .first();

        return {
          ...swap,
          ownerItem,
          requesterItem,
          requester: {
            name: requester?.name || requesterProfile?.displayName || requester?.email || "Anonymous",
          },
        };
      })
    );
  },
});

// Complete swap (mark as completed)
export const completeSwap = mutation({
  args: { swapId: v.id("swaps") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const swap = await ctx.db.get(args.swapId);
    if (!swap) throw new Error("Swap not found");
    if (swap.status !== "accepted") throw new Error("Swap not accepted");
    if (swap.requesterId !== userId && swap.ownerId !== userId) {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.swapId, {
      status: "completed",
    });

    // Award completion points to both users
    await ctx.runMutation(api.points.awardPoints, {
      userId: swap.requesterId,
      amount: 10,
      type: "swap_completed",
      description: "Swap completion bonus",
      relatedSwapId: args.swapId,
    });

    await ctx.runMutation(api.points.awardPoints, {
      userId: swap.ownerId,
      amount: 10,
      type: "swap_completed",
      description: "Swap completion bonus",
      relatedSwapId: args.swapId,
    });

    // Update profiles with swap completion stats
    const profiles = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", swap.requesterId))
        .first(),
      ctx.db
        .query("profiles")
        .withIndex("by_user", (q) => q.eq("userId", swap.ownerId))
        .first(),
    ]);

    for (const profile of profiles) {
      if (profile) {
        await ctx.db.patch(profile._id, {
          totalSwapsCompleted: profile.totalSwapsCompleted + 1,
        });
      }
    }

    return args.swapId;
  },
});
