'use client';

export default function LoadingScreen({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <div className="text-6xl animate-horseshoe-spin">🐴</div>
      <p className="text-gold text-lg font-semibold">
        {message || 'De hengsten worden gezadeld...'}
      </p>
    </div>
  );
}
