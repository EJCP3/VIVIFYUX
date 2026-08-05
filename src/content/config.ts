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

    /* clip mudo en loop que reemplaza la miniatura estática cuando el efecto
       de la librería se explica mejor en movimiento que en una captura sola.
       Vive en public/videos/ —no en src/assets/— porque el pipeline de
       `image()` no procesa video; va la ruta tal cual. Opcional a propósito:
       la mayoría de las fichas se queda con la imagen sola */
    video: z.string().optional(),

    orden: z.number(),
  }),
});

export const collections = { librerias };