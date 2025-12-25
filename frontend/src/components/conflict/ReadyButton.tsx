import React, { useState } from 'react';
import './Conflict.css';

export interface ReadyButtonProps {
  onReady: () => Promise<void>;
  disabled?: boolean;
}

const ReadyButton: React.FC<ReadyButtonProps> = ({ onReady, disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (disabled) return;
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await onReady();
      setShowConfirmation(false);
    } catch (err) {
      console.error('Failed to finalize conversation:', err);
      setError(err instanceof Error ? err.message : 'Failed to finalize conversation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setError(null);
  };

  return (
    <div className="ready-button-container">
      {!showConfirmation ? (
        <button
          onClick={handleClick}
          disabled={disabled || isLoading}
          className="ready-button"
          aria-label="Mark conversation as ready"
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="ready-button-icon"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          I'm Ready
        </button>
      ) : (
        <div className="ready-confirmation">
          <p className="ready-confirmation-text">
            Are you ready to finalize this exploration? You won't be able to add more messages
            after this.
          </p>

          {error && (
            <div className="ready-error" role="alert">
              {error}
            </div>
          )}

          <div className="ready-confirmation-buttons">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="ready-cancel-button"
              aria-label="Cancel finalization"
            >
              Not Yet
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="ready-confirm-button"
              aria-label="Confirm finalization"
            >
              {isLoading ? (
                <>
                  <span className="button-spinner"></span>
                  Finalizing...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                  Yes, I'm Ready
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReadyButton;
