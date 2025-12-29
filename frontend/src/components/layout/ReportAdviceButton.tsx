import React, { useState } from 'react';
import './Layout.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ReportAdviceButtonProps {
  messageId?: string;
  conflictId?: string;
}

const ReportAdviceButton: React.FC<ReportAdviceButtonProps> = ({ messageId, conflictId }) => {
  const [isReporting, setIsReporting] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReport = async () => {
    if (!messageId && !conflictId) {
      setError('Unable to report: missing identifier');
      return;
    }

    setIsReporting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/moderation/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          conflictId,
          timestamp: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit report');
      }

      setIsReported(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setIsReported(false);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setIsReporting(false);
    }
  };

  if (isReported) {
    return (
      <div className="report-confirmation" role="status" aria-live="polite">
        Thank you. This advice has been reported for review.
      </div>
    );
  }

  return (
    <div className="report-advice-container">
      <button
        className="report-advice-button"
        onClick={handleReport}
        disabled={isReporting}
        title="Report concerning or inappropriate advice"
        aria-label="Report concerning or inappropriate advice"
      >
        {isReporting ? 'Reporting...' : 'Report this advice'}
      </button>
      {error && <div className="report-error" role="alert">{error}</div>}
    </div>
  );
};

export default ReportAdviceButton;
