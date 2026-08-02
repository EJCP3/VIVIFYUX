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
    
    /* algo que conviene saber ANTES de usarla y que no se deduce del sitio: una
       contradicción entre su documentación y su paquete, un requisito que no
       aparece en el hero, una limitación real. Opcional a propósito: si no hay
       nada que avisar, no se pone y la ficha no muestra nada */
    nota: z
      .object({
        en: z.string(),
        es: z.string(),
      })
      .optional(),

    url: z.string().url(),
    npm: z.string().optional(),
    imagen: image(),
    orden: z.number(),
  }),
});

export const collections = { librerias };