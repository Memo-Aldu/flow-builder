import { z } from 'zod';

export const createCredentialSchema = z.object({
  name: z.string().max(30).nonempty(),
  value: z.string().max(500).nonempty()
});


export type CreateCredentialSchemaType = z.infer<typeof createCredentialSchema>;