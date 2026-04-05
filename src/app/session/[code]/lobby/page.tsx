'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Session, Participant } from '@/lib/types';
import LoadingScreen from '@/components/LoadingScreen';
import { useSessionPolling } from '@/lib/useSessionPolling';

export default function LobbyPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isHost, setIsHost] = useState(false);
  const [loading, setLoading] = useState(true);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    setIsHost(localStorage.getItem('is_host') === 'true');
  }, []);

  const handleSessionUpdate = useCallback((updated: Session) => {
    setSession(updated);
    if (updated.status === 'active' || updated.status === 'reveal') {
      router.push(`/session/${code}/taste`);
    } else if (updated.status === 'finished') {
      router.push(`/session/${code}/scores`);
    }
  }, [code, router]);

  // Fetch session and participants
  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code)
        .single();

      if (sessionData) {
        setSession(sessionData);
        sessionIdRef.current = sessionData.id;

        if (sessionData.status === 'active' || sessionData.status === 'reveal') {
          router.push(`/session/${code}/taste`);
          return;
        }
        if (sessionData.status === 'finished') {
          router.push(`/session/${code}/scores`);
          return;
        }

        const { data: participantsData } = await supabase
          .from('participants')
          .select('*')
          .eq('session_id', sessionData.id)
          .order('joined_at', { ascending: true });

        if (participantsData) setParticipants(participantsData);
      }
      setLoading(false);
    };

    fetchData();
  }, [code, router]);

  // Polling fallback
  useSessionPolling(session?.id ?? null, handleSessionUpdate);

  // Realtime subscriptions — only depends on sessionIdRef being set
  useEffect(() => {
    if (!sessionIdRef.current) return;
    const sid = sessionIdRef.current;

    const participantChannel = supabase
      .channel(`lobby-participants-${sid}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'participants', filter: `session_id=eq.${sid}` },
        (payload) => {
          setParticipants(prev => {
            if (prev.find(p => p.id === (payload.new as Participant).id)) return prev;
            return [...prev, payload.new as Participant];
          });
        }
      )
      .subscribe();

    const sessionChannel = supabase
      .channel(`lobby-session-${sid}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sessions', filter: `id=eq.${sid}` },
        (payload) => {
          handleSessionUpdate(payload.new as Session);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [session?.id, handleSessionUpdate]);

  const startTournament = async () => {
    if (!session) return;
    await supabase
      .from('sessions')
      .update({ status: 'active', current_beer: 1 })
      .eq('id', session.id);
    // Navigate immediately for host
    router.push(`/session/${code}/taste`);
  };

  if (loading) return <LoadingScreen message="De stal wordt geopend..." />;

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
        <div className="text-5xl">🐴</div>
        <p className="text-cream text-lg">Sessie niet gevonden</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-8 text-center gap-6">
      <div className="text-5xl">🐴</div>
      <h1 className="text-3xl font-extrabold text-gold">De Stal</h1>
      <p className="text-cream-dark text-sm">
        Code: <span className="font-mono font-bold text-gold text-lg">{code}</span>
      </p>

      <div className="w-full max-w-sm">
        <h2 className="text-gold font-semibold mb-3 text-sm">
          Hengsten in de stal ({participants.length})
        </h2>
        <div className="flex flex-col gap-2">
          {participants.map((p, i) => (
            <div
              key={p.id}
              className="bg-brown-700/50 border border-gold/20 rounded-lg px-4 py-3 flex items-center gap-3 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <span className="text-2xl">🐴</span>
              <span className="text-cream font-semibold">{p.name}</span>
              {p.is_host && (
                <span className="ml-auto text-xs bg-gold/20 text-gold px-2 py-1 rounded">
                  Stalmeester
                </span>
              )}
            </div>
          ))}
        </div>

        {participants.length === 0 && (
          <p className="text-cream/40 text-sm mt-4 italic">
            Wachten op hengsten...
          </p>
        )}
      </div>

      {!isHost && (
        <div className="mt-4">
          <div className="text-3xl animate-horseshoe-spin">🐴</div>
          <p className="text-cream-dark text-sm mt-2">
            De hengsten worden verzameld...
          </p>
          <p className="text-cream/40 text-xs mt-1">
            Wacht tot de Stalmeester het toernooi start
          </p>
        </div>
      )}

      {isHost && (
        <button
          onClick={startTournament}
          disabled={participants.length < 2}
          className="bg-gold text-brown-900 font-bold text-lg py-4 px-8 rounded-xl
            hover:bg-gold-light active:scale-95 transition-all disabled:opacity-50
            shadow-lg shadow-gold/20 min-h-[48px] mt-4 animate-pulse-gold"
        >
          🏁 Laat het Toernooi Beginnen!
        </button>
      )}
    </div>
  );
}
