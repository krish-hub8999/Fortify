import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createSecurityReportExport,
  createEncryptedVaultEntry,
  getSecurityPreference,
  listEncryptedVaultEntries,
  listSecurityReportExports,
  removeEncryptedVaultEntry,
  saveSecurityPreference,
} from "./db";
import { attackerModelSchema, buildSanitizedReport, sanitizedReportInputSchema } from "./passwordReports";
import { storagePut } from "./storage";
import { encryptedVaultEntrySchema, vaultEntryIdSchema } from "./vault";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  securityData: router({
    preference: protectedProcedure.query(async ({ ctx }) => {
      const preference = await getSecurityPreference(ctx.user.id);
      return preference ?? { attackerModel: "offline-fast" };
    }),
    savePreference: protectedProcedure
      .input(attackerModelSchema)
      .mutation(({ ctx, input }) => saveSecurityPreference(ctx.user.id, input)),
    listReports: protectedProcedure.query(({ ctx }) => listSecurityReportExports(ctx.user.id)),
    exportSanitizedReport: protectedProcedure
      .input(sanitizedReportInputSchema)
      .mutation(async ({ ctx, input }) => {
        const timestamp = new Date();
        const fileName = `fortify-assessment-${timestamp.toISOString().replace(/[:.]/g, "-")}.json`;
        const report = buildSanitizedReport(input, timestamp);
        const stored = await storagePut(
          `password-strength-reports/${ctx.user.id}/${fileName}`,
          report,
          "application/json",
        );

        return createSecurityReportExport({
          userId: ctx.user.id,
          fileKey: stored.key,
          fileUrl: stored.url,
          fileName,
          contentType: "application/json",
          attackerModel: input.attackerModel,
          strength: input.strength,
          score: input.score,
          entropyBits: input.entropyBits,
        });
      }),
  }),
  vault: router({
    list: protectedProcedure.query(({ ctx }) => listEncryptedVaultEntries(ctx.user.id)),
    save: protectedProcedure
      .input(encryptedVaultEntrySchema)
      .mutation(({ ctx, input }) => createEncryptedVaultEntry({ userId: ctx.user.id, ...input })),
    remove: protectedProcedure
      .input(vaultEntryIdSchema)
      .mutation(({ ctx, input }) => removeEncryptedVaultEntry(ctx.user.id, input.id)),
  }),
});

export type AppRouter = typeof appRouter;
