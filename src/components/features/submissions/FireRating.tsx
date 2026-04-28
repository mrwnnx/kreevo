'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { FireIcon } from './FireIcon'

interface FireRatingProps {
  value: number
  onChange?: (v: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const SIZES: Record<'sm' | 'md' | 'lg', string> = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
}

interface Particle {
  id: string
  x: number
  delay: number
  size: number
  duration: number
  rise: number
  rotate: number
}

function FireParticle({ particle }: { particle: Particle }) {
  const { id, x, delay, size, duration, rise, rotate } = particle
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: 0,
        animation: `fireRise_${id} ${duration}ms ease-out ${delay}ms both`,
        opacity: 0,
      }}
    >
      <style>{`
        @keyframes fireRise_${id} {
          0% { transform: translateY(0px) scale(1) rotate(0deg); opacity: 1; }
          60% { opacity: 0.8; }
          100% { transform: translateY(-${rise}px) scale(0.2) rotate(${rotate}deg); opacity: 0; }
        }
      `}</style>
      <svg
        viewBox="-33 0 255 255"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: size, height: size }}
        fillRule="evenodd"
      >
        <defs>
          <linearGradient id={`pfg-${id}`} gradientUnits="userSpaceOnUse" x1="94.141" x2="94.141" y1="255" y2=".188">
            <stop offset="0" stopColor="#ff4c0d" />
            <stop offset="1" stopColor="#fc9502" />
          </linearGradient>
        </defs>
        <g fillRule="evenodd">
          <path
            d="m187.899 164.809c-2.096 50.059-43.325 90.003-93.899 90.003-51.915 0-94-43.5-94-94 0-6.75-.121-20.24 10-43 6.057-13.621 9.856-22.178 12-30 1.178-4.299 3.469-11.129 10 0 3.851 6.562 4 16 4 16s14.328-10.995 24-32c14.179-30.793 2.866-49.2-1-62-1.338-4.428-2.178-12.386 7-9 9.352 3.451 34.076 20.758 47 39 18.445 26.035 25 51 25 51s5.906-7.33 8-15c2.365-8.661 2.4-17.239 9.999-7.999 7.227 8.787 17.96 25.3 24.001 40.999 10.969 28.509 7.899 55.997 7.899 55.997z"
            fill={`url(#pfg-${id})`}
          />
          <path
            d="m94 254.812c-35.899 0-65-29.101-65-65 0-21.661 8.729-34.812 26.896-52.646 11.632-11.419 22.519-25.444 27.146-34.994.911-1.88 2.984-11.677 10.977-.206 4.193 6.016 10.766 16.715 14.981 25.846 7.266 15.743 9 31 9 31s7.121-4.196 12-15c1.573-3.482 4.753-16.664 13.643-3.484 6.523 9.672 15.484 27.062 15.357 49.484 0 35.899-29.102 65-65 65z"
            fill="#fc9502"
          />
          <path
            d="m95 183.812c9.25 0 9.25 17.129 21 40 7.824 15.229-3.879 31-21 31s-26-13.879-26-31c0-17.12 16.75-40 26-40z"
            fill="#fce202"
          />
        </g>
      </svg>
    </div>
  )
}

export function FireRating({ value, onChange, readonly = false, size = 'md' }: FireRatingProps) {
  const [hovered, setHovered] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])
  const prevValue = useRef(value)

  const activeValue = hovered || value

  useEffect(() => {
    if (value === 5 && prevValue.current !== 5 && !readonly) {
      const newParticles: Particle[] = Array.from({ length: 24 }, (_, i) => ({
        id: `${Date.now()}-${i}`,
        x: Math.random() * 85 + 5,
        delay: Math.random() * 700,
        size: Math.random() * 22 + 14,
        duration: Math.random() * 900 + 900,
        rise: 150 + Math.random() * 100,
        rotate: Math.random() * 60 - 30,
      }))
      setParticles(newParticles)
      const t = setTimeout(() => setParticles([]), 2500)
      return () => clearTimeout(t)
    }
    prevValue.current = value
  }, [value, readonly])

  return (
    <div className="relative inline-flex">
      {particles.length > 0 && (
        <div className="absolute inset-0 overflow-visible pointer-events-none" style={{ zIndex: 50 }}>
          {particles.map((p) => (
            <FireParticle key={p.id} particle={p} />
          ))}
        </div>
      )}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((fire) => (
          <button
            key={fire}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onChange?.(fire)}
            onMouseEnter={() => !readonly && setHovered(fire)}
            onMouseLeave={() => !readonly && setHovered(0)}
            className={cn(
              SIZES[size],
              'transition-transform duration-150',
              !readonly && 'cursor-pointer',
              !readonly && fire <= activeValue && 'scale-110',
              !readonly && 'hover:scale-125',
              readonly && 'cursor-default',
            )}
            aria-label={`${fire} sur 5`}
          >
            <FireIcon filled={fire <= activeValue} className="w-full h-full" />
          </button>
        ))}
      </div>
    </div>
  )
}
