import { defineCollection, z } from 'astro:content';

const librerias = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    nombre: z.string(),
    // se muestra a la derecha del nombre en la grilla, formato ../CATEGORIA
    categoria: z.enum(['scroll', 'texto', 'transiciones', 'efectos', 'sonido', 'motor']),
    claim: z.string(),
    descripcion: z.string(),
    url: z.string().url(),
    npm: z.string().optional(),
    imagen: image(),
    // chips de "con qué está hecha / qué usa" en la ficha
    stack: z.array(z.string()).min(1),
    orden: z.number(),
  }),
});

export const collections = { librerias };
