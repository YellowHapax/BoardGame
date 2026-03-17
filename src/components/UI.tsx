import { useState } from 'react';
import { useGameStore, Owner, COLOR_PAIRS, PALETTE_NAMES } from '../store';
import { clsx } from 'clsx';
import { RotateCcw, X, Palette } from 'lucide-react';

// Piece icons — pure shape, no text
const FlatIcon = ({ color }: { color: string }) => (
  <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="4" y="21" width="40" height="11" rx="2" fill={color} />
  </svg>
);

const WallIcon = ({ color }: { color: string }) => (
  <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="5" width="10" height="38" rx="2" fill={color} />
  </svg>
);

const CapIcon = ({ color }: { color: string }) => (
  <svg width="44" height="44" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 6 L43 42 H5 Z" fill={color} />
  </svg>
);

// Color swatch dot — team identity without words
function TeamDot({ color, size = 10 }: { color: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 6px ${color}55`,
        flexShrink: 0,
      }}
    />
  );
}

export function UI() {
  const turn = useGameStore(state => state.turn);
  const inventory = useGameStore(state => state.inventory);
  const phase = useGameStore(state => state.phase);
  const placeType = useGameStore(state => state.placeType);
  const selectInventory = useGameStore(state => state.selectInventory);
  const cancelAction = useGameStore(state => state.cancelAction);
  const winner = useGameStore(state => state.winner);
  const winReason = useGameStore(state => state.winReason);
  const resetGame = useGameStore(state => state.resetGame);

  const paletteIndex = useGameStore(state => state.paletteIndex);
  const setPalette = useGameStore(state => state.setPalette);

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  const teamColors = COLOR_PAIRS[paletteIndex];

  const renderInventory = (owner: Owner) => {
    const inv = inventory[owner];
    const color = teamColors[owner];
    const isActive = turn === owner && winner === null;

    return (
      <div
        className="flex flex-col gap-3 pointer-events-auto"
        style={{ opacity: isActive ? 1 : 0.45, transition: 'opacity 0.3s' }}
      >
        {/* Team color indicator — dot + remaining count, no text name */}
        <div className="flex items-center gap-2 px-1">
          <TeamDot color={color} size={12} />
          <span className="text-zinc-500 font-mono text-xs tabular-nums">
            {inv.stones} · {inv.caps}
          </span>
          {isActive && (
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse ml-auto"
              style={{ background: color }}
            />
          )}
        </div>

        <div className="flex gap-2">
          {/* Flat */}
          <button
            onClick={() => selectInventory(owner, 'flat')}
            disabled={inv.stones <= 0 || winner !== null || !isActive}
            className={clsx(
              'flex items-center justify-center w-16 h-16 rounded-xl transition-all border',
              phase === 'place' && placeType === 'flat' && turn === owner
                ? 'scale-110 shadow-lg'
                : 'hover:scale-105 disabled:opacity-30'
            )}
            style={{
              background: phase === 'place' && placeType === 'flat' && turn === owner
                ? `${color}20`
                : 'rgba(0,0,0,0.35)',
              borderColor: phase === 'place' && placeType === 'flat' && turn === owner
                ? color
                : 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <FlatIcon color={color} />
          </button>

          {/* Wall */}
          <button
            onClick={() => selectInventory(owner, 'wall')}
            disabled={inv.stones <= 0 || winner !== null || !isActive}
            className={clsx(
              'flex items-center justify-center w-16 h-16 rounded-xl transition-all border',
              phase === 'place' && placeType === 'wall' && turn === owner
                ? 'scale-110 shadow-lg'
                : 'hover:scale-105 disabled:opacity-30'
            )}
            style={{
              background: phase === 'place' && placeType === 'wall' && turn === owner
                ? `${color}20`
                : 'rgba(0,0,0,0.35)',
              borderColor: phase === 'place' && placeType === 'wall' && turn === owner
                ? color
                : 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <WallIcon color={color} />
          </button>

          {/* Cap */}
          <button
            onClick={() => selectInventory(owner, 'cap')}
            disabled={inv.caps <= 0 || winner !== null || !isActive}
            className={clsx(
              'flex items-center justify-center w-16 h-16 rounded-xl transition-all border',
              phase === 'place' && placeType === 'cap' && turn === owner
                ? 'scale-110 shadow-lg'
                : 'hover:scale-105 disabled:opacity-30'
            )}
            style={{
              background: phase === 'place' && placeType === 'cap' && turn === owner
                ? `${color}20`
                : 'rgba(0,0,0,0.35)',
              borderColor: phase === 'place' && placeType === 'cap' && turn === owner
                ? color
                : 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <CapIcon color={color} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-5">
      {/* Top row */}
      <div className="flex justify-between items-start">
        <button
          onClick={() => setIsPaletteOpen(true)}
          className="pointer-events-auto flex items-center gap-2 px-3 py-2 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <Palette size={15} />
          <span className="text-xs font-mono uppercase tracking-widest">Palette</span>
        </button>

        <div className="flex flex-col items-end gap-3 pointer-events-auto">
          <button
            onClick={resetGame}
            className="p-2.5 rounded-full text-zinc-500 hover:text-zinc-300 transition-colors"
            style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <RotateCcw size={16} />
          </button>
          {(phase === 'place' || phase === 'move' || phase === 'pickup') && (
            <button
              onClick={cancelAction}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-red-400/70 hover:text-red-300 transition-colors text-xs font-mono uppercase tracking-widest"
              style={{ background: 'rgba(80,0,0,0.3)', backdropFilter: 'blur(8px)', border: '1px solid rgba(200,50,50,0.2)' }}
            >
              <X size={12} />
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Win screen */}
      {winner !== null && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-auto z-50">
          <div className="flex flex-col items-center gap-5 p-10 rounded-2xl"
            style={{ background: 'rgba(8,5,3,0.92)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>
            {winner !== 'tie' ? (
              <div className="flex items-center gap-3">
                <TeamDot color={teamColors[winner]} size={18} />
                <span className="text-white font-mono text-2xl uppercase tracking-widest">wins</span>
              </div>
            ) : (
              <span className="text-zinc-400 font-mono text-2xl uppercase tracking-widest">tie</span>
            )}
            <p className="text-zinc-600 font-mono text-xs">{winReason}</p>
            <button
              onClick={resetGame}
              className="mt-2 px-8 py-2.5 rounded-full text-black font-mono text-sm uppercase tracking-widest transition-colors hover:opacity-90"
              style={{ background: '#c8a87a' }}
            >
              Play Again
            </button>
          </div>
        </div>
      )}

      {/* Bottom — both inventories side by side */}
      <div className="flex justify-between items-end">
        {renderInventory(0)}
        {renderInventory(1)}
      </div>

      {/* Palette modal */}
      {isPaletteOpen && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto z-50"
          style={{ background: 'rgba(4,3,2,0.85)', backdropFilter: 'blur(16px)' }}>
          <div className="p-7 rounded-2xl max-w-2xl w-full mx-4"
            style={{ background: 'rgba(15,10,6,0.97)', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 0 80px rgba(0,0,0,0.9)' }}>
            <div className="flex justify-between items-center mb-6">
              <span className="text-zinc-300 font-mono text-sm uppercase tracking-widest">Select Palette</span>
              <button onClick={() => setIsPaletteOpen(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {COLOR_PAIRS.map((pair, idx) => (
                <button
                  key={idx}
                  onClick={() => { setPalette(idx); setIsPaletteOpen(false); }}
                  className={clsx(
                    'flex flex-col rounded-xl overflow-hidden transition-all hover:scale-105',
                    paletteIndex === idx ? 'ring-2 ring-white/40 scale-105' : 'opacity-60 hover:opacity-100'
                  )}
                >
                  <div className="flex w-full h-12">
                    <div className="flex-1" style={{ backgroundColor: pair[0] }} />
                    <div className="flex-1" style={{ backgroundColor: pair[1] }} />
                  </div>
                  <div className="py-1.5 px-2 text-center"
                    style={{ background: 'rgba(20,14,8,0.95)' }}>
                    <span className="text-zinc-500 font-mono text-xs">{PALETTE_NAMES[idx]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
