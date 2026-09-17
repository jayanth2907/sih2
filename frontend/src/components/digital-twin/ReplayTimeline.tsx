import React, { useEffect } from 'react';
import { ReplayState, ReplayKeyframe } from './types';
import { Play, Pause, RotateCcw, FastForward, Clock, AlertTriangle, ShieldCheck, Flame, ChevronRight } from 'lucide-react';

interface ReplayTimelineProps {
  replayState: ReplayState;
  keyframes: ReplayKeyframe[];
  onTogglePlay: () => void;
  onSeekSecond: (sec: number) => void;
  onSeekKeyframe: (index: number) => void;
  onChangeSpeed: (speed: number) => void;
  onReset: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
}

export const ReplayTimeline: React.FC<ReplayTimelineProps> = ({
  replayState,
  keyframes,
  onTogglePlay,
  onSeekSecond,
  onSeekKeyframe,
  onChangeSpeed,
  onReset,
  isOpen,
  onToggleOpen
}) => {
  const { isPlaying, currentSecond, totalSeconds, playbackSpeed, activeKeyframeIndex } = replayState;
  const activeKeyframe = keyframes[activeKeyframeIndex] || keyframes[0];

  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (currentSecond >= totalSeconds) {
        onTogglePlay(); // stop at end
      } else {
        onSeekSecond(Math.min(currentSecond + 1, totalSeconds));
      }
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, currentSecond, totalSeconds, playbackSpeed, onSeekSecond, onTogglePlay]);

  // Update active keyframe when currentSecond changes
  useEffect(() => {
    let closestIndex = 0;
    for (let i = 0; i < keyframes.length; i++) {
      if (currentSecond >= keyframes[i].timeOffsetSeconds) {
        closestIndex = i;
      }
    }
    if (closestIndex !== activeKeyframeIndex) {
      onSeekKeyframe(closestIndex);
    }
  }, [currentSecond, keyframes]);

  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 backdrop-blur-md shadow-2xl font-mono text-xs text-amber-300 transition-all cursor-pointer"
      >
        <Clock className="w-4 h-4 text-amber-400 animate-spin" />
        <span className="font-bold">OPEN TIME REPLAY CONTROLLER</span>
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-12 md:right-12 z-20 p-3.5 rounded-2xl bg-slate-950/95 border border-slate-800 backdrop-blur-xl shadow-2xl font-mono text-xs text-slate-300 animate-in fade-in slide-in-from-bottom-4 duration-200 space-y-3 select-none">
      {/* Top Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-amber-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>EVENT TIMELINE REPLAY</span>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-700 text-slate-300">
            Stage: {activeKeyframe?.stage || 'NORMAL'}
          </span>
          <span className="hidden sm:inline text-[11px] text-slate-400">
            {activeKeyframe?.description}
          </span>
        </div>

        {/* Speed and Close */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5">
            {[1, 2, 5].map((s) => (
              <button
                key={s}
                onClick={() => onChangeSpeed(s)}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                  playbackSpeed === s ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
          <button
            onClick={onToggleOpen}
            className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] cursor-pointer"
          >
            HIDE
          </button>
        </div>
      </div>

      {/* Progress Scrubber and Keyframe Milestone Nodes */}
      <div className="space-y-1.5">
        <div className="relative w-full h-7 flex items-center">
          {/* Base Track */}
          <input
            type="range"
            min={0}
            max={totalSeconds}
            value={currentSecond}
            onChange={(e) => onSeekSecond(Number(e.target.value))}
            className="w-full h-2 rounded-lg bg-slate-800 accent-amber-500 cursor-pointer appearance-none z-10"
          />

          {/* Milestone Node Points */}
          <div className="absolute inset-0 flex items-center justify-between pointer-events-none px-2">
            {keyframes.map((kf, idx) => {
              const leftPercent = (kf.timeOffsetSeconds / totalSeconds) * 100;
              const isPassed = currentSecond >= kf.timeOffsetSeconds;
              return (
                <div
                  key={idx}
                  style={{ left: `${leftPercent}%` }}
                  className="absolute -translate-x-1/2 flex flex-col items-center"
                >
                  <div
                    className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                      isPassed
                        ? kf.stage === 'CRITICAL' || kf.stage === 'INCIDENT_CREATED'
                          ? 'bg-rose-500 border-rose-300 ring-2 ring-rose-500/40'
                          : kf.stage === 'WARNING'
                          ? 'bg-amber-500 border-amber-300'
                          : 'bg-emerald-500 border-emerald-300'
                        : 'bg-slate-900 border-slate-700'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestone Buttons Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5 text-[10px]">
          {keyframes.map((kf, idx) => {
            const isActive = activeKeyframeIndex === idx;
            return (
              <button
                key={idx}
                onClick={() => onSeekKeyframe(idx)}
                className={`p-1.5 rounded-lg border text-left transition-all cursor-pointer truncate ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 font-bold shadow'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span className="text-slate-500">{kf.timestamp}</span>
                </div>
                <div className="truncate font-semibold mt-0.5">{kf.label}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Play Controls Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl font-bold transition-all cursor-pointer shadow-lg ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY REPLAY'}</span>
          </button>
          <button
            onClick={onReset}
            title="Reset to 00:00"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Live Replay Metric State */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase">Replay CH4:</span>
            <span className={`font-bold ${
              (activeKeyframe.sensorValues['SN-BDS04-CH4-101'] || 0.42) > 1.25 ? 'text-rose-400' :
              (activeKeyframe.sensorValues['SN-BDS04-CH4-101'] || 0.42) > 0.75 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {(activeKeyframe.sensorValues['SN-BDS04-CH4-101'] || 0.42).toFixed(2)} %
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[10px] uppercase">Calculated Risk:</span>
            <span className="font-bold text-amber-400">
              {activeKeyframe.riskScore.toFixed(1)} / 100
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
