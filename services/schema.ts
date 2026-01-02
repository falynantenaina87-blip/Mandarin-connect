import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(), // In production, hash this!
    name: v.string(),
    role: v.union(v.literal('élève'), v.literal('délégué'), v.literal('admin')),
  }).index("by_email", ["email"]),

  messages: defineTable({
    user_id: v.id("users"),
    content: v.string(),
    is_mandarin: v.optional(v.boolean()),
    pinyin: v.optional(v.string()),
    created_at: v.string(),
  }).index("by_creation", ["created_at"]),

  announcements: defineTable({
    title: v.string(),
    content: v.string(),
    priority: v.union(v.literal('NORMAL'), v.literal('URGENT')),
    imageUrl: v.optional(v.string()),
    created_at: v.string(),
  }),

  schedule: defineTable({
    day: v.string(),
    time: v.string(),
    subject: v.string(),
    room: v.string(),
  }),

  quiz_results: defineTable({
    user_id: v.id("users"),
    score: v.number(),
    total: v.number(),
    created_at: v.string(),
  }).index("by_user", ["user_id"]),
});