import { defineConfig } from 'astro/config';

export default defineConfig({
  /* De acá salen el canonical y las URL absolutas de og:image y og:url. Tiene
     que ser un dominio que resuelva: mientras apuntaba a vivifyux.com —que
     todavía no está conectado— Telegram pedía la imagen ahí, no la encontraba,
     y armaba la tarjeta sin ella.

     Cuando el dominio propio esté apuntando a Vercel, cambiar esta línea por
     'https://vivifyux.com' y volver a desplegar. */
  site: 'https://vivifyux-iu.vercel.app',
});
