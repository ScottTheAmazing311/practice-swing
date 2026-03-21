'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-sm w-full">
        <h2 className="font-display text-2xl text-text mb-2">Something went wrong</h2>
        <p className="text-text-muted text-sm mb-8">{error.message}</p>
        <button
          onClick={reset}
          className="w-full py-4 rounded-2xl font-semibold text-base bg-accent text-bg transition-all duration-200 hover:brightness-110 active:scale-[0.98] min-h-[56px]"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
