// schema/moderatorSchema.ts
import { pgTable, text, boolean, timestamp, serial, integer, unique, uniqueIndex, pgEnum } from "drizzle-orm/pg-core";

// ✅ Invite Tokens Table from User DB
export const inviteTokens = pgTable("invite_tokens", {
  id: serial("id").primaryKey(),
  token: text("token").notNull().unique(),
  createdById: integer("created_by_moderator_id"), // foreign key in User DB, no need to resolve in Moderator App
  usedById: integer("used_by_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  usedAt: timestamp("used_at"),
  isValid: boolean("is_valid").default(true).notNull(),
});

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey().notNull(),
    username: text("username").notNull(),
    password: text("password").notNull(),
    email: text("email").notNull(),
    initialLoginAt: timestamp("initial_login_at", { withTimezone: true }),
    onboardingCompletedAt: timestamp("onboarding_completed_at", { withTimezone: true }),
  },
  (table) => [
    unique("users_email_key").on(table.email),
    unique("users_username_key").on(table.username),
  ]
);

// ——————————————————————————————————————
// 2. Chats table (chat sessions in Mirai app DB)
// ——————————————————————————————————————
export const chats = pgTable("chats", {
  id: serial("id").primaryKey().notNull(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("New chat"),
  type: text("type").notNull().default("regular"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const MessageType = pgEnum('message_type', [
  'data',
  'db1',
  'db2',
  'regular',
]);

// ——————————————————————————————————————
// 3. Messages table (from Mirai app DB)
// ——————————————————————————————————————
export const messages = pgTable("messages", {
  id: serial("id").primaryKey().notNull(),
  chatId: integer("chat_id")
    .notNull()
    .references(() => chats.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  isBot: boolean("is_bot").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  // if you’re using a dbType enum:
  dbType: MessageType('db_type').notNull().default('regular'),
  category: text("category").default("SELF").notNull(),
  vote: integer("vote").default(0).notNull(), // -1, 0, or 1

});

export const feedback = pgTable("feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: text("session_id"),
  comment: text("comment"),
  rating: integer("rating").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ✅ Types
export type InviteToken = typeof inviteTokens.$inferSelect;
export type InsertInviteToken = {
  token: string;
  createdById: number;
};
export type Message = typeof messages.$inferSelect;
export type Feedback = typeof feedback.$inferSelect;
export type User = typeof users.$inferSelect;
export type Chat = typeof chats.$inferSelect;