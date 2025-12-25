import React, { useState, useEffect } from 'react';

interface StreamingMessageProps {
  streamingContent: string;
  isComplete: boolean;
}

export const StreamingMessage: React.FC<StreamingMessageProps> = ({
  streamingContent,
  isComplete
}) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [showCursor, setShowCursor] = useState(true);

  // Animate typing effect - display content as it comes in
  useEffect(() => {
    if (streamingContent !== displayedContent) {
      // For streaming, display immediately without char-by-char animation
      // This allows real-time streaming to feel responsive
      setDisplayedContent(streamingContent);
    }
  }, [streamingContent, displayedContent]);

  // Cursor blink effect while streaming
  useEffect(() => {
    if (isComplete) {
      setShowCursor(false);
      return;
    }

    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530); // Standard cursor blink rate

    return () => clearInterval(interval);
  }, [isComplete]);

  return (
    <div className="streaming-message">
      <div className="message-content">
        {displayedContent}
        {!isComplete && (
          <span className={`cursor ${showCursor ? 'visible' : 'hidden'}`}>
            |
          </span>
        )}
      </div>
    </div>
  );
};

export default StreamingMessage;
