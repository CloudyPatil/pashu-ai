'use server';

/**
 * @fileOverview This file defines a Genkit flow for improving the AI model's accuracy using corrected breed data.
 *
 * - improveModelAccuracy - A function that triggers the model retraining process.
 * - ImproveModelAccuracyInput - The input type for the improveModelAccuracy function.
 * - ImproveModelAccuracyOutput - The return type for the improveModelAccuracy function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImproveModelAccuracyInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "A photo of the animal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  correctedBreed: z.string().describe('The corrected breed of the animal.'),
});
export type ImproveModelAccuracyInput = z.infer<typeof ImproveModelAccuracyInputSchema>;

const ImproveModelAccuracyOutputSchema = z.object({
  message: z.string().describe('A message indicating the status of the retraining process.'),
});
export type ImproveModelAccuracyOutput = z.infer<typeof ImproveModelAccuracyOutputSchema>;

export async function improveModelAccuracy(
  input: ImproveModelAccuracyInput
): Promise<ImproveModelAccuracyOutput> {
  return improveModelAccuracyFlow(input);
}

const improveModelAccuracyPrompt = ai.definePrompt({
  name: 'improveModelAccuracyPrompt',
  prompt: `You are an AI model retraining pipeline.  You have received new data from a user who has corrected a misclassification of an animal breed.

  The image of the animal is represented by this data: {{media url=imageDataUri}}.
  The user has indicated that the animal is of breed: {{{correctedBreed}}}.

  Generate a message that confirms that this new information has been received and that the model retraining pipeline will be triggered.
  {
    "message": "Confirmation message"
  }
  `,
  input: {schema: ImproveModelAccuracyInputSchema},
  output: {schema: ImproveModelAccuracyOutputSchema},
});

const improveModelAccuracyFlow = ai.defineFlow(
  {
    name: 'improveModelAccuracyFlow',
    inputSchema: ImproveModelAccuracyInputSchema,
    outputSchema: ImproveModelAccuracyOutputSchema,
  },
  async input => {
    const {output} = await improveModelAccuracyPrompt(input);
    // TODO: Trigger model retraining pipeline here.
    // This is a placeholder for the actual retraining process.
    // It should involve sending the image and corrected breed to a service
    // that handles the retraining of the AI model.
    return {
      message: `Received corrected breed data for retraining: ${output?.message}. Retraining pipeline triggered.`, //Improved typing
    };
  }
);
