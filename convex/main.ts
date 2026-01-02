import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// --- Users & Auth ---

export const login = mutation({
  args: { email: v.string(), password: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!user || user.password !== args.password) {
      throw new Error("Invalid credentials");
    }
    return user;
  },
});

export const register = mutation({
  args: { email: v.string(), password: v.string(), name: v.string(), role: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (existing) throw new Error("Email already exists");

    // Validate role
    let role = 'élève';
    if (args.role === 'admin') role = 'admin';
    if (args.role === 'délégué') role = 'délégué';

    const userId = await ctx.db.insert("users", {
      email: args.email,
      password: args.password,
      name: args.name,
      role: role as "élève" | "admin" | "délégué",
    });
    return await ctx.db.get(userId);
  },
});

export const getUser = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// --- Chat ---

export const listMessages = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("messages").order("desc").take(100);
    // Manual Join with Users
    const messagesWithUser = await Promise.all(
      messages.map(async (msg) => {
        const user = await ctx.db.get(msg.user_id);
        return {
          ...msg,
          profile: user ? { name: user.name, role: user.role } : { name: "Inconnu", role: "élève" },
        };
      })
    );
    return messagesWithUser.reverse();
  },
});

export const sendMessage = mutation({
  args: { content: v.string(), user_id: v.id("users"), is_mandarin: v.optional(v.boolean()), pinyin: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      user_id: args.user_id,
      content: args.content,
      is_mandarin: args.is_mandarin,
      pinyin: args.pinyin,
      created_at: new Date().toISOString(),
    });
  },
});

// --- Announcements ---

export const listAnnouncements = query({
  handler: async (ctx) => {
    return await ctx.db.query("announcements").order("desc").collect();
  },
});

export const postAnnouncement = mutation({
  args: { title: v.string(), content: v.string(), priority: v.string(), imageUrl: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const priority = args.priority === 'URGENT' ? 'URGENT' : 'NORMAL';
    await ctx.db.insert("announcements", {
      title: args.title,
      content: args.content,
      priority,
      imageUrl: args.imageUrl,
      created_at: new Date().toISOString(),
    });
  },
});

export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Schedule ---

export const listSchedule = query({
  handler: async (ctx) => {
    return await ctx.db.query("schedule").collect();
  },
});

export const addScheduleItem = mutation({
  args: { day: v.string(), time: v.string(), subject: v.string(), room: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("schedule", args);
  },
});

export const deleteScheduleItem = mutation({
  args: { id: v.id("schedule") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Quiz ---

export const checkQuizSubmission = query({
  args: { user_id: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("quiz_results")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .first();
  },
});

export const submitQuizResult = mutation({
  args: { user_id: v.id("users"), score: v.number(), total: v.number() },
  handler: async (ctx, args) => {
    // Check existing
    const existing = await ctx.db
      .query("quiz_results")
      .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    await ctx.db.insert("quiz_results", {
      user_id: args.user_id,
      score: args.score,
      total: args.total,
      created_at: new Date().toISOString(),
    });
  },
});