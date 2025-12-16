'use server';
/**
 * @fileOverview A flow to find nearby veterinary services.
 *
 * - findVetServices - A function that takes a location and returns a list of veterinary services.
 * - FindVetServicesInput - The input type for the findVetServices function.
 * - FindVetServicesOutput - The return type for the findVetServices function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VetServiceSchema = z.object({
  name: z.string().describe('The name of the veterinary hospital or clinic.'),
  address: z.string().describe('The physical address of the service.'),
  phone: z.string().describe('The contact phone number.'),
  type: z.enum(['Hospital', 'Clinic', 'Helpline']).describe('The type of service.'),
});

const FindVetServicesInputSchema = z.object({
  location: z.string().describe('The user\'s city, district, or pincode.'),
  language: z.string().describe('The language for the response (e.g., "en" or "hi").'),
});
export type FindVetServicesInput = z.infer<typeof FindVetServicesInputSchema>;

const FindVetServicesOutputSchema = z.object({
  services: z.array(VetServiceSchema).describe('A list of nearby veterinary services.'),
});
export type FindVetServicesOutput = z.infer<typeof FindVetServicesOutputSchema>;

export async function findVetServices(input: FindVetServicesInput): Promise<FindVetServicesOutput> {
  return findVetServicesFlow(input);
}

const findVetPrompt = ai.definePrompt({
  name: 'findVetServicesPrompt',
  input: { schema: FindVetServicesInputSchema },
  output: { schema: FindVetServicesOutputSchema },
  prompt: `You are a helpful assistant for Indian farmers. A user needs to find emergency veterinary help for their animal.
    Based on the provided location, generate a list of 3 to 5 plausible and realistic-sounding veterinary hospitals, clinics, or government animal husbandry helplines.

    For each service, provide a name, a plausible-looking address within the given location, a contact phone number, and the type of service.
    The response must be in the language: {{{language}}}.
    
    Location: "{{{location}}}"
  `,
});

const findVetServicesFlow = ai.defineFlow(
  {
    name: 'findVetServicesFlow',
    inputSchema: FindVetServicesInputSchema,
    outputSchema: FindVetServicesOutputSchema,
  },
  async (input) => {
    const { output } = await findVetPrompt(input);
    return output!;
  }
);
