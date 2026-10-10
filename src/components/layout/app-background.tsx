import Image from "next/image";

export function AppBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Imagen de fondo ambiental generada con IA */}
      <div className="absolute inset-0">
        <Image
          src="/images/bg-ambient.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center transition-opacity duration-700 opacity-20 dark:opacity-45 scale-105"
        />
      </div>

      {/* Máscara de gradiente y contraste para garantizar legibilidad WCAG AA */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/60 to-background/95 dark:from-background/75 dark:via-background/50 dark:to-background/90" />

      {/* Sutiles luces ambientales que complementan los tonos violeta y ámbar */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[550px] w-[900px] rounded-full bg-primary-600/10 dark:bg-primary-500/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full bg-accent-500/10 dark:bg-accent-400/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-20 h-96 w-96 rounded-full bg-primary-700/10 dark:bg-primary-800/20 blur-3xl pointer-events-none" />
    </div>
  );
}
