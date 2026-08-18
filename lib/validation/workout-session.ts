import { z } from "zod";

const weightSetSchema = z.object({
  exerciseId: z.string(),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(1),
  weightKg: z.number().min(0),
  restSeconds: z.number().int().min(0).optional(),
  rir: z.number().int().min(0).max(3).optional(),
});

const calisthenicsSetSchema = z.object({
  movementId: z.string(),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(1),
  progression: z.string().min(1),
  restSeconds: z.number().int().min(0).optional(),
  rir: z.number().int().min(0).max(3).optional(),
});

const cardioIntervalSchema = z.object({
  order: z.number().int().min(1),
  type: z.enum(["WORK", "REST"]),
  distanceKm: z.number().min(0).optional(),
  durationMin: z.number().min(0).optional(),
  paceMinKm: z.number().min(0).optional(),
});

const cardioDetailSchema = z.object({
  cardioType: z.enum(["CONTINUOUS", "INTERVALS", "FARTLEK"]).default("CONTINUOUS"),
  distanceKm: z.number().min(0).optional(),
  avgPaceMinKm: z.number().min(0).optional(),
  avgHeartRate: z.number().int().min(0).optional(),
  intervals: z.array(cardioIntervalSchema).optional(),
});

const sportDetailSchema = z.object({
  sportType: z.string().min(1),
  perceivedIntensity: z.number().int().min(1).max(10),
});

const routineTypeSchema = z.enum(["WEIDER", "FULL_BODY", "UPPER_LOWER", "PUSH_PULL_LEGS", "OTHER"]).optional();

export const createWorkoutSessionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("WEIGHTS"),
    durationMin: z.number().int().min(1),
    date: z.coerce.date().optional(),
    notes: z.string().optional(),
    routineId: z.string().optional(),
    routineType: routineTypeSchema,
    weightSets: z.array(weightSetSchema).min(1),
  }),
  z.object({
    type: z.literal("CALISTHENICS"),
    durationMin: z.number().int().min(1),
    date: z.coerce.date().optional(),
    notes: z.string().optional(),
    routineId: z.string().optional(),
    routineType: routineTypeSchema,
    calisthenicsSets: z.array(calisthenicsSetSchema).min(1),
  }),
  z.object({
    type: z.literal("CARDIO"),
    durationMin: z.number().int().min(1),
    date: z.coerce.date().optional(),
    notes: z.string().optional(),
    cardioDetail: cardioDetailSchema,
  }),
  z.object({
    type: z.literal("SPORT"),
    durationMin: z.number().int().min(1),
    date: z.coerce.date().optional(),
    notes: z.string().optional(),
    sportDetail: sportDetailSchema,
  }),
]);

export type CreateWorkoutSessionInput = z.infer<typeof createWorkoutSessionSchema>;
