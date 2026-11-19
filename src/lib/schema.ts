import { z } from 'zod';

export const FloorPatternSchema = z.enum(['solid', 'checker', 'mosaic', 'wood']);

export const PlacedObjectSchema = z.object({
  id: z.string().min(1),
  assetId: z.string().min(1),
  floor: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  position: z.tuple([z.number(), z.number(), z.number()]),
  /** Quarter turns (0, 1, 2, 3 -> 0°, 90°, 180°, 270°) */
  rotationQuarter: z.number().int().min(0).max(3),
  color: z.string().min(4),
  accentColor: z.string().min(4),
});

export const LayoutDataSchema = z.object({
  version: z.literal(2),
  wallColors: z.record(z.string(), z.string()),
  trimColors: z.object({
    left: z.string(),
    right: z.string(),
  }),
  floorSettings: z.record(
    z.string(),
    z.object({
      color: z.string(),
      pattern: FloorPatternSchema,
    })
  ),
  placedObjects: z.array(PlacedObjectSchema),
  /** Optional saved characters array included in full export/import */
  characters: z.array(z.any()).optional(),
});

export type FloorPattern = z.infer<typeof FloorPatternSchema>;
export type PlacedObject = z.infer<typeof PlacedObjectSchema>;
export type LayoutExportData = z.infer<typeof LayoutDataSchema>;
