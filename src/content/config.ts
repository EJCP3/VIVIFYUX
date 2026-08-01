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
    
    /* dos apuntes prácticos por librería. Van vacíos en las que todavía no se
       escribieron: la ficha solo muestra el bloque cuando hay texto en los dos
       idiomas, así un tip a medias nunca llega a publicarse */
    tips: z
      .array(
        z.object({
          en: z.string(),
          es: z.string(),
        }),
      )
      .default([]),

    url: z.string().url(),
    npm: z.string().optional(),
    imagen: image(),
    orden: z.number(),
  }),
});

export const collections = { librerias };