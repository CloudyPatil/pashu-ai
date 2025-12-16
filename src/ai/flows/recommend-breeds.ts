'use server';

/**
 * @fileOverview A breed recommendation engine for Indian farmers.
 *
 * - recommendBreeds - A function that takes farmer inputs and recommends suitable breeds.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { indianBreedData } from '@/lib/breed-data';
import {
  RecommendBreedsInput,
  RecommendBreedsOutput,
  RecommendBreedsOutputSchema,
} from '@/ai/schemas/recommend-breeds-schema';

// Helper functions for scoring
const normalize = (value: number, min: number, max: number) => {
    if (max === min) return 1;
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

const getScore = (value: 'Low' | 'Medium' | 'High') => {
  if (value === 'High') return 10;
  if (value === 'Medium') return 5;
  return 1;
};

const recommendationPrompt = ai.definePrompt({
  name: 'recommendationPrompt',
  input: {
    schema: z.object({
      language: z.string(),
      goal: z.string(),
      breeds: z.array(z.any()),
    }),
  },
  output: { schema: RecommendBreedsOutputSchema },
  prompt: `
    You are an agricultural advisor for Indian farmers.
    Based on the farmer's goal and the provided data for each breed, generate a short "pros" and "cons" summary.
    The response must be in the language: {{{language}}}.
    The output must be a valid JSON object following the specified schema. Do not include any other text, formatting, or explanations.
    
    Farmer's Goal: {{{goal}}}

    Breeds data:
    {{{json breeds}}}
  `,
});


export async function recommendBreeds(input: RecommendBreedsInput): Promise<RecommendBreedsOutput> {
  // 1. Filter breeds based on hard constraints
  let filteredBreeds = indianBreedData.filter(breed => {
    // Budget filter
    if (breed.marketPrice > input.budget) {
      return false;
    }
    // Climate filter
    if (!breed.climateSuitability.includes(input.regionalClimate as any)) {
      return false;
    }
    // Goal filter for 'low-maintenance'
    if (input.goal === 'low-maintenance' && (breed.maintenanceCost !== 'Low' || breed.careLevel !== 'Low')) {
        return false;
    }
    return true;
  });

  // Handle case where no breeds match filters
  if (filteredBreeds.length === 0) {
      return { recommendedBreeds: [] };
  }

  // 2. Score the filtered breeds
  const scoredBreeds = filteredBreeds.map(breed => {
    // Individual scores (0-10)
    const milkYieldScore = normalize(breed.milkYield, 1, 15) * 10;
    const strengthScore = getScore(breed.strength);
    const careRequirementScore = 10 - getScore(breed.careLevel); // Inverted score
    const climateMatchScore = 10; // Already filtered, so it's a perfect match
    
    // Assumes an average milk price of ₹55/liter
    const monthlyIncome = breed.milkYield * 30 * 55;
    const maintenanceMapping = { 'Low': 3000, 'Medium': 5000, 'High': 8000 };
    const monthlyCost = maintenanceMapping[breed.maintenanceCost];
    const estimatedProfit = monthlyIncome - monthlyCost;
    const roiScore = normalize(estimatedProfit, -5000, 20000) * 10;
    
    // ROI calculation should be more robust
    const initialInvestment = breed.marketPrice;
    const netAnnualProfit = estimatedProfit * 12;
    // Avoid division by zero and handle loss cases
    const roi = initialInvestment > 0 ? (netAnnualProfit / initialInvestment) * 100 : 0;


    // 3. Calculate weighted overall score based on goal
    let weights;
    switch (input.goal) {
      case 'milk':
        weights = { milk: 0.5, roi: 0.3, care: 0.1, climate: 0.1, strength: 0 };
        break;
      case 'draught':
        weights = { milk: 0.1, roi: 0.2, care: 0.2, climate: 0.1, strength: 0.4 };
        break;
      case 'dual-purpose':
        weights = { milk: 0.3, roi: 0.3, care: 0.1, climate: 0.1, strength: 0.2 };
        break;
      case 'low-maintenance':
      default: // Default to a balanced approach
        weights = { milk: 0.1, roi: 0.3, care: 0.4, climate: 0.1, strength: 0 };
        break;
    }
    
    const overallScore =
      milkYieldScore * weights.milk +
      strengthScore * weights.strength +
      careRequirementScore * weights.care +
      roiScore * weights.roi +
      climateMatchScore * weights.climate;

    return {
      breed,
      overallScore: Math.round(Math.min(10, Math.max(0, overallScore)) * 10) / 10,
      scores: {
        milkYieldScore: Math.round(milkYieldScore),
        strengthScore: Math.round(strengthScore),
        careRequirementScore: Math.round(careRequirementScore),
        roiScore: Math.round(roiScore),
        climateMatchScore: Math.round(climateMatchScore),
      },
      roi: Math.round(roi)
    };
  });

  // 4. Sort and select top 3
  const topBreeds = scoredBreeds.sort((a, b) => b.overallScore - a.overallScore).slice(0, 3);
  
  // 5. Use Genkit to format the output with translated pros and cons
  const breedsForPrompt = topBreeds.map(b => ({
      breedName: b.breed.breedName,
      overallScore: b.overallScore,
      roi: b.roi,
      careLevel: b.breed.careLevel,
      // Pass the raw data so the LLM can make a good summary
      ...b.breed
  }));

  const { output } = await recommendationPrompt({
    language: input.language,
    goal: input.goal,
    breeds: breedsForPrompt,
  });

  if (!output) {
    throw new Error('Failed to get recommendations from AI model.');
  }

  // Combine the calculated scores with the LLM-generated text
  const combinedResult: RecommendBreedsOutput = {
    recommendedBreeds: output.recommendedBreeds.map((rec, index) => {
        const originalBreedData = topBreeds[index];
        // Ensure we handle the case where the LLM might not return a breed
        if (!originalBreedData) return null;
        
        return {
            ...rec, // pros, cons, breedName from LLM
            overallScore: originalBreedData.overallScore,
            roi: originalBreedData.roi,
            careLevel: originalBreedData.breed.careLevel,
            scores: originalBreedData.scores
        }
    }).filter(b => b !== null) as RecommendBreedsOutput['recommendedBreeds'] // Filter out any nulls
  };

  return combinedResult;
}
