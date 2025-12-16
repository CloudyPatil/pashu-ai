'use server';
/**
 * @fileOverview A health diagnosis flow for cattle and buffaloes.
 *
 * - diagnoseAnimalHealth - A function that handles the animal health diagnosis process.
 * - DiagnoseAnimalHealthInput - The input type for the diagnoseAnimalHealth function.
 * - DiagnoseAnimalHealthOutput - The return type for the diagnoseAnimalHealth function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const DiagnoseAnimalHealthInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the animal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  description: z.string().optional().describe('A text description of any observed symptoms.'),
  language: z.string().describe('The language for the response (e.g., "en" or "hi").'),
});
export type DiagnoseAnimalHealthInput = z.infer<typeof DiagnoseAnimalHealthInputSchema>;

const DiseaseInfoSchema = z.object({
    diseaseName: z.string().describe('The name of the likely disease.'),
    confidenceScore: z.number().describe('The confidence score of the diagnosis (0-1).'),
    urgency: z.enum(['Low', 'Medium', 'High']).describe('The urgency level for seeking veterinary help.'),
    description: z.string().describe('A short description of the disease.'),
    firstAid: z.string().describe('First-aid or immediate care suggestions for the farmer.'),
    veterinaryAttention: z.string().describe('A recommendation on whether veterinary attention is needed and how urgently.')
});

const DiagnoseAnimalHealthOutputSchema = z.object({
    isHealthy: z.boolean().describe('Whether the animal is likely healthy or not.'),
    diagnosis: z.array(DiseaseInfoSchema).optional().describe('An array of potential diseases if the animal is not healthy.'),
    preventiveCare: z.string().optional().describe('Preventive care suggestions if the animal is healthy.'),
});
export type DiagnoseAnimalHealthOutput = z.infer<typeof DiagnoseAnimalHealthOutputSchema>;


export async function diagnoseAnimalHealth(input: DiagnoseAnimalHealthInput): Promise<DiagnoseAnimalHealthOutput> {
  return diagnoseAnimalHealthFlow(input);
}

const diagnosePrompt = ai.definePrompt({
  name: 'diagnoseAnimalHealthPrompt',
  input: { schema: DiagnoseAnimalHealthInputSchema },
  output: { schema: DiagnoseAnimalHealthOutputSchema },
  prompt: `You are an expert veterinarian specializing in diseases of Indian cattle and buffaloes.
    Analyze the provided image and the farmer's description of symptoms to diagnose the animal's health.

    1.  First, assess if a disease is present. Look for visual cues in the image (lesions, swelling, unusual posture, discharge, etc.) and consider the text description.
    2.  If you detect signs of disease:
        - Set \`isHealthy\` to \`false\`.
        - Provide up to 2 likely diseases in the \`diagnosis\` array.
        - For each disease, provide:
            - \`diseaseName\`: The common name of the disease.
            - \`confidenceScore\`: Your confidence in this diagnosis (0.0 to 1.0).
            - \`urgency\`: 'Low' if it can be monitored, 'Medium' if a vet should be seen soon, 'High' if it's an emergency.
            - \`description\`: A brief explanation of the disease.
            - \`firstAid\`: Simple, immediate steps the farmer can take to provide relief or prevent spread.
            - \`veterinaryAttention\`: A clear recommendation about seeking professional help.
    3.  If you do not detect clear signs of disease:
        - Set \`isHealthy\` to \`true\`.
        - Provide practical \`preventiveCare\` suggestions covering nutrition, vaccination, or hygiene to help the farmer maintain the animal's health.
    
    The response must be in the language: {{{language}}}.

    Farmer's Description: "{{{description}}}"
    Image: {{media url=photoDataUri}}
  `,
});

const diagnoseAnimalHealthFlow = ai.defineFlow(
  {
    name: 'diagnoseAnimalHealthFlow',
    inputSchema: DiagnoseAnimalHealthInputSchema,
    outputSchema: DiagnoseAnimalHealthOutputSchema,
  },
  async (input) => {
    const { output } = await diagnosePrompt(input);
    return output!;
  }
);
