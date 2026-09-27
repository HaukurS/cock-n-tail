'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { haptic } from '@/lib/haptics'

const TABS = [
  { href: '/', label: 'Shuffle' },
  { href: '/saved', label: 'Saved' },
  { href: '/library', label: 'Library' },
] as const

export function TabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-line bg-surface/85 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = pathname === tab.href
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                onClick={() => haptic('tick')}
                aria-current={active ? 'page' : undefined}
                className="relative flex h-[4.5rem] flex-col items-center justify-center gap-1 text-[0.8125rem] tracking-wide transition-colors"
              >
                <span className={active ? 'text-accent' : 'text-muted'}>{tab.label}</span>
                <span
                  className={`h-[3px] w-6 rounded-full transition-all duration-300 ${
                    active ? 'bg-accent opacity-100' : 'opacity-0'
                  }`}
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
