'use client'

import { Button } from '@/components/ui/button'

interface CompletionModalProps {
  firstName: string
  onStart: () => void
}

export function CompletionModal({ firstName, onStart }: CompletionModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 supports-[backdrop-filter]:backdrop-blur-sm px-4 onb-overlay">
      <div className="onb-pop relative w-full max-w-md rounded-[var(--radius-card)] bg-popover text-popover-foreground border border-border p-8 sm:p-10 shadow-lg text-center">
        <Confetti />
        <div className="text-7xl onb-bounce" aria-hidden>
          🎉
        </div>
        <h2 className="mt-4 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
          You&apos;re all set, {firstName}!
        </h2>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Your Kreevo profile is ready.
          <br />
          Time to show the MENA design world what you&apos;re made of.
        </p>
        <Button onClick={onStart} size="lg" className="mt-7 w-full h-12">
          Start exploring →
        </Button>
      </div>

      <style jsx>{`
        :global(.onb-overlay) {
          animation: onbOverlayIn 0.2s ease-out;
        }
        :global(.onb-pop) {
          animation: onbPopIn 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        }
        :global(.onb-bounce) {
          animation: onbBounce 1.2s ease-in-out infinite;
          display: inline-block;
        }
        @keyframes onbOverlayIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes onbPopIn {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes onbBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
      `}</style>
    </div>
  )
}

function Confetti() {
  const pieces = Array.from({ length: 18 })
  const colors = ['#7c3aed', '#a855f7', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4']
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => {
        const left = (i * 53) % 100
        const delay = (i % 6) * 0.15
        const size = 6 + (i % 3) * 2
        const color = colors[i % colors.length]
        return (
          <span
            key={i}
            className="absolute top-0 rounded-sm"
            style={{
              left: `${left}%`,
              width: size,
              height: size,
              backgroundColor: color,
              animation: `onbConfetti 2.4s ${delay}s linear infinite`,
              opacity: 0.85,
            }}
          />
        )
      })}
      <style jsx>{`
        @keyframes onbConfetti {
          0% {
            transform: translateY(-30px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          100% {
            transform: translateY(420px) rotate(540deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
