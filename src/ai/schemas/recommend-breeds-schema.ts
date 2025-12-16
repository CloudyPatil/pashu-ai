/**
 * @fileOverview Schema and type definitions for the breed recommendation flow.
 *
 * - RecommendBreedsInputSchema - The Zod schema for the input of the recommendBreeds function.
 * - RecommendBreedsInput - The TypeScript type for the input of the recommendBreeds function.
 * - RecommendBreedsOutputSchema - The Zod schema for the output of the recommendBreeds function.
 * - RecommendBreedsOutput - The TypeScript type for the output of the recommendBreeds function.
 */

import { z } from 'genkit';

export const RecommendBreedsInputSchema = z.object({
  goal: z.enum(['milk', 'draught', 'dual-purpose', 'low-maintenance']),
  budget: z.number(),
  landSize: z.number(),
  regionalClimate: z.string(),
  language: z.string(),
});
export type RecommendBreedsInput = z.infer<typeof RecommendBreedsInputSchema>;

const RecommendedBreedSchema = z.object({
  breedName: z.string().describe('The name of the recommended breed.'),
  overallScore: z.number().describe('The overall suitability score for the farmer (out of 10).'),
  pros: z.string().describe('The key advantages of this breed for the farmer.'),
  cons: z.string().describe('The key disadvantages or challenges of this breed for the farmer.'),
  roi: z.number().describe('Estimated Return on Investment percentage.'),
  careLevel: z.string().describe('The care level required (Low, Medium, or High).'),
  scores: z
    .object({
      milkYieldScore: z.number(),
      strengthScore: z.number(),
      careRequirementScore: z.number(),
      roiScore: z.number(),
      climateMatchScore: z.number(),
    })
    .describe('A breakdown of scores for different suitability aspects.'),
});

export const RecommendBreedsOutputSchema = z.object({
  recommendedBreeds: z.array(RecommendedBreedSchema),
});
export type RecommendBreedsOutput = z.infer<
  typeof RecommendBreedsOutputSchema
>;
