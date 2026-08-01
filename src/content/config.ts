import { defineCollection, z } from 'astro:content';

const librerias = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    nombre: z.string(),
    categoria: z.enum(['scroll', 'text', 'transitions', 'effects', 'sound', 'engine', 'components', 'generators']),
    
    claim: z.object({
      en: z.string(),
      es: z.string(),
    }),
    descripcion: z.object({
      en: z.string(),
      es: z.string(),
    }),
    
    url: z.string().url(),
    npm: z.string().optional(),
    imagen: image(),
    orden: z.number(),
  }),
});

export const collections = { librerias };