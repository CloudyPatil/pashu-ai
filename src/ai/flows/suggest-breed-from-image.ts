'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting cattle and buffalo breeds from an image.
 *
 * - suggestBreedFromImage - A function that takes an image and returns breed suggestions.
 * - SuggestBreedFromImageInput - The input type for the suggestBreedFromImage function.
 * - SuggestBreedFromImageOutput - The return type for the suggestBreedFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestBreedFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of cattle or buffalo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language for the response (e.g., "en" or "hi").'),
});
export type SuggestBreedFromImageInput = z.infer<typeof SuggestBreedFromImageInputSchema>;

const BreedInfoSchema = z.object({
    breed: z.string().describe('The name of the breed.'),
    confidence: z.number().describe('The confidence score for this breed suggestion.'),
    description: z.string().describe('A general description of the breed.'),
    size: z.string().describe('The approximate size of the breed (e.g., height and weight).'),
    colors: z.array(z.string()).describe('Common colors found in this breed.'),
    nutrition: z.string().describe('Typical nutritional requirements for the breed.'),
});

const SuggestBreedFromImageOutputSchema = z.object({
    isAnimal: z.boolean().describe('Whether the image contains a cattle or buffalo.'),
    reason: z.string().optional().describe('Reason why the image is not valid (e.g., blurry, not an animal).'),
    breedSuggestions: z
        .array(BreedInfoSchema)
        .describe('An array of breed suggestions, each including detailed information.'),
});
export type SuggestBreedFromImageOutput = z.infer<typeof SuggestBreedFromImageOutputSchema>;

export async function suggestBreedFromImage(input: SuggestBreedFromImageInput): Promise<SuggestBreedFromImageOutput> {
  return suggestBreedFromImageFlow(input);
}

const suggestBreedFromImagePrompt = ai.definePrompt({
  name: 'suggestBreedFromImagePrompt',
  input: {schema: SuggestBreedFromImageInputSchema},
  output: {schema: SuggestBreedFromImageOutputSchema},
  prompt: `You are an AI breed recognition system for Indian cattle and buffaloes.
  First, determine if the image contains a cattle or buffalo. The image could be blurry, unclear, or of a different subject.
  If the image is not a clear photo of a cattle or buffalo, set isAnimal to false and provide a brief reason.
  If it is a valid image, set isAnimal to true and suggest up to 3 breeds. For each suggestion, provide the breed name, a confidence score, a general description, approximate size (height and weight), common colors, and typical nutritional requirements.

  The response should be in the language: {{{language}}}.

  Image: {{media url=photoDataUri}}

  Return breed suggestions and confidence scores only for valid images.`,
});

const suggestBreedFromImageFlow = ai.defineFlow(
  {
    name: 'suggestBreedFromImageFlow',
    inputSchema: SuggestBreedFromImageInputSchema,
    outputSchema: SuggestBreedFromImageOutputSchema,
  },
  async input => {
    const {output} = await suggestBreedFromImagePrompt(input);
    return output!;
  }
);
