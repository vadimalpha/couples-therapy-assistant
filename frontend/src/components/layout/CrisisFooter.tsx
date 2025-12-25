import React from 'react';
import { Link } from 'react-router-dom';
import './Layout.css';

const CrisisFooter: React.FC = () => {
  return (
    <footer className="crisis-footer">
      <div className="crisis-footer-content">
        <div className="emergency-resources">
          <h3>Emergency Resources</h3>
          <p className="crisis-warning">If you or someone you know is in immediate danger, please call 911</p>
          <div className="crisis-hotlines">
            <div className="hotline-item">
              <strong>National Suicide Prevention Lifeline:</strong>
              <a href="tel:988" className="hotline-link">988</a>
              <span className="hotline-availability">(24/7, US)</span>
            </div>
            <div className="hotline-item">
              <strong>National Domestic Violence Hotline:</strong>
              <a href="tel:1-800-799-7233" className="hotline-link">1-800-799-7233</a>
              <span className="hotline-availability">(24/7, US)</span>
            </div>
            <div className="hotline-item">
              <strong>Crisis Text Line:</strong>
              <a href="sms:741741?&body=HOME" className="hotline-link">Text HOME to 741741</a>
              <span className="hotline-availability">(24/7, US)</span>
            </div>
          </div>
        </div>

        <div className="footer-disclaimer">
          <p className="disclaimer-text">
            <strong>Important:</strong> This service is not a substitute for professional therapy or emergency services.
            Our AI assistant provides general guidance only and should not be used for crisis situations or as a replacement
            for qualified mental health care.
          </p>
        </div>

        <div className="footer-links">
          <Link to="/terms" className="footer-link">Terms of Service</Link>
          <span className="footer-separator">•</span>
          <Link to="/privacy" className="footer-link">Privacy Policy</Link>
        </div>

        <div className="footer-copyright">
          <p>&copy; {new Date().getFullYear()} Couples Therapy Assistant. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default CrisisFooter;
