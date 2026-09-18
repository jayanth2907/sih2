import React from 'react';
import { useMineContext } from '../context/MineContext';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, MapPin } from 'lucide-react';

export const MineSelector: React.FC = () => {
  const { mines, selectedMine, selectedMineId, setSelectedMineId, isLoading } = useMineContext();
  const { user, hasRole } = useAuth();

  const canSwitchMines =
    hasRole(['SYSTEM_ADMIN', 'REGULATOR']) ||
    (user?.assigned_mine_ids && user.assigned_mine_ids.length > 1);

  if (isLoading) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
        style={{
          backgroundColor: 'var(--bg-raised)',
          border: '1px solid var(--border-base)',
          color: 'var(--text-muted)',
        }}
        aria-busy="true"
        aria-label="Loading mines"
      >
        <span
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: 'var(--brand-primary)' }}
          aria-hidden="true"
        />
        Loading mines…
      </div>
    );
  }

  if (!selectedMine) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
        style={{
          backgroundColor: 'var(--bg-raised)',
          border: '1px solid var(--border-base)',
          color: 'var(--text-muted)',
        }}
      >
        No mine assigned
      </div>
    );
  }

  if (!canSwitchMines) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded"
        style={{
          backgroundColor: 'var(--bg-raised)',
          border: '1px solid var(--border-base)',
        }}
        aria-label={`Current mine: ${selectedMine.name}`}
      >
        <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary)]" aria-hidden="true" />
        <span className="text-sm font-medium text-[var(--text-primary)]">
          {selectedMine.name}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded tech-value"
          style={{
            backgroundColor: 'var(--bg-muted)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border-base)',
          }}
        >
          {selectedMine.code}
        </span>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center gap-2 px-3 py-1.5 rounded transition-colors"
      style={{
        backgroundColor: 'var(--bg-raised)',
        border: '1px solid var(--border-muted)',
      }}
    >
      <MapPin className="w-3.5 h-3.5 text-[var(--brand-primary)] flex-shrink-0" aria-hidden="true" />
      <select
        value={selectedMineId || ''}
        onChange={(e) => setSelectedMineId(Number(e.target.value))}
        aria-label="Select mine"
        className="text-sm font-medium text-[var(--text-primary)] bg-transparent focus:outline-none cursor-pointer appearance-none pr-4"
      >
        {mines.map((mine) => (
          <option
            key={mine.id}
            value={mine.id}
            style={{ backgroundColor: 'var(--bg-raised)', color: 'var(--text-primary)' }}
          >
            {mine.name}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] -ml-3 pointer-events-none" aria-hidden="true" />
    </div>
  );
};
