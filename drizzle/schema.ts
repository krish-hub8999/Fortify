import { int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * A single safe preference row per signed-in user. Password values and password
 * fragments are deliberately not part of this schema.
 */
export const userSecurityPreferences = mysqlTable(
  "userSecurityPreferences",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    attackerModel: varchar("attackerModel", { length: 48 }).notNull().default("offline-fast"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => [uniqueIndex("userSecurityPreferences_userId_unique").on(table.userId)],
);

/**
 * Metadata for user-requested, sanitized report exports. File bytes live in
 * managed object storage; raw password data is never written to either store.
 */
export const securityReportExports = mysqlTable("securityReportExports", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  fileUrl: varchar("fileUrl", { length: 768 }).notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  contentType: varchar("contentType", { length: 128 }).notNull(),
  attackerModel: varchar("attackerModel", { length: 48 }).notNull(),
  strength: varchar("strength", { length: 32 }).notNull(),
  score: int("score").notNull(),
  entropyBits: int("entropyBits").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/**
 * Opaque, client-encrypted vault records. Meaningful entry data is encrypted in
 * the browser before this table is reached; the service never receives plaintext.
 */
export const encryptedVaultEntries = mysqlTable("encryptedVaultEntries", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  ciphertext: text("ciphertext").notNull(),
  iv: varchar("iv", { length: 64 }).notNull(),
  salt: varchar("salt", { length: 128 }).notNull(),
  kdfVersion: varchar("kdfVersion", { length: 48 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserSecurityPreference = typeof userSecurityPreferences.$inferSelect;
export type SecurityReportExport = typeof securityReportExports.$inferSelect;
export type EncryptedVaultEntry = typeof encryptedVaultEntries.$inferSelect;
