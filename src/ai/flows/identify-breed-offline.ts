'use server';

/**
 * @fileOverview Provides offline breed identification for cattle and buffaloes using a pre-trained AI model.
 *
 * - identifyBreedOffline -  A function that takes an image of an animal and returns the AI's breed suggestion.
 * - IdentifyBreedOfflineInput - The input type for the identifyBreedOffline function.
 * - IdentifyBreedOfflineOutput - The return type for the identifyBreedOffline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyBreedOfflineInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the animal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  language: z.string().describe('The language for the response (e.g., "en" or "hi").'),
});
export type IdentifyBreedOfflineInput = z.infer<typeof IdentifyBreedOfflineInputSchema>;

const IdentifyBreedOfflineOutputSchema = z.object({
    isAnimal: z.boolean().describe('Whether the image contains a cattle or buffalo.'),
    reason: z.string().optional().describe('Reason why the image is not valid (e.g., blurry, not an animal).'),
    breedSuggestion: z.string().describe('The AI-suggested breed of the animal.'),
    confidenceScore: z.number().describe('The confidence score of the breed suggestion (0-1).'),
    description: z.string().describe('A general description of the breed.'),
    size: z.string().describe('The approximate size of the breed (e.g., height and weight).'),
    colors: z.array(z.string()).describe('Common colors found in this breed.'),
    nutrition: z.string().describe('Typical nutritional requirements for the breed.'),
  });
export type IdentifyBreedOfflineOutput = z.infer<typeof IdentifyBreedOfflineOutputSchema>;

export async function identifyBreedOffline(input: IdentifyBreedOfflineInput): Promise<IdentifyBreedOfflineOutput> {
  return identifyBreedOfflineFlow(input);
}

const identifyBreedOfflinePrompt = ai.definePrompt({
  name: 'identifyBreedOfflinePrompt',
  input: {schema: IdentifyBreedOfflineInputSchema},
  output: {schema: IdentifyBreedOfflineOutputSchema},
  prompt: `You are an AI model that has been trained to identify the breed of Indian cattle and buffaloes based on images.
  First, determine if the image contains a cattle or buffalo. The image could be blurry, unclear, or of a different subject.
  If the image is not a clear photo of a cattle or buffalo, set isAnimal to false and provide a brief reason.
  If it is a valid image, set isAnimal to true, provide the breed suggestion, the confidence score of your prediction, and detailed information about the breed including a general description, approximate size (height and weight), common colors, and typical nutritional requirements.

  The confidence score should be between 0 and 1.

  The response should be in the language: {{{language}}}.

  Image: {{media url=photoDataUri}}

  Output in JSON format.
  `,
});

const identifyBreedOfflineFlow = ai.defineFlow(
  {
    name: 'identifyBreedOfflineFlow',
    inputSchema: IdentifyBreedOfflineInputSchema,
    outputSchema: IdentifyBreedOfflineOutputSchema,
  },
  async input => {
    const {output} = await identifyBreedOfflinePrompt(input);
    return output!;
  }
);
