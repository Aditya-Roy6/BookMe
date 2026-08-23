import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { CheckCircle2, Loader2, QrCode } from 'lucide-react';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ReceiptPrinterContext = createContext(null);

const easeOut = [0.23, 1, 0.32, 1];
const easeInOut = [0.77, 0, 0.175, 1];

const receiptToothCount = 28;
const receiptToothDepth = 8;
const receiptToothPoints = Array.from(
  { length: receiptToothCount * 2 },
  (_, index) => {
    const x = 100 - ((index + 1) * 100) / (receiptToothCount * 2);
    const y = index % 2 === 0 ? '100%' : `calc(100% - ${receiptToothDepth}px)`;
    return `${x}% ${y}`;
  }
).join(', ');
const receiptClipPath = `polygon(0 0, 100% 0, 100% calc(100% - ${receiptToothDepth}px), ${receiptToothPoints})`;

const printingTransformKeyframes = [
  'translateY(calc(-100% + 2px))',
  'translateY(-91%)',
  'translateY(-91%)',
  'translateY(-81%)',
  'translateY(-81%)',
  'translateY(-70%)',
  'translateY(-70%)',
  'translateY(-58%)',
  'translateY(-58%)',
  'translateY(-45%)',
  'translateY(-45%)',
  'translateY(-32%)',
  'translateY(-32%)',
  'translateY(-20%)',
  'translateY(-20%)',
  'translateY(-10%)',
  'translateY(-10%)',
  'translateY(-3%)',
  'translateY(-3%)',
  'translateY(0%)',
];

const printingKeyframeTimes = [
  0, 0.075, 0.105, 0.18, 0.21, 0.285, 0.315, 0.39, 0.42, 0.495, 0.525, 0.6,
  0.63, 0.705, 0.735, 0.81, 0.84, 0.915, 0.945, 1,
];

const statusLabels = {
  processing: 'Processing transaction...',
  printing: 'Printing your admission pass...',
  complete: 'Order complete & verified!',
};

function useReceiptPrinter(component) {
  const context = useContext(ReceiptPrinterContext);
  if (!context) {
    throw new Error(`${component} must be used inside ReceiptPrinter.Root.`);
  }
  return context;
}

export function ReceiptPrinterRoot({
  'aria-label': ariaLabel = 'Receipt printer',
  animate = true,
  children,
  className,
  feedMotion = 'stepped',
  stage,
  ...props
}) {
  const shouldReduceMotion = useReducedMotion();
  const context = {
    animate,
    feedMotion,
    shouldMove: animate && !shouldReduceMotion,
    stage,
  };

  return (
    <ReceiptPrinterContext.Provider value={context}>
      <section
        aria-label={ariaLabel}
        className={cn(
          'relative isolate flex w-full max-w-sm sm:max-w-md flex-col items-center select-none',
          className
        )}
        data-stage={stage}
        {...props}
      >
        {children}
      </section>
    </ReceiptPrinterContext.Provider>
  );
}

export function ReceiptPrinterMachine({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'relative isolate w-full overflow-hidden rounded-3xl border border-[#2e2e2e] bg-[#181818] p-4 pb-8 shadow-2xl z-20',
        className
      )}
      {...props}
    >
      {children}
      {/* Printer paper ejection slot */}
      <div
        aria-hidden="true"
        className="absolute inset-x-6 bottom-3 z-40 h-2.5 rounded-full border border-black bg-[#0a0a0a] shadow-inner"
      />
    </div>
  );
}

export function ReceiptPrinterHeader({ children, className, ...props }) {
  return (
    <div
      className={cn('relative z-10 flex h-10 items-center justify-between mb-3', className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ReceiptPrinterScreen({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'relative z-10 isolate overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f0f] p-4 text-white shadow-inner',
        className
      )}
      {...props}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function StatusIndicator({ animate, move, stage }) {
  const isComplete = stage === 'complete';

  return (
    <span
      aria-hidden="true"
      className="relative grid size-5 shrink-0 place-items-center"
    >
      <AnimatePresence initial={false} mode="sync">
        {isComplete ? (
          <motion.span
            animate={{ opacity: 1, transform: 'scale(1)' }}
            className="col-start-1 row-start-1 grid place-items-center text-[#1ed760]"
            exit={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.96)' : 'scale(1)',
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.94)' : 'scale(1)',
            }}
            key="complete"
            transition={{ duration: animate ? 0.16 : 0, ease: easeOut }}
          >
            <CheckCircle2 className="w-5 h-5 text-[#1ed760]" />
          </motion.span>
        ) : (
          <motion.span
            animate={{ opacity: 1, transform: 'scale(1)' }}
            className="col-start-1 row-start-1 grid place-items-center text-[#1ed760]"
            exit={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.96)' : 'scale(1)',
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: move ? 'scale(0.94)' : 'scale(1)',
            }}
            key="working"
            transition={{ duration: animate ? 0.16 : 0, ease: easeOut }}
          >
            <Loader2
              className={cn(
                'w-5 h-5 text-[#1ed760]',
                animate && 'animate-spin motion-reduce:animate-none'
              )}
            />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export function ReceiptPrinterStatus({ children, className, ...props }) {
  const { animate, shouldMove, stage } = useReceiptPrinter('ReceiptPrinter.Status');

  return (
    <div
      className={cn('flex min-w-0 items-center gap-2.5', className)}
      {...props}
    >
      <StatusIndicator animate={animate} move={shouldMove} stage={stage} />
      <div
        aria-live="polite"
        className="grid min-w-0 flex-1 items-center"
        role="status"
      >
        <AnimatePresence initial={false} mode="sync">
          <motion.div
            animate={{ opacity: 1, transform: 'translateY(0px)' }}
            className="col-start-1 row-start-1 truncate font-bold text-xs leading-none text-[#b3b3b3]"
            exit={{
              opacity: animate ? 0 : 1,
              transform: shouldMove ? 'translateY(-4px)' : 'translateY(0px)',
            }}
            initial={{
              opacity: animate ? 0 : 1,
              transform: shouldMove ? 'translateY(4px)' : 'translateY(0px)',
            }}
            key={stage}
            transition={{ duration: animate ? 0.18 : 0, ease: easeOut }}
          >
            {children ?? statusLabels[stage]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function ReceiptPrinterPaper({ children, className, style, ...props }) {
  return (
    <article
      className={cn(
        'relative z-10 min-h-[22rem] bg-[#f8f9fa] text-black px-6 pt-7 pb-10 font-mono shadow-2xl rounded-t-sm',
        className
      )}
      style={{ clipPath: receiptClipPath, ...style }}
      {...props}
    >
      {children}
    </article>
  );
}

export function ReceiptPrinterOutput({ children, className, ...props }) {
  const { animate, feedMotion, shouldMove, stage } = useReceiptPrinter(
    'ReceiptPrinter.Output'
  );
  const isReceiptVisible = stage !== 'processing';
  const shouldUseSteppedFeed =
    feedMotion === 'stepped' && stage === 'printing' && shouldMove;

  return (
    <div
      className={cn(
        'relative z-10 -mt-4 w-[92%] max-w-full overflow-hidden px-4 pt-1',
        className
      )}
      {...props}
    >
      {isReceiptVisible ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 z-30 h-3 bg-black/40 blur-[4px]"
        />
      ) : null}

      <motion.div
        animate={{
          opacity: isReceiptVisible ? 1 : 0,
          transform:
            stage === 'printing' && shouldMove
              ? shouldUseSteppedFeed
                ? printingTransformKeyframes
                : 'translateY(0%)'
              : isReceiptVisible || !shouldMove
              ? 'translateY(0%)'
              : 'translateY(calc(-100% + 2px))',
        }}
        aria-hidden={stage !== 'complete'}
        className="relative isolate shadow-2xl"
        initial={false}
        transition={{
          opacity: { duration: animate ? 0.16 : 0, ease: easeOut },
          transform: {
            duration: shouldMove ? 2.4 : 0,
            ease: shouldUseSteppedFeed ? 'linear' : easeInOut,
            times: shouldUseSteppedFeed ? printingKeyframeTimes : undefined,
          },
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

export const ReceiptPrinter = {
  Header: ReceiptPrinterHeader,
  Machine: ReceiptPrinterMachine,
  Output: ReceiptPrinterOutput,
  Paper: ReceiptPrinterPaper,
  Root: ReceiptPrinterRoot,
  Screen: ReceiptPrinterScreen,
  Status: ReceiptPrinterStatus,
};
