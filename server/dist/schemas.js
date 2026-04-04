"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tournamentSettingsSchema = exports.entryPasscodeSchema = exports.observerPasscodeSchema = exports.observerLoginSchema = exports.adminLoginSchema = exports.selfCheckinSchema = exports.entryPasscodeOnlySchema = exports.entrySchema = exports.signupSchema = exports.participantLoginSchema = void 0;
const zod_1 = require("zod");
exports.participantLoginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(1),
});
exports.signupSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(4).max(100),
});
exports.entrySchema = zod_1.z.object({
    tournamentPasscode: zod_1.z.string().min(1),
    name: zod_1.z.string().min(1),
    partyJoin: zod_1.z.boolean().default(false),
    note: zod_1.z.string().max(300).optional(),
});
exports.entryPasscodeOnlySchema = zod_1.z.object({
    tournamentPasscode: zod_1.z.string().min(1),
});
exports.selfCheckinSchema = zod_1.z.object({
    canPlayToday: zod_1.z.boolean(),
});
exports.adminLoginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(1),
    passcode: zod_1.z.string().min(1),
});
exports.observerLoginSchema = zod_1.z.object({
    email: zod_1.z.email(),
    password: zod_1.z.string().min(1),
    passcode: zod_1.z.string().min(1),
});
exports.observerPasscodeSchema = zod_1.z.object({
    passcode: zod_1.z.string().min(4).max(64),
});
exports.entryPasscodeSchema = zod_1.z.object({
    passcode: zod_1.z.string().min(4).max(64),
});
exports.tournamentSettingsSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    eventDate: zod_1.z.string().max(30).optional().nullable(),
    timeSlot: zod_1.z.string().max(100).optional().nullable(),
    courtCount: zod_1.z.number().int().min(1).max(32),
    entryPasscode: zod_1.z.string().min(4).max(64),
    observerPasscode: zod_1.z.string().min(4).max(64),
});
//# sourceMappingURL=schemas.js.map