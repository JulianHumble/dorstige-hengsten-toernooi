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
  const [rating, setRating] = useState<number | null>(null);
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

  // Reset selection when beer changes
  useEffect(() => {
    setSelectedBeer(null);
    setRating(null);
  }, [session?.current_beer]);

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
    if (rating === null) return;
    setSubmitting(true);

    await supabase.from('guesses').insert({
      participant_id: participantId,
      beer_id: currentBeer.id,
      guessed_beer_id: selectedBeer,
      rating,
    });

    setSubmitting(false);
  };

  const nextBeer = async () => {
    if (!session) return;
    const next = (session.current_beer || 0) + 1;
    if (next > beers.length) {
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

  const guessedBeer = myGuess ? beers.find(b => b.id === myGuess.guessed_beer_id) : null;

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 gap-4 max-w-lg mx-auto w-full">
      {/* Header */}
      <div className="text-center">
        <p className="text-gold/60 text-sm font-semibold">
          Bier {session.current_beer} van {beers.length}
        </p>
        <h1 className="text-2xl font-extrabold text-gold mt-1">🍺 Bier #{session.current_beer}</h1>
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

      {/* Guess section (non-host, not yet guessed) */}
      {!isHost && !myGuess && (
        <div className="w-full">
          <h2 className="text-gold font-semibold mb-3 text-sm">Welk bier is dit? Kies hieronder:</h2>
          <div className="flex flex-col gap-2">
            {shuffledBeers.map((beer) => (
              <button
                key={beer.id}
                onClick={() => setSelectedBeer(beer.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                  selectedBeer === beer.id
                    ? 'bg-gold/20 border-gold'
                    : 'bg-brown-700/50 border-gold/20 hover:border-gold/40'
                }`}
              >
                <div className="flex items-start gap-2">
                  <span className={`mt-0.5 text-sm ${selectedBeer === beer.id ? 'text-gold' : 'text-gold/40'}`}>
                    {selectedBeer === beer.id ? '◉' : '○'}
                  </span>
                  <div className="flex-1">
                    <p className={`font-bold ${selectedBeer === beer.id ? 'text-gold' : 'text-cream'}`}>
                      {beer.brewery} — {beer.beer_name}
                    </p>
                    <p className="text-cream/50 text-sm mt-1 leading-snug">
                      {beer.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Rating */}
          <div className="mt-5">
            <h2 className="text-gold font-semibold mb-2 text-sm">Geef dit bier een cijfer:</h2>
            <div className="flex gap-1 justify-center flex-wrap">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <button
                  key={n}
                  onClick={() => setRating(n)}
                  className={`w-11 h-11 rounded-lg font-bold text-lg transition-all ${
                    rating === n
                      ? 'bg-gold text-brown-900 scale-110'
                      : 'bg-brown-700/50 border border-gold/20 text-cream hover:border-gold/40'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submitGuess}
            disabled={!selectedBeer || rating === null || submitting}
            className="w-full mt-4 bg-gold text-brown-900 font-bold py-3 px-4 rounded-xl
              hover:bg-gold-light active:scale-95 transition-all disabled:opacity-50 min-h-[48px]"
          >
            {submitting ? '🐴 Wordt verstuurd...' : '✅ Bevestig Keuze'}
          </button>
        </div>
      )}

      {/* Confirmation after submit */}
      {!isHost && myGuess && (
        <div className="w-full animate-fade-in-up">
          <div className="bg-gold/15 border-2 border-gold/50 rounded-2xl px-6 py-6 text-center">
            <div className="text-5xl mb-3">🐴</div>
            <h2 className="text-2xl font-extrabold text-gold mb-2">Ingediend!</h2>
            <p className="text-cream font-semibold">Jouw gok:</p>
            <div className="bg-brown-800/50 rounded-xl px-4 py-3 mt-2">
              <p className="text-gold font-bold">{guessedBeer?.brewery} — {guessedBeer?.beer_name}</p>
              <p className="text-cream/50 text-sm mt-1">{guessedBeer?.description}</p>
            </div>
            {myGuess.rating && (
              <div className="mt-3">
                <p className="text-cream/60 text-sm">Jouw cijfer:</p>
                <p className="text-3xl font-extrabold text-gold">{myGuess.rating}</p>
              </div>
            )}
            <p className="text-cream/40 text-xs mt-4">
              Wacht tot de Stalmeester het antwoord onthult...
            </p>
          </div>
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
