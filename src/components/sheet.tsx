'use client'

import { AnimatePresence, motion } from 'motion/react'

/** Bottom sheet shell. Children mount only while open so form state
 *  starts fresh on each presentation. */
export function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean
  onClose: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-label={label}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88vh] max-w-lg flex-col rounded-t-3xl border-t border-line bg-surface"
            style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
