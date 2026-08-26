import { and, desc, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { encryptedVaultEntries, securityReportExports, userSecurityPreferences, InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getSecurityPreference(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  const result = await db
    .select()
    .from(userSecurityPreferences)
    .where(eq(userSecurityPreferences.userId, userId))
    .limit(1);

  return result[0];
}

export async function saveSecurityPreference(userId: number, attackerModel: string) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  await db.insert(userSecurityPreferences).values({ userId, attackerModel }).onDuplicateKeyUpdate({
    set: { attackerModel, updatedAt: new Date() },
  });

  return getSecurityPreference(userId);
}

export async function createSecurityReportExport(input: {
  userId: number;
  fileKey: string;
  fileUrl: string;
  fileName: string;
  contentType: string;
  attackerModel: string;
  strength: string;
  score: number;
  entropyBits: number;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  await db.insert(securityReportExports).values(input);
  const result = await db
    .select()
    .from(securityReportExports)
    .where(eq(securityReportExports.userId, input.userId))
    .orderBy(desc(securityReportExports.id))
    .limit(1);

  return result[0];
}

export async function listSecurityReportExports(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");

  return db
    .select()
    .from(securityReportExports)
    .where(eq(securityReportExports.userId, userId))
    .orderBy(desc(securityReportExports.createdAt));
}

export async function createEncryptedVaultEntry(input: {
  userId: number;
  ciphertext: string;
  iv: string;
  salt: string;
  kdfVersion: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.insert(encryptedVaultEntries).values(input);
  const result = await db.select().from(encryptedVaultEntries)
    .where(eq(encryptedVaultEntries.userId, input.userId))
    .orderBy(desc(encryptedVaultEntries.id)).limit(1);
  return result[0];
}

export async function listEncryptedVaultEntries(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  return db.select().from(encryptedVaultEntries)
    .where(eq(encryptedVaultEntries.userId, userId))
    .orderBy(desc(encryptedVaultEntries.updatedAt));
}

export async function removeEncryptedVaultEntry(userId: number, id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database is not available");
  await db.delete(encryptedVaultEntries).where(and(eq(encryptedVaultEntries.userId, userId), eq(encryptedVaultEntries.id, id)));
  return { success: true } as const;
}
