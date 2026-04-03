'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Session, Beer, Participant, Guess } from '@/lib/types';
import LoadingScreen from '@/components/LoadingScreen';
import HorseshoeRain from '@/components/HorseshoeRain';

export default function ScoresPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [session, setSession] = useState<Session | null>(null);
  const [beers, setBeers] = useState<Beer[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [guesses, setGuesses] = useState<Guess[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setIsHost(localStorage.getItem('is_host') === 'true');
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

  // Listen for session changes
  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel('scores-session')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${session.id}` },
        (payload) => {
          const updated = payload.new as Session;
          setSession(updated);
          if (updated.status === 'active') {
            router.push(`/session/${code}/taste`);
          } else if (updated.status === 'reveal') {
            router.push(`/session/${code}/reveal`);
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [session, code, router]);

  const nonHostParticipants = useMemo(
    () => participants.filter(p => !p.is_host),
    [participants]
  );

  const rankings = useMemo(() => {
    return nonHostParticipants
      .map(p => {
        const playerGuesses = guesses.filter(g => g.participant_id === p.id);
        const beerPoints = playerGuesses.filter(g => g.is_correct).length;
        const typePoints = playerGuesses.filter(g => {
          const beer = beers.find(b => b.id === g.beer_id);
          return beer && g.guessed_beer_type === beer.beer_type;
        }).length;
        return { participant: p, score: beerPoints + typePoints, beerPoints, typePoints };
      })
      .sort((a, b) => b.score - a.score);
  }, [nonHostParticipants, guesses, beers]);

  const isFinished = session?.status === 'finished';
  const winner = rankings[0];

  const getBadge = (rank: number) => {
    if (rank === 0) return '🏆';
    if (rank === 1) return '🥈';
    if (rank === 2) return '🥉';
    return '';
  };

  const backToTaste = () => {
    router.push(`/session/${code}/taste`);
  };

  if (loading) return <LoadingScreen message="De ranglijst wordt opgesteld..." />;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
        <div className="text-5xl">🏆</div>
        <p className="text-cream text-lg">Sessie niet gevonden</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 gap-5 max-w-lg mx-auto w-full">
      {isFinished && <HorseshoeRain />}

      {/* Header */}
      <div className="text-center">
        <div className="text-5xl mb-2">🏆</div>
        <h1 className="text-3xl font-extrabold text-gold">De Stal Ranglijst</h1>
        {isFinished && (
          <p className="text-cream-dark mt-1 text-sm">Eindstand</p>
        )}
        {!isFinished && (
          <p className="text-cream-dark mt-1 text-sm">
            Na bier {session.current_beer} van {beers.length}
          </p>
        )}
      </div>

      {/* Winner announcement (only when finished) */}
      {isFinished && winner && (
        <div className="bg-gold/20 border-2 border-gold rounded-2xl px-6 py-5 text-center w-full animate-fade-in-up animate-pulse-gold">
          <p className="text-gold text-sm font-semibold mb-1">Hengst van de Avond</p>
          <p className="text-3xl font-extrabold text-gold">
            🏆 {winner.participant.name}
          </p>
          <p className="text-cream-dark mt-1">{winner.score} punten ({winner.beerPoints} bier + {winner.typePoints} stijl)</p>
        </div>
      )}

      {/* Rankings */}
      <div className="w-full">
        <div className="flex flex-col gap-2">
          {rankings.map((entry, i) => (
            <div
              key={entry.participant.id}
              className={`rounded-xl px-4 py-4 border flex items-center gap-3 animate-fade-in-up ${
                i === 0
                  ? 'bg-gold/15 border-gold/50'
                  : i === 1
                  ? 'bg-gold/8 border-gold/30'
                  : i === 2
                  ? 'bg-gold/5 border-gold/20'
                  : 'bg-brown-700/30 border-gold/10'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-2xl w-8 text-center">
                {getBadge(i) || <span className="text-cream/40 text-sm font-bold">#{i + 1}</span>}
              </span>
              <div className="flex-1">
                <p className="text-cream font-bold">{entry.participant.name}</p>
                <p className="text-cream/40 text-xs">
                  {entry.beerPoints} bier + {entry.typePoints} stijl
                </p>
              </div>
              <div className="text-right">
                <p className="text-gold font-extrabold text-xl">{entry.score}</p>
                <p className="text-cream/40 text-xs">
                  {entry.score === 1 ? 'punt' : 'punten'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Host controls */}
      {isHost && !isFinished && (
        <button
          onClick={backToTaste}
          className="w-full bg-gold text-brown-900 font-bold py-3 px-4 rounded-xl
            hover:bg-gold-light active:scale-95 transition-all min-h-[48px]"
        >
          🍺 Terug naar Proeven
        </button>
      )}

      {isFinished && (
        <div className="text-center mt-4">
          <p className="text-cream/30 text-sm">
            🐴 Bedankt voor het meedoen aan Het Dorstige Hengsten Toernooi 2026! 🐴
          </p>
        </div>
      )}
    </div>
  );
}
