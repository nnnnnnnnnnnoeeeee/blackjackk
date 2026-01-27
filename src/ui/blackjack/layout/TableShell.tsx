// ============================================================================
// Layout - Table Shell (Main Layout Container)
// ============================================================================

import { memo, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMobileLayout } from '../hooks';

interface TableShellProps {
  header?: ReactNode;
  dealerZone?: ReactNode;
  centerZone?: ReactNode;
  playerZone?: ReactNode;
  bottomDock?: ReactNode;
  sidePanel?: ReactNode; // Desktop only
  className?: string;
}

export const TableShell = memo(function TableShell({
  header,
  dealerZone,
  centerZone,
  playerZone,
  bottomDock,
  sidePanel,
  className,
}: TableShellProps) {
  const { isMobile, dockHeight, safeAreaBottom } = useMobileLayout();

  return (
    <div
      className={cn(
        'table-felt table-border h-screen flex flex-col overflow-hidden',
        className
      )}
      style={{
        paddingBottom: isMobile ? `${safeAreaBottom}px` : undefined,
      }}
    >
      {/* Header - Compact during gameplay */}
      {header && (
        <header className="flex-shrink-0 p-1 sm:p-1.5 md:p-2 relative z-[50] max-w-2xl mx-auto w-full" style={{ pointerEvents: 'auto' }}>
          {header}
        </header>
      )}

      {/* Main Content Area - More space for cards */}
      <main className="flex-1 flex flex-col justify-between p-1 sm:p-1.5 md:p-2 min-h-0 overflow-hidden relative">
        <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col justify-between gap-2 sm:gap-3 md:gap-4 table-felt table-border rounded-lg sm:rounded-xl p-2 sm:p-3 md:p-4 min-h-0">
          {/* Dealer Zone */}
          {dealerZone && (
            <div className="flex-shrink-0 flex justify-center py-1 sm:py-2">
              {dealerZone}
            </div>
          )}

          {/* Center Zone */}
          {centerZone && (
            <div className="flex-shrink-0 flex justify-center items-center py-1 sm:py-2 md:py-3">
              {centerZone}
            </div>
          )}

          {/* Player Zone */}
          {playerZone && (
            <div
              className="flex-shrink-0 flex justify-center gap-1.5 sm:gap-2 md:gap-3 flex-wrap px-1"
              style={{
                paddingBottom: isMobile ? `${dockHeight + 8}px` : undefined,
              }}
            >
              {playerZone}
            </div>
          )}
        </div>

        {/* Side Panel (Desktop only) */}
        {!isMobile && sidePanel && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[40]">
            {sidePanel}
          </div>
        )}
      </main>

      {/* Bottom Dock */}
      {bottomDock && (
        <footer
          className="flex-shrink-0 p-1 sm:p-2 md:p-3 lg:p-4 border-t-2 border-primary/30 bg-gradient-to-t from-black/40 via-black/20 to-transparent backdrop-blur-sm relative z-[40]"
          data-dock="bottom"
          style={{
            paddingBottom: isMobile ? `calc(1rem + ${safeAreaBottom}px)` : undefined,
          }}
        >
          <div className="max-w-2xl mx-auto w-full">{bottomDock}</div>
        </footer>
      )}
    </div>
  );
});

export default TableShell;
