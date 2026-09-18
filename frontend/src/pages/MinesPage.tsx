import React, { useEffect, useState } from 'react';
import { useMineContext } from '../context/MineContext';
import { mineService } from '../services';
import { Mine, MineDetail } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { EmptyState, PageLoadingState } from '../components/ui/EmptyState';
import { PageHeader, SectionHeader } from '../components/ui/PageHeader';
import { MapPin, Layers, Activity, Video, AlertTriangle, ChevronRight } from 'lucide-react';

export const MinesPage: React.FC = () => {
  const { mines, setSelectedMineId, selectedMineId } = useMineContext();
  const [selectedMineDetail, setSelectedMineDetail] = useState<MineDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    if (selectedMineId) {
      setIsLoadingDetail(true);
      mineService
        .getMineDetail(selectedMineId)
        .then(setSelectedMineDetail)
        .catch(console.error)
        .finally(() => setIsLoadingDetail(false));
    }
  }, [selectedMineId]);

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Mines & Working Areas"
        subtitle="Overview of all monitored mines, levels, and working zones under your governance scope."
      />

      {/* Mine cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mines.map((mine) => {
          const isSelected = mine.id === selectedMineId;
          return (
            <button
              key={mine.id}
              onClick={() => setSelectedMineId(mine.id)}
              className="text-left p-5 rounded-xl transition-all cursor-pointer"
              style={{
                backgroundColor: isSelected ? 'var(--bg-raised)' : 'var(--bg-surface)',
                border: isSelected
                  ? `2px solid var(--brand-primary)`
                  : '1px solid var(--border-base)',
                boxShadow: isSelected ? '0 0 0 3px rgba(217,119,6,0.12)' : 'none',
              }}
              aria-pressed={isSelected}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span
                    className="tech-value text-xs px-2 py-0.5 rounded mb-2 inline-block"
                    style={{
                      backgroundColor: 'var(--bg-muted)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border-base)',
                    }}
                  >
                    {mine.code}
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mt-1">
                    {mine.name}
                  </h3>
                </div>
                <StatusBadge status={mine.status} size="sm" />
              </div>

              <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">
                {mine.description}
              </p>

              <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  {mine.district}, {mine.state}
                </span>
                <span className="font-medium text-[var(--text-secondary)]">{mine.mine_type}</span>
              </div>

              {isSelected && (
                <div className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: 'var(--brand-primary)' }}>
                  <span>View details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Mine detail */}
      {isLoadingDetail ? (
        <PageLoadingState message="Loading mine details…" />
      ) : selectedMineDetail ? (
        <section className="surface-card p-5 space-y-5" aria-label="Mine details">
          <div className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-base)', paddingBottom: '1rem' }}>
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                {selectedMineDetail.name} — Levels & Working Areas
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Underground structure and zone breakdown
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" aria-hidden="true" />
                {selectedMineDetail.total_sensors} sensors
              </span>
              <span className="flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" aria-hidden="true" />
                {selectedMineDetail.total_cameras} cameras
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedMineDetail.levels.map((lvl) => (
              <div
                key={lvl.id}
                className="rounded-lg p-4 space-y-3"
                style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border-base)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="tech-value text-xs text-[var(--text-muted)]">{lvl.code}</span>
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mt-0.5">
                      {lvl.name}
                    </h4>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">
                    Depth: <span className="font-medium text-[var(--text-secondary)]">{lvl.depth_meters}m</span>
                  </span>
                </div>

                {/* Working areas */}
                <div style={{ borderTop: '1px solid var(--border-base)', paddingTop: '0.75rem' }}>
                  <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                    Working Areas
                  </p>
                  {lvl.zones.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)]">No areas defined for this level.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {lvl.zones.map((z) => (
                        <div
                          key={z.id}
                          className="flex items-center justify-between px-3 py-2 rounded"
                          style={{ backgroundColor: 'var(--bg-muted)', border: '1px solid var(--border-base)' }}
                        >
                          <span className="text-sm text-[var(--text-primary)]">{z.name}</span>
                          <StatusBadge status={z.risk_category} size="sm" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
};
