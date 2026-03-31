import { z } from "zod";
export const participantLoginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
});
export const signupSchema = z.object({
    email: z.email(),
    password: z.string().min(4).max(100),
});
export const entrySchema = z.object({
    tournamentPasscode: z.string().min(1),
    name: z.string().min(1),
    partyJoin: z.boolean().default(false),
    note: z.string().max(300).optional(),
});
export const entryPasscodeOnlySchema = z.object({
    tournamentPasscode: z.string().min(1),
});
export const selfCheckinSchema = z.object({
    canPlayToday: z.boolean(),
});
export const adminLoginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
    passcode: z.string().min(1),
});
export const observerLoginSchema = z.object({
    email: z.email(),
    password: z.string().min(1),
    passcode: z.string().min(1),
});
export const observerPasscodeSchema = z.object({
    passcode: z.string().min(4).max(64),
});
export const entryPasscodeSchema = z.object({
    passcode: z.string().min(4).max(64),
});
export const tournamentSettingsSchema = z.object({
    name: z.string().min(1),
    eventDate: z.string().max(30).optional().nullable(),
    timeSlot: z.string().max(100).optional().nullable(),
    courtCount: z.number().int().min(1).max(32),
    entryPasscode: z.string().min(4).max(64),
    observerPasscode: z.string().min(4).max(64),
});
