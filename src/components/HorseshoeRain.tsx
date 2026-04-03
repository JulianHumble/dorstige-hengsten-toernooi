'use client';

import { useEffect, useState } from 'react';

export default function HorseshoeRain() {
  const [horseshoes, setHorseshoes] = useState<{ id: number; left: number; delay: number; size: number }[]>([]);

  useEffect(() => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      size: 20 + Math.random() * 30,
    }));
    setHorseshoes(items);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {horseshoes.map((h) => (
        <div
          key={h.id}
          className="absolute animate-horseshoe-fall"
          style={{
            left: `${h.left}%`,
            animationDelay: `${h.delay}s`,
            fontSize: `${h.size}px`,
          }}
        >
          🐴
        </div>
      ))}
    </div>
  );
}
