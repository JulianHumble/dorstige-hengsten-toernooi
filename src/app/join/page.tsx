'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function JoinPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const joinSession = async () => {
    if (!code.trim() || code.trim().length !== 6) {
      setError('Vul een geldige 6-cijferige code in.');
      return;
    }
    if (!name.trim()) {
      setError('Vul je naam in!');
      return;
    }

    setLoading(true);
    setError('');

    // Find session
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('code', code.trim())
      .single();

    if (!session) {
      setError('Sessie niet gevonden. Controleer de code.');
      setLoading(false);
      return;
    }

    if (session.status === 'finished') {
      setError('Dit toernooi is al afgelopen.');
      setLoading(false);
      return;
    }

    // Add participant
    const { data: participant, error: participantError } = await supabase
      .from('participants')
      .insert({ session_id: session.id, name: name.trim(), is_host: false })
      .select()
      .single();

    if (participantError || !participant) {
      setError('Kon niet deelnemen. Probeer opnieuw.');
      setLoading(false);
      return;
    }

    localStorage.setItem('participant_id', participant.id);
    localStorage.setItem('is_host', 'false');
    router.push(`/session/${code.trim()}/lobby`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-6">
      <div className="text-6xl">🏇</div>
      <h1 className="text-3xl font-extrabold text-gold">Deelnemen</h1>
      <p className="text-cream-dark text-sm">Vul de code in die je van de Stalmeester hebt gekregen</p>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <input
          type="text"
          placeholder="6-cijferige code"
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          maxLength={6}
          className="w-full bg-brown-700 border border-gold/30 text-cream text-center text-2xl font-mono
            tracking-[0.3em] rounded-lg px-4 py-4
            placeholder:text-cream/30 placeholder:text-base placeholder:tracking-normal
            focus:outline-none focus:border-gold transition-colors"
        />
        <input
          type="text"
          placeholder="Naam van je hengst"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full bg-brown-700 border border-gold/30 text-cream rounded-lg px-4 py-3
            placeholder:text-cream/40 focus:outline-none focus:border-gold transition-colors"
        />

        {error && (
          <div className="bg-red-deep/20 border border-red-deep text-cream rounded-lg px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={joinSession}
          disabled={loading}
          className="bg-gold text-brown-900 font-bold text-lg py-4 px-6 rounded-xl
            hover:bg-gold-light active:scale-95 transition-all disabled:opacity-50
            shadow-lg shadow-gold/20 min-h-[48px]"
        >
          {loading ? '🐴 Even geduld...' : '🐴 Spring in de Stal!'}
        </button>
      </div>
    </div>
  );
}
