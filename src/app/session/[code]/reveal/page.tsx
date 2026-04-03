'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Session, Beer, Participant, Guess } from '@/lib/types';
import LoadingScreen from '@/components/LoadingScreen';
import HorseshoeRain from '@/components/HorseshoeRain';

export default function RevealPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [session, setSession] = useState<Session | null>(null);
  const [beers, setBeers] = useState<Beer[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showRain, setShowRain] = useState(true);

  useEffect(() => {
    setIsHost(localStorage.getItem('is_host') === 'true');
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowRain(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code)
        .single();

      if (!sessionData) { setLoading(false); return; }
      setSession(sessionData);

      const { data: beersData } = await supabase
        .from('beers')
        .select('*')
        .eq('session_id', sessionData.id)
        .order('order_number');

      if (beersData) setBeers(beersData);

      const { data: participantsData } = await supabase
        .from('participants')
        .select('*')
        .eq('session_id', sessionData.id);

      if (participantsData) setParticipants(participantsData);

      const { data: guessesData } = await supabase
        .from('guesses')
        .select('*');

      if (guessesData) {
        const beerIds = new Set(beersData?.map(b => b.id) || []);
        setGuesses(guessesData.filter(g => beerIds.has(g.beer_id)));
      }

      setLoading(false);
    };

    fetchData();
  }, [code]);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('reveal-session')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const updated = payload.new as Session;
          setSession(updated);
          if (updated.status === 'active') {
            router.push(`/session/${code}/taste`);
          } else if (updated.status === 'finished') {
            router.push(`/session/${code}/scores`);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, code, router]);

  const currentBeer = useMemo(
    () => beers.find(b => b.order_number === session?.current_beer),
    [beers, session?.current_beer]
  );

  const currentGuesses = useMemo(
    () => currentBeer ? guesses.filter(g => g.beer_id === currentBeer.id) : [],
    [guesses, currentBeer]
  );

  const nonHostParticipants = useMemo(
    () => participants.filter(p => !p.is_host),
    [participants]
  );

  const nextBeer = async () => {
    if (!session) return;
    const next = (session.current_beer || 0) + 1;
    if (next > beers.length) {
      await supabase.from('sessions').update({ status: 'finished' }).eq('id', session.id);
    } else {
      await supabase.from('sessions').update({ status: 'active', current_beer: next }).eq('id', session.id);
    }
  };

  if (loading) return <LoadingScreen message="Het antwoord wordt onthuld..." />;

  if (!session || !currentBeer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
        <div className="text-5xl">🍺</div>
        <p className="text-cream text-lg">Geen bier om te onthullen</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 gap-5 max-w-lg mx-auto w-full">
      {showRain && <HorseshoeRain />}

      {/* Revealed beer */}
      <div className="text-center animate-fade-in-up">
        <p className="text-gold/60 text-sm font-semibold">
          Bier {session.current_beer} van {beers.length}
        </p>
        <div className="text-4xl mt-2 mb-3">🍺</div>
        <h1 className="text-2xl font-extrabold text-gold">{currentBeer.beer_name}</h1>
        <p className="text-cream-dark text-lg mt-1">{currentBeer.brewery}</p>
        <p className="text-cream/60 text-sm mt-2 italic">{currentBeer.description}</p>
        <div className="mt-2 inline-block bg-gold/20 border border-gold/30 rounded-lg px-3 py-1">
          <span className="text-gold text-sm font-semibold">{currentBeer.beer_type}</span>
        </div>
      </div>

      {/* Results per participant */}
      <div className="w-full">
        <h2 className="text-gold font-semibold mb-3 text-sm">Resultaten</h2>
        <div className="flex flex-col gap-2">
          {nonHostParticipants.map(p => {
            const guess = currentGuesses.find(g => g.participant_id === p.id);
            const guessedBeer = guess ? beers.find(b => b.id === guess.guessed_beer_id) : null;
            const isCorrect = guess?.is_correct;
            const isTypeCorrect = guess?.guessed_beer_type === currentBeer.beer_type;
            const points = (isCorrect ? 1 : 0) + (isTypeCorrect ? 1 : 0);

            return (
              <div
                key={p.id}
                className={`rounded-lg px-4 py-3 border animate-fade-in-up ${
                  points === 2
                    ? 'bg-green-900/30 border-green-600/40'
                    : points === 1
                    ? 'bg-gold/10 border-gold/30'
                    : 'bg-red-deep/20 border-red-deep/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-cream font-semibold">{p.name}</span>
                  </div>
                  <span className="text-gold font-bold text-sm">+{points} pt</span>
                </div>
                {guess && (
                  <div className="mt-2 ml-0 space-y-1">
                    <p className="text-sm flex items-center gap-2">
                      <span>{isCorrect ? '✅' : '❌'}</span>
                      <span className="text-cream/60">Bier:</span>
                      <span className="text-cream">{guessedBeer?.brewery} — {guessedBeer?.beer_name}</span>
                    </p>
                    <p className="text-sm flex items-center gap-2">
                      <span>{isTypeCorrect ? '✅' : '❌'}</span>
                      <span className="text-cream/60">Stijl:</span>
                      <span className="text-cream">{guess.guessed_beer_type || '—'}</span>
                    </p>
                    {guess.rating && (
                      <p className="text-sm flex items-center gap-2">
                        <span>⭐</span>
                        <span className="text-cream/60">Cijfer:</span>
                        <span className="text-cream font-semibold">{guess.rating}/10</span>
                      </p>
                    )}
                  </div>
                )}
                {!guess && (
                  <p className="text-cream/40 text-xs mt-1 italic">Niet ingevuld</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Host controls */}
      {isHost && (
        <div className="flex flex-col gap-2 w-full mt-2">
          <button
            onClick={() => router.push(`/session/${code}/scores`)}
            className="w-full bg-brown-700 text-cream border border-gold/30 font-bold py-3 px-4 rounded-xl
              hover:bg-brown-600 active:scale-95 transition-all min-h-[48px]"
          >
            🏆 Bekijk Ranglijst
          </button>
          <button
            onClick={nextBeer}
            className="w-full bg-gold text-brown-900 font-bold py-3 px-4 rounded-xl
              hover:bg-gold-light active:scale-95 transition-all min-h-[48px]"
          >
            {(session.current_beer || 0) >= beers.length
              ? '🏁 Eindig Toernooi'
              : 'Volgend Bier 🍺'}
          </button>
        </div>
      )}
    </div>
  );
}
