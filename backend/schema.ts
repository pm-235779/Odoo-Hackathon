import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.optional(v.string()),
    bio: v.optional(v.string()),
    location: v.optional(v.string()),
    avatar: v.optional(v.id("_storage")),
    points: v.number(),
    totalItemsListed: v.number(),
    totalSwapsCompleted: v.number(),
    joinedAt: v.optional(v.number()),
    isAdmin: v.optional(v.boolean()),
  }).index("by_user", ["userId"]),

  items: defineTable({
    title: v.string(),
    description: v.string(),
    category: v.union(
      v.literal("tops"),
      v.literal("bottoms"),
      v.literal("dresses"),
      v.literal("outerwear"),
      v.literal("shoes"),
      v.literal("accessories"),
      v.literal("activewear")
    ),
    type: v.string(),
    size: v.union(
      v.literal("XS"),
      v.literal("S"),
      v.literal("M"),
      v.literal("L"),
      v.literal("XL"),
      v.literal("XXL"),
      v.literal("XXXL")
    ),
    condition: v.union(
      v.literal("like-new"),
      v.literal("excellent"),
      v.literal("good"),
      v.literal("fair")
    ),
    brand: v.optional(v.string()),
    color: v.string(),
    tags: v.array(v.string()),
    images: v.array(v.id("_storage")),
    uploaderId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    rejectionReason: v.optional(v.string()),
    pointValue: v.number(),
    views: v.number(),
    likes: v.array(v.id("users")),
    isAvailable: v.boolean(),
  })
    .index("by_uploader", ["uploaderId"])
    .index("by_status", ["status"])
    .searchIndex("search_items", {
      searchField: "title",
      filterFields: ["category", "size", "condition", "status"],
    }),

  favorites: defineTable({
    userId: v.id("users"),
    itemId: v.id("items"),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_item", ["userId", "itemId"]),

  swaps: defineTable({
    requesterId: v.id("users"),
    ownerId: v.id("users"),
    requesterItemId: v.id("items"),
    ownerItemId: v.id("items"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("rejected"),
      v.literal("completed")
    ),
    message: v.optional(v.string()),
    rejectionReason: v.optional(v.string()),
  })
    .index("by_requester", ["requesterId"])
    .index("by_owner", ["ownerId"])
    .index("by_status", ["status"]),

  pointTransactions: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    type: v.union(
      v.literal("item_listed"),
      v.literal("swap_completed"),
      v.literal("item_redeemed"),
      v.literal("bonus"),
      v.literal("referral")
    ),
    description: v.string(),
    relatedItemId: v.optional(v.id("items")),
    relatedSwapId: v.optional(v.id("swaps")),
  }).index("by_user", ["userId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("swap_request"),
      v.literal("swap_accepted"),
      v.literal("swap_rejected"),
      v.literal("swap_completed"),
      v.literal("item_approved"),
      v.literal("item_rejected"),
      v.literal("points_awarded")
    ),
    title: v.string(),
    message: v.string(),
    isRead: v.boolean(),
    relatedItemId: v.optional(v.id("items")),
    relatedSwapId: v.optional(v.id("swaps")),
  }).index("by_user", ["userId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
