import { config } from 'dotenv';
config();

import '@/ai/flows/improve-model-accuracy.ts';
import '@/ai/flows/identify-breed-offline.ts';
import '@/ai/flows/suggest-breed-from-image.ts';
import '@/ai/flows/recommend-breeds.ts';
import '@/ai/flows/diagnose-animal-health.ts';
import '@/ai/flows/find-vet-services.ts';
import '@/ai/schemas/recommend-breeds-schema.ts';
