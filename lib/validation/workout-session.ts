import { z } from "zod";

const weightSetSchema = z.object({
  exerciseId: z.string(),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(1),
  weightKg: z.number().min(0),
});

const calisthenicsSetSchema = z.object({
  movementId: z.string(),
  setNumber: z.number().int().min(1),
  reps: z.number().int().min(1),
  progression: z.string().min(1),
});

const cardioDetailSchema = z.object({
  distanceKm: z.number().min(0),
  avgPaceMinKm: z.number().min(0).optional(),
  avgHeartRate: z.number().int().min(0).optional(),
});

const sportDetailSchema = z.object({
  sportType: z.string().min(1),
  perceivedIntensity: z.number().int().min(1).max(10),
});

export const createWorkoutSessionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("WEIGHTS"),
    durationMin: z.number().int().min(1),
    date: z.coerce.date().optional(),
    notes: z.string().optional(),
    weightSets: z.array(weightSetSchema).min(1),
  }),
  z.object({
    type: z.literal("CALISTHENICS"),
    durationMin: z.number().int().min(1),
    date: z.coerce.date().optional(),
    notes: z.string().optional(),
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
