import React, { useState } from 'react';
import './Patterns.css';

export interface Pattern {
  theme: string;
  occurrences: number;
  lastOccurrence: string;
  relatedConflicts: string[];
}

export interface PatternInsightsProps {
  patterns: Pattern[];
  relationshipId?: string;
}

const PatternInsights: React.FC<PatternInsightsProps> = ({ patterns }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter to only show patterns with 3+ occurrences
  const significantPatterns = patterns.filter(p => p.occurrences >= 3);

  // Don't render if no significant patterns
  if (significantPatterns.length === 0) {
    return null;
  }

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return date.toLocaleDateString();
  };

  const getThemeIcon = (theme: string): string => {
    const themeIcons: { [key: string]: string } = {
      communication: '💬',
      trust: '🤝',
      time: '⏰',
      intimacy: '❤️',
      finances: '💰',
      family: '👨‍👩‍👧',
      chores: '🏠',
      work: '💼',
      boundaries: '🚧',
      expectations: '🎯',
      respect: '🙏',
      listening: '👂',
      'quality time': '⏱️',
      affection: '💝',
      appreciation: '🌟',
    };
    return themeIcons[theme.toLowerCase()] || '⚠️';
  };

  return (
    <div className="pattern-insights" role="region" aria-label="Recurring relationship patterns">
      <button
        className="pattern-insights-header"
        onClick={handleToggle}
        aria-expanded={isExpanded}
        aria-controls="pattern-insights-content"
      >
        <div className="pattern-insights-title">
          <span className="pattern-icon" role="img" aria-label="Pattern indicator">
            🔄
          </span>
          <h3>Recurring Themes</h3>
        </div>
        <span className={`expand-arrow ${isExpanded ? 'expanded' : ''}`} aria-hidden="true">
          ▼
        </span>
      </button>

      {isExpanded && (
        <div id="pattern-insights-content" className="pattern-insights-content">
          <p className="pattern-insights-intro">
            We've noticed some patterns in your conversations that might be worth exploring together:
          </p>

          <ul className="pattern-list">
            {significantPatterns.map((pattern, index) => (
              <li key={index} className="pattern-item">
                <div className="pattern-item-header">
                  <span className="pattern-theme-icon" role="img" aria-label={pattern.theme}>
                    {getThemeIcon(pattern.theme)}
                  </span>
                  <span className="pattern-theme">{pattern.theme}</span>
                  <span className="pattern-count" aria-label={`Observed ${pattern.occurrences} times`}>
                    {pattern.occurrences}x
                  </span>
                </div>
                <p className="pattern-details">
                  Last mentioned {formatDate(pattern.lastOccurrence)}
                </p>
                {pattern.occurrences >= 5 && (
                  <p className="pattern-suggestion">
                    This theme comes up frequently. Consider scheduling a dedicated conversation to explore it together.
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="pattern-insights-footer">
            <p className="pattern-insights-note">
              These patterns are identified from your previous conversations. They're not judgments —
              they're invitations to understand what matters most in your relationship.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternInsights;
