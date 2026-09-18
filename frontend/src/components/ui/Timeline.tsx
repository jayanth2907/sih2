import React from 'react';
import clsx from 'clsx';

interface TimelineItem {
  id: string | number;
  time: string;
  title: string;
  detail?: string;
  actor?: string;
  active?: boolean;
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className }) => {
  return (
    <ol className={clsx('timeline', className)} aria-label="Activity timeline">
      {items.map((item) => (
        <li key={item.id} className="timeline-item">
          <div className={clsx('timeline-dot', item.active && 'timeline-dot-active')} aria-hidden="true" />
          <time className="timeline-time" dateTime={item.time}>
            {item.time}
          </time>
          <p className="timeline-content">{item.title}</p>
          {item.detail && (
            <p className="timeline-meta">{item.detail}</p>
          )}
          {item.actor && (
            <p className="timeline-meta">By {item.actor}</p>
          )}
        </li>
      ))}
    </ol>
  );
};
