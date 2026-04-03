import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-8">
      {/* Horse silhouette */}
      <div className="text-8xl mb-2">🐴</div>

      {/* Title */}
      <div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-gold tracking-tight leading-tight">
          Het Dorstige Hengsten
          <br />
          Toernooi 2026
        </h1>
        <p className="text-cream-dark mt-3 text-lg italic">
          Welk paard drinkt het slimst?
        </p>
      </div>

      {/* Decorative horseshoes */}
      <div className="text-3xl tracking-widest text-gold/40">
        ⊂⊃ ⊂⊃ ⊂⊃
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          href="/host/setup"
          className="bg-gold text-brown-900 font-bold text-lg py-4 px-6 rounded-xl
            hover:bg-gold-light active:scale-95 transition-all
            shadow-lg shadow-gold/20 min-h-[48px] flex items-center justify-center"
        >
          🐴 Nieuw Toernooi Starten
        </Link>
        <Link
          href="/join"
          className="bg-brown-700 text-cream border-2 border-gold/30 font-bold text-lg py-4 px-6 rounded-xl
            hover:bg-brown-600 hover:border-gold/50 active:scale-95 transition-all
            min-h-[48px] flex items-center justify-center"
        >
          🏇 Deelnemen
        </Link>
      </div>

      {/* Footer decoration */}
      <div className="mt-8 text-cream/30 text-sm">
        🍺 Een avond vol blind proeven en paardenkracht 🍺
      </div>
    </div>
  );
}
