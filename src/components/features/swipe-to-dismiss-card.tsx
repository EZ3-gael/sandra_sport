'use client';

import { useState, useTransition } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
} from 'framer-motion';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import {
  dismissSession,
  restoreSession,
} from '@/app/(app)/sessions/actions';

const COMMIT_THRESHOLD_PX = 140;

export function SwipeToDismissCard({
  sessionId,
  sessionTitle,
  children,
}: {
  sessionId: string;
  sessionTitle: string;
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const [, startTransition] = useTransition();
  const x = useMotionValue(0);
  const revealOpacity = useTransform(x, [0, 60, COMMIT_THRESHOLD_PX], [0, 0.5, 1]);

  if (hidden) return null;

  async function handleDragEnd(
    _e: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    if (info.offset.x > COMMIT_THRESHOLD_PX) {
      await animate(x, 600, { duration: 0.18, ease: 'easeOut' });
      setHidden(true);

      startTransition(() => {
        void (async () => {
          const result = await dismissSession(sessionId);
          if (!result.ok) {
            toast.error(`Impossible de masquer : ${result.error}`);
            setHidden(false);
            x.set(0);
            return;
          }
          toast(`« ${sessionTitle} » retirée`, {
            action: {
              label: 'Annuler',
              onClick: () => {
                void (async () => {
                  const r = await restoreSession(sessionId);
                  if (!r.ok) {
                    toast.error(`Impossible d'annuler : ${r.error}`);
                  }
                })();
              },
            },
            duration: 5000,
          });
        })();
      });
    } else {
      await animate(x, 0, { type: 'spring', stiffness: 400, damping: 40 });
    }
  }

  return (
    <li className="relative overflow-hidden rounded-lg">
      <motion.div
        style={{ opacity: revealOpacity }}
        className="pointer-events-none absolute inset-0 flex items-center justify-start rounded-lg bg-destructive px-6 text-destructive-foreground"
      >
        <Trash2 className="size-5" />
        <span className="ml-2 text-sm font-medium">Retirer</span>
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 600 }}
        dragElastic={{ left: 0, right: 0.2 }}
        style={{ x }}
        onDragEnd={handleDragEnd}
        className="relative touch-pan-y"
      >
        {children}
      </motion.div>
    </li>
  );
}
