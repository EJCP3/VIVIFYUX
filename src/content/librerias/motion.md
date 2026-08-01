---
nombre: "Motion"
categoria: "engine"
claim: 
  en: "Expressive, high-performance animations."
  es: "Animaciones expresivas y de alto rendimiento."
descripcion: 
  en: "An animation engine for the web with a declarative API and real springs. Runs on the Web Animations API whenever it can, so a good chunk of the work happens off the main thread. It's the foundation several other libraries in this catalog are built on."
  es: "Un motor de animación para la web con una API declarativa y resortes (springs) reales. Se ejecuta sobre la Web Animations API siempre que es posible, por lo que una buena parte del trabajo ocurre fuera del hilo principal. Es la base sobre la que se construyen varias otras bibliotecas de este catálogo."
tips:
  - en: "Animating transform and opacity keeps the work on the compositor; width, height or top force a layout pass on every frame."
    es: "Animar transform y opacity deja el trabajo en el compositor; width, height o top fuerzan una maquetación en cada fotograma."
  - en: "The layout prop animates a change of position or size by itself: you don't need to know the start and end values beforehand."
    es: "La prop layout anima por su cuenta un cambio de posición o tamaño: no hace falta conocer de antemano los valores de inicio y fin."
url: "https://motion.dev/"
npm: "motion"
imagen: "../../assets/motion.webp"
orden: 10
---