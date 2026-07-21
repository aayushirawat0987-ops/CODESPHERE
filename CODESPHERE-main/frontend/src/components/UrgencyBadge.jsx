import React from 'react';

export default function UrgencyBadge({ score, isOverridden, compact = false }) {
  let level = 'low';
  let label = 'Low Urgency';
  let colorClass = 'badge-green';

  if (score >= 8) {
    level = 'high';
    label = 'High / Critical';
    colorClass = 'badge-red';
  } else if (score >= 4) {
    level = 'moderate';
    label = 'Moderate Urgency';
    colorClass = 'badge-yellow';
  }

  return (
    <div className={`urgency-badge-container ${colorClass} ${compact ? 'compact' : ''}`}>
      <div className="score-circle">
        <span className="score-num">{score}</span>
        <span className="score-denom">/10</span>
      </div>
      <div className="badge-text-group">
        <span className="urgency-label">{label}</span>
        {isOverridden && (
          <span className="override-tag" title="Staff manually assigned this urgency score">
            ⚡ STAFF OVERRIDE
          </span>
        )}
      </div>
    </div>
  );
}
