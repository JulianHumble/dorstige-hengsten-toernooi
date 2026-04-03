'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { DEFAULT_BEERS, type DefaultBeer } from '@/lib/beers';
import { generateCode } from '@/lib/utils';

export default function HostSetup() {
  const router = useRouter();
  const [hostName, setHostName] = useState('');
  const [beers, setBeers] = useState<DefaultBeer[]>(DEFAULT_BEERS);
  const [loading, setLoading] = useState(false);
  const [sessionCode, setSessionCode] = useState<string | null>(null);
  const [error, setError] = useState('');

  const updateBeer = (index: number, field: keyof DefaultBeer, value: string | number) => {
    setBeers(prev => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  const removeBeer = (index: number) => {
    setBeers(prev => prev.filter((_, i) => i !== index).map((b, i) => ({ ...b, order_number: i + 1 })));
  };

  const addBeer = () => {
    setBeers(prev => [...prev, {
      order_number: prev.length + 1,
      brewery: '',
      beer_name: '',
      description: '',
    }]);
  };

  const createSession = async () => {
    if (!hostName.trim()) {
      setError('Vul je naam in, Stalmeester!');
      return;
    }
    if (beers.some(b => !b.brewery.trim() || !b.beer_name.trim())) {
      setError('Vul voor elk bier minimaal de brouwerij en biernaam in.');
      return;
    }

    setLoading(true);
    setError('');

    const code = generateCode();

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .insert({ code, host_name: hostName.trim(), status: 'lobby' as const, current_beer: null })
      .select()
      .single();

    if (sessionError || !session) {
      setError('Kon sessie niet aanmaken. Probeer opnieuw.');
      setLoading(false);
      return;
    }

    const { error: beersError } = await supabase
      .from('beers')
      .insert(beers.map(b => ({
        session_id: session.id,
        order_number: b.order_number,
        brewery: b.brewery,
        beer_name: b.beer_name,
        description: b.description,
      })));

    if (beersError) {
      setError('Kon bieren niet opslaan. Probeer opnieuw.');
      setLoading(false);
      return;
    }

    // Create host as participant
    const { data: participant } = await supabase
      .from('participants')
      .insert({ session_id: session.id, name: hostName.trim(), is_host: true })
      .select()
      .single();

    if (participant) {
      localStorage.setItem('participant_id', participant.id);
      localStorage.setItem('is_host', 'true');
    }

    setSessionCode(code);
    setLoading(false);
  };

  const startTournament = () => {
    if (sessionCode) {
      router.push(`/session/${sessionCode}/lobby`);
    }
  };

  if (sessionCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-6">
        <div className="text-6xl">🐴</div>
        <h1 className="text-3xl font-extrabold text-gold">Toernooi Aangemaakt!</h1>
        <p className="text-cream-dark">Deel deze code met de deelnemers:</p>

        <div className="bg-brown-700 border-2 border-gold rounded-2xl px-8 py-6 shadow-lg">
          <p className="text-5xl font-mono font-extrabold text-gold tracking-[0.3em]">
            {sessionCode}
          </p>
        </div>

        <button
          onClick={() => navigator.clipboard.writeText(sessionCode)}
          className="text-gold/70 hover:text-gold text-sm underline underline-offset-4 transition-colors"
        >
          📋 Kopieer code
        </button>

        <button
          onClick={startTournament}
          className="bg-gold text-brown-900 font-bold text-lg py-4 px-8 rounded-xl
            hover:bg-gold-light active:scale-95 transition-all
            shadow-lg shadow-gold/20 min-h-[48px] mt-4"
        >
          🏁 Naar de Lobby
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen px-4 py-8 max-w-lg mx-auto w-full gap-6">
      <div className="text-center">
        <div className="text-5xl mb-2">🐴</div>
        <h1 className="text-3xl font-extrabold text-gold">Toernooi Opzetten</h1>
        <p className="text-cream-dark mt-1 text-sm">Stel je proeverij samen, Stalmeester!</p>
      </div>

      {/* Host name */}
      <div>
        <label className="block text-gold font-semibold mb-1 text-sm">Jouw naam</label>
        <input
          type="text"
          placeholder="Stalmeester"
          value={hostName}
          onChange={e => setHostName(e.target.value)}
          className="w-full bg-brown-700 border border-gold/30 text-cream rounded-lg px-4 py-3
            placeholder:text-cream/40 focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      {/* Beer list */}
      <div>
        <h2 className="text-gold font-semibold mb-3">🍺 Bieren ({beers.length})</h2>
        <div className="flex flex-col gap-3">
          {beers.map((beer, i) => (
            <div key={i} className="bg-brown-700/50 border border-gold/20 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gold font-bold text-sm">Bier #{beer.order_number}</span>
                {beers.length > 1 && (
                  <button
                    onClick={() => removeBeer(i)}
                    className="text-red-deep hover:text-red-deep-light text-xs font-semibold"
                  >
                    ✕ Verwijder
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Brouwerij"
                value={beer.brewery}
                onChange={e => updateBeer(i, 'brewery', e.target.value)}
                className="w-full bg-brown-800 border border-gold/20 text-cream rounded px-3 py-2 text-sm
                  placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors"
              />
              <input
                type="text"
                placeholder="Biernaam"
                value={beer.beer_name}
                onChange={e => updateBeer(i, 'beer_name', e.target.value)}
                className="w-full bg-brown-800 border border-gold/20 text-cream rounded px-3 py-2 text-sm
                  placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors"
              />
              <input
                type="text"
                placeholder="Beschrijving (optioneel)"
                value={beer.description}
                onChange={e => updateBeer(i, 'description', e.target.value)}
                className="w-full bg-brown-800 border border-gold/20 text-cream rounded px-3 py-2 text-sm
                  placeholder:text-cream/30 focus:outline-none focus:border-gold/50 transition-colors"
              />
            </div>
          ))}
        </div>
        <button
          onClick={addBeer}
          className="mt-3 w-full border-2 border-dashed border-gold/30 text-gold/60
            hover:border-gold/50 hover:text-gold/80 rounded-lg py-3 text-sm font-semibold transition-colors"
        >
          + Bier Toevoegen
        </button>
      </div>

      {error && (
        <div className="bg-red-deep/20 border border-red-deep text-cream rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={createSession}
        disabled={loading}
        className="bg-gold text-brown-900 font-bold text-lg py-4 px-6 rounded-xl
          hover:bg-gold-light active:scale-95 transition-all disabled:opacity-50
          shadow-lg shadow-gold/20 min-h-[48px]"
      >
        {loading ? '🐴 Wordt aangemaakt...' : '🏁 Maak Toernooi Aan'}
      </button>
    </div>
  );
}
