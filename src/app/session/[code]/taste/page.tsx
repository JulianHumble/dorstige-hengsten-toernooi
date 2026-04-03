'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Session, Beer, Participant, Guess } from '@/lib/types';
import { shuffleArray } from '@/lib/utils';
import LoadingScreen from '@/components/LoadingScreen';

export default function TastePage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [session, setSession] = useState<Session | null>(null);
  const [beers, setBeers] = useState<Beer[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [selectedBeer, setSelectedBeer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsHost(localStorage.getItem('is_host') === 'true');
    setParticipantId(localStorage.getItem('participant_id'));
  }, []);

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code)
        .single();

      if (!sessionData) { setLoading(false); return; }
      setSession(sessionData);

      if (sessionData.status === 'finished') {
        router.push(`/session/${code}/scores`);
        return;
      }

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
        // Filter to only guesses for beers in this session
        const beerIds = new Set(beersData?.map(b => b.id) || []);
        setGuesses(guessesData.filter(g => beerIds.has(g.beer_id)));
      }

      setLoading(false);
    };

    fetchData();
  }, [code, router]);

  // Realtime: session updates
  useEffect(() => {
    if (!session) return;

    const sessionChannel = supabase
      .channel('taste-session')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const updated = payload.new as Session;
          setSession(updated);
          if (updated.status === 'reveal') {
            router.push(`/session/${code}/reveal`);
          } else if (updated.status === 'finished') {
            router.push(`/session/${code}/scores`);
          }
        }
      )
      .subscribe();

    const guessChannel = supabase
      .channel('taste-guesses')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'guesses' },
        (payload) => {
          const newGuess = payload.new as Guess;
          // Check if this guess is for a beer in this session
          const beerIds = new Set(beers.map(b => b.id));
          if (beerIds.has(newGuess.beer_id)) {
            setGuesses(prev => {
              if (prev.find(g => g.id === newGuess.id)) return prev;
              return [...prev, newGuess];
            });
          }
        }
      )
      .subscribe();

    const beerChannel = supabase
      .channel('taste-beers')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'beers' },
        (payload) => {
          const updated = payload.new as Beer;
          setBeers(prev => prev.map(b => b.id === updated.id ? updated : b));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(guessChannel);
      supabase.removeChannel(beerChannel);
    };
  }, [session, beers, code, router]);

  const currentBeer = useMemo(
    () => beers.find(b => b.order_number === session?.current_beer),
    [beers, session?.current_beer]
  );

  const shuffledBeers = useMemo(
    () => shuffleArray(beers),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [beers.length]
  );

  const currentGuesses = useMemo(
    () => currentBeer ? guesses.filter(g => g.beer_id === currentBeer.id) : [],
    [guesses, currentBeer]
  );

  const myGuess = useMemo(
    () => currentGuesses.find(g => g.participant_id === participantId),
    [currentGuesses, participantId]
  );

  const nonHostParticipants = useMemo(
    () => participants.filter(p => !p.is_host),
    [participants]
  );

  const submitGuess = async () => {
    if (!selectedBeer || !currentBeer || !participantId || myGuess) return;
    setSubmitting(true);

    await supabase.from('guesses').insert({
      participant_id: participantId,
      beer_id: currentBeer.id,
      guessed_beer_id: selectedBeer,
    });

    setSubmitting(false);
    setSelectedBeer(null);
  };

  const nextBeer = async () => {
    if (!session) return;
    const next = (session.current_beer || 0) + 1;
    if (next > beers.length) {
      // All beers done
      await supabase.from('sessions').update({ status: 'finished' }).eq('id', session.id);
    } else {
      await supabase.from('sessions').update({ current_beer: next }).eq('id', session.id);
    }
  };

  const revealBeer = async () => {
    if (!session || !currentBeer) return;
    await supabase.from('beers').update({ revealed: true }).eq('id', currentBeer.id);
    await supabase.from('sessions').update({ status: 'reveal' }).eq('id', session.id);
  };

  if (loading) return <LoadingScreen message="De bieren worden klaargezet..." />;

  if (!session || !currentBeer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
        <div className="text-5xl">🍺</div>
        <p className="text-cream text-lg">Geen actief bier gevonden</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 gap-4 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="text-center">
        <p className="text-gold/60 text-sm font-semibold">
          Bier {session.current_beer} van {beers.length}
        </p>
        <h1 className="text-2xl font-extrabold text-gold mt-1">🍺 Bier #{session.current_beer}</h1>
      </div>

      {/* Beer description (NO name/brewery) */}
      <div className="bg-brown-700/50 border border-gold/20 rounded-xl px-5 py-4 w-full text-center">
        <p className="text-cream italic">{currentBeer.description}</p>
      </div>

      {/* Host controls */}
      {isHost && (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex gap-2">
            <button
              onClick={revealBeer}
              className="flex-1 bg-gold text-brown-900 font-bold py-3 px-4 rounded-xl
                hover:bg-gold-light active:scale-95 transition-all min-h-[48px]"
            >
              🐴 Onthul dit Bier!
            </button>
            <button
              onClick={() => router.push(`/session/${code}/scores`)}
              className="bg-brown-700 text-cream border border-gold/30 font-semibold py-3 px-4 rounded-xl
                hover:bg-brown-600 transition-all min-h-[48px] text-sm"
            >
              🏆
            </button>
          </div>
          <button
            onClick={nextBeer}
            className="w-full bg-brown-700 text-cream border border-gold/30 font-bold py-3 px-4 rounded-xl
              hover:bg-brown-600 active:scale-95 transition-all min-h-[48px]"
          >
            {(session.current_beer || 0) >= beers.length ? '🏁 Eindig Toernooi' : 'Volgend Bier 🍺'}
          </button>
        </div>
      )}

      {/* Guess section (non-host) */}
      {!isHost && !myGuess && (
        <div className="w-full">
          <h2 className="text-gold font-semibold mb-2 text-sm">Welk bier is dit?</h2>
          <div className="flex flex-col gap-2">
            {shuffledBeers.map((beer) => (
              <button
                key={beer.id}
                onClick={() => setSelectedBeer(beer.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all min-h-[48px] ${
                  selectedBeer === beer.id
                    ? 'bg-gold/20 border-gold text-gold'
                    : 'bg-brown-700/50 border-gold/20 text-cream hover:border-gold/40'
                }`}
              >
                <span className="font-semibold">{beer.brewery}</span>
                <span className="text-cream/60"> — </span>
                <span>{beer.beer_name}</span>
              </button>
            ))}
          </div>
          <button
            onClick={submitGuess}
            disabled={!selectedBeer || submitting}
            className="w-full mt-3 bg-gold text-brown-900 font-bold py-3 px-4 rounded-xl
              hover:bg-gold-light active:scale-95 transition-all disabled:opacity-50 min-h-[48px]"
          >
            {submitting ? '🐴 Wordt verstuurd...' : '✅ Bevestig Keuze'}
          </button>
        </div>
      )}

      {/* My guess confirmed */}
      {!isHost && myGuess && (
        <div className="bg-gold/10 border border-gold/30 rounded-xl px-4 py-3 w-full text-center">
          <p className="text-gold font-semibold text-sm">✅ Jouw keuze is ingediend!</p>
          <p className="text-cream/60 text-xs mt-1">
            {beers.find(b => b.id === myGuess.guessed_beer_id)?.brewery} — {beers.find(b => b.id === myGuess.guessed_beer_id)?.beer_name}
          </p>
        </div>
      )}

      {/* Live guesses overview */}
      <div className="w-full mt-2">
        <h2 className="text-gold font-semibold mb-2 text-sm">
          Ingediende gokken ({currentGuesses.length}/{nonHostParticipants.length})
        </h2>
        <div className="flex flex-wrap gap-2">
          {nonHostParticipants.map(p => {
            const guess = currentGuesses.find(g => g.participant_id === p.id);
            return (
              <div
                key={p.id}
                className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                  guess
                    ? 'bg-gold/20 border border-gold/40'
                    : 'bg-brown-700/30 border border-gold/10'
                }`}
              >
                {guess ? '🐴' : '⏳'}
                <span className="text-cream">{p.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
