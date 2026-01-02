import React, { useState } from 'react';
import { DebugPromptInfo } from '../../hooks/useChatSession';
import './AdminDebugPanel.css';

interface AdminDebugPanelProps {
  prompt: DebugPromptInfo | null;
  onRefresh?: () => void;
  isLoading?: boolean;
}

/**
 * AdminDebugPanel - Collapsible panel showing prompt debug info
 *
 * This component shows admins:
 * - System prompt (expandable)
 * - Recent user message
 * - AI response preview
 * - Model used, token count
 * - Cost information
 */
export const AdminDebugPanel: React.FC<AdminDebugPanelProps> = ({
  prompt,
  onRefresh,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatCost = (cost: number): string => {
    return cost < 0.01 ? `$${cost.toFixed(6)}` : `$${cost.toFixed(4)}`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className={`admin-debug-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Toggle button */}
      <button
        className="debug-toggle-button"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Collapse debug panel' : 'Expand debug panel'}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="debug-icon"
        >
          <path d="M12 2a3 3 0 00-3 3v1a3 3 0 006 0V5a3 3 0 00-3-3zM19 9h-1a3 3 0 000 6h1a3 3 0 000-6zM5 9H4a3 3 0 000 6h1a3 3 0 000-6zM12 18a3 3 0 00-3 3v1h6v-1a3 3 0 00-3-3zM7.5 4.2A9 9 0 003 12a9 9 0 004.5 7.8M16.5 4.2A9 9 0 0121 12a9 9 0 01-4.5 7.8" />
        </svg>
        <span className="debug-label">Debug</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`chevron-icon ${isExpanded ? 'rotated' : ''}`}
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Panel content */}
      {isExpanded && (
        <div className="debug-content">
          <div className="debug-header">
            <h3>Prompt Debug</h3>
            <button
              className="debug-refresh-button"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh debug info"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={isLoading ? 'spinning' : ''}
              >
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {!prompt ? (
            <div className="debug-empty">
              <p>No prompt data available</p>
              <p className="debug-hint">Send a message to see debug info</p>
            </div>
          ) : (
            <div className="debug-sections">
              {/* Stats row */}
              <div className="debug-stats">
                <div className="stat">
                  <span className="stat-label">Model</span>
                  <span className="stat-value">{prompt.model}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Input</span>
                  <span className="stat-value">{prompt.inputTokens.toLocaleString()} tokens</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Output</span>
                  <span className="stat-value">{prompt.outputTokens.toLocaleString()} tokens</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Cost</span>
                  <span className="stat-value">{formatCost(prompt.cost)}</span>
                </div>
              </div>

              {/* Metadata */}
              <div className="debug-meta">
                <span className="meta-item">Type: {prompt.logType}</span>
                {prompt.guidanceMode && (
                  <span className="meta-item">Mode: {prompt.guidanceMode}</span>
                )}
                <span className="meta-item">Time: {formatTimestamp(prompt.timestamp)}</span>
              </div>

              {/* System Prompt section */}
              <div className="debug-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection('systemPrompt')}
                >
                  <span>System Prompt</span>
                  <span className="section-size">
                    {prompt.systemPrompt.length.toLocaleString()} chars
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`section-chevron ${expandedSections.systemPrompt ? 'rotated' : ''}`}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.systemPrompt && (
                  <pre className="section-content">{prompt.systemPrompt}</pre>
                )}
              </div>

              {/* User Message section */}
              <div className="debug-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection('userMessage')}
                >
                  <span>User Message</span>
                  <span className="section-size">
                    {prompt.userMessage.length.toLocaleString()} chars
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`section-chevron ${expandedSections.userMessage ? 'rotated' : ''}`}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.userMessage && (
                  <pre className="section-content">{prompt.userMessage}</pre>
                )}
              </div>

              {/* AI Response section */}
              <div className="debug-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection('aiResponse')}
                >
                  <span>AI Response</span>
                  <span className="section-size">
                    {prompt.aiResponse.length.toLocaleString()} chars
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`section-chevron ${expandedSections.aiResponse ? 'rotated' : ''}`}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.aiResponse && (
                  <pre className="section-content">{prompt.aiResponse}</pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDebugPanel;
