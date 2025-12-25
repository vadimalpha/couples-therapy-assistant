import React from 'react';
import { Link } from 'react-router-dom';
import '../components/layout/Layout.css';

const PrivacyPage: React.FC = () => {
  return (
    <main id="main-content" className="legal-page">
      <Link to="/" className="back-link" aria-label="Back to home page">← Back to Home</Link>

      <h1>Privacy Policy</h1>
      <p className="last-updated">Last Updated: December 25, 2024</p>

      <div className="highlight-box">
        <p>
          <strong>Your Privacy Matters:</strong> We are committed to protecting your privacy and handling your personal
          information responsibly. This policy explains what data we collect, how we use it, and your rights regarding
          your information.
        </p>
      </div>

      <h2>1. Information We Collect</h2>

      <h3>1.1 Account Information</h3>
      <p>When you create an account, we collect:</p>
      <ul>
        <li>Email address</li>
        <li>Password (encrypted)</li>
        <li>Name or display name (if provided)</li>
        <li>Account creation date</li>
      </ul>

      <h3>1.2 Relationship Data</h3>
      <p>To provide our services, we collect:</p>
      <ul>
        <li>Conversation content between you and your partner</li>
        <li>Responses to intake questionnaires</li>
        <li>Conflict descriptions and exploration sessions</li>
        <li>Pattern recognition data</li>
        <li>Session history and timestamps</li>
      </ul>

      <h3>1.3 Usage Information</h3>
      <p>We automatically collect:</p>
      <ul>
        <li>Device type and browser information</li>
        <li>IP address and approximate location</li>
        <li>Pages visited and features used</li>
        <li>Session duration and frequency</li>
        <li>Error logs and performance data</li>
      </ul>

      <h3>1.4 AI Interaction Data</h3>
      <p>We collect data about your interactions with our AI:</p>
      <ul>
        <li>Messages sent to and received from the AI</li>
        <li>User feedback on AI responses</li>
        <li>Reports of concerning advice</li>
        <li>Pattern analysis results</li>
      </ul>

      <h2>2. How We Use Your Information</h2>

      <h3>2.1 Service Delivery</h3>
      <p>We use your data to:</p>
      <ul>
        <li>Provide AI-powered relationship guidance</li>
        <li>Facilitate conversations between partners</li>
        <li>Identify patterns in your relationship dynamics</li>
        <li>Personalize your experience</li>
        <li>Maintain session continuity</li>
      </ul>

      <h3>2.2 Service Improvement</h3>
      <p>We analyze aggregated and anonymized data to:</p>
      <ul>
        <li>Improve AI model accuracy and safety</li>
        <li>Develop new features</li>
        <li>Identify and fix bugs</li>
        <li>Understand usage patterns</li>
        <li>Enhance user experience</li>
      </ul>

      <h3>2.3 Safety and Moderation</h3>
      <p>We use data to:</p>
      <ul>
        <li>Detect and prevent abuse</li>
        <li>Review reported content</li>
        <li>Improve AI safety mechanisms</li>
        <li>Comply with legal obligations</li>
      </ul>

      <h3>2.4 Communications</h3>
      <p>We may use your email to send:</p>
      <ul>
        <li>Service-related notifications</li>
        <li>Security alerts</li>
        <li>Updates to terms or privacy policy</li>
        <li>Optional feature announcements (with opt-out option)</li>
      </ul>

      <h2>3. Data Sharing and Disclosure</h2>

      <h3>3.1 Partner Access</h3>
      <div className="warning-box">
        <p>
          <strong>Important:</strong> When you use our couple's features, your partner will be able to see conversations
          and content you share within shared sessions. This is essential for the service to function. Individual
          intake responses remain private unless explicitly shared.
        </p>
      </div>

      <h3>3.2 Service Providers</h3>
      <p>We share data with trusted third-party providers who help us operate:</p>
      <ul>
        <li>Cloud hosting services (data storage)</li>
        <li>Authentication services (Firebase)</li>
        <li>AI/ML service providers</li>
        <li>Analytics services (anonymized data only)</li>
      </ul>
      <p>All providers are contractually bound to protect your data and use it only for specified purposes.</p>

      <h3>3.3 Legal Requirements</h3>
      <p>We may disclose information if required by law or if we believe it's necessary to:</p>
      <ul>
        <li>Comply with legal processes (subpoenas, court orders)</li>
        <li>Protect safety of individuals</li>
        <li>Prevent fraud or abuse</li>
        <li>Protect our legal rights</li>
      </ul>

      <h3>3.4 Business Transfers</h3>
      <p>
        If we undergo a merger, acquisition, or sale of assets, your data may be transferred to the new entity.
        We will notify you of any such change and your options.
      </p>

      <h3>3.5 What We Don't Do</h3>
      <p>We will NEVER:</p>
      <ul>
        <li>Sell your personal data to third parties</li>
        <li>Share your relationship conversations for marketing</li>
        <li>Use your data for purposes unrelated to the Service</li>
        <li>Share identifiable data publicly</li>
      </ul>

      <h2>4. Data Security</h2>

      <h3>4.1 Security Measures</h3>
      <p>We implement industry-standard security measures:</p>
      <ul>
        <li>Encryption in transit (HTTPS/TLS)</li>
        <li>Encryption at rest for sensitive data</li>
        <li>Secure authentication (Firebase Auth)</li>
        <li>Regular security audits</li>
        <li>Access controls and monitoring</li>
        <li>Secure backup procedures</li>
      </ul>

      <h3>4.2 Limitations</h3>
      <div className="warning-box">
        <p>
          <strong>No system is 100% secure.</strong> While we take reasonable precautions, we cannot guarantee absolute
          security. You share information at your own risk. Please use strong passwords and protect your account credentials.
        </p>
      </div>

      <h2>5. Your Rights and Choices</h2>

      <h3>5.1 Access and Correction</h3>
      <p>You have the right to:</p>
      <ul>
        <li>Access your personal data</li>
        <li>Correct inaccurate information</li>
        <li>Update your profile and preferences</li>
        <li>Download your data (export feature)</li>
      </ul>

      <h3>5.2 Data Deletion</h3>
      <p>You can request deletion of:</p>
      <ul>
        <li>Specific conversations or sessions</li>
        <li>Your entire account and associated data</li>
      </ul>
      <p>
        Note: Some data may be retained for legal compliance, dispute resolution, or legitimate business purposes
        (anonymized for analytics). Deleted data is removed within 30 days.
      </p>

      <h3>5.3 Opt-Out Options</h3>
      <p>You can opt out of:</p>
      <ul>
        <li>Non-essential email communications</li>
        <li>Analytics tracking (may limit functionality)</li>
        <li>Certain data collection features</li>
      </ul>

      <h3>5.4 GDPR Rights (EU Users)</h3>
      <p>If you're in the European Union, you have additional rights:</p>
      <ul>
        <li>Right to data portability</li>
        <li>Right to restriction of processing</li>
        <li>Right to object to processing</li>
        <li>Right to lodge a complaint with supervisory authority</li>
        <li>Right to withdraw consent</li>
      </ul>

      <h3>5.5 CCPA Rights (California Users)</h3>
      <p>If you're a California resident, you have the right to:</p>
      <ul>
        <li>Know what personal information is collected</li>
        <li>Know if personal information is sold or disclosed</li>
        <li>Opt-out of sale of personal information (we don't sell data)</li>
        <li>Request deletion of personal information</li>
        <li>Non-discrimination for exercising privacy rights</li>
      </ul>

      <h2>6. Data Retention</h2>
      <p>We retain your data for different periods based on type:</p>
      <ul>
        <li><strong>Account data:</strong> Until account deletion or 2 years of inactivity</li>
        <li><strong>Conversation data:</strong> Until deletion request or account closure</li>
        <li><strong>Usage logs:</strong> 90 days for operational purposes</li>
        <li><strong>Anonymized analytics:</strong> Indefinitely for research and improvement</li>
        <li><strong>Legal compliance data:</strong> As required by law (typically 7 years)</li>
      </ul>

      <h2>7. Children's Privacy</h2>
      <div className="warning-box">
        <p>
          <strong>Age Restriction:</strong> Our Service is not intended for users under 18 years of age.
          We do not knowingly collect data from children. If we discover we've collected data from a minor,
          we will delete it immediately. Parents who believe their child has provided data should contact us.
        </p>
      </div>

      <h2>8. International Data Transfers</h2>
      <p>
        Your data may be processed in countries outside your residence. We ensure appropriate safeguards are in place,
        including:
      </p>
      <ul>
        <li>Standard contractual clauses</li>
        <li>EU-U.S. Privacy Shield compliance (where applicable)</li>
        <li>Adequate protection mechanisms</li>
      </ul>

      <h2>9. Cookies and Tracking</h2>
      <p>We use cookies and similar technologies for:</p>
      <ul>
        <li>Authentication and session management</li>
        <li>Security and fraud prevention</li>
        <li>Analytics and performance monitoring</li>
        <li>Preferences and settings</li>
      </ul>
      <p>
        You can control cookies through your browser settings, but this may affect functionality.
      </p>

      <h2>10. Changes to This Privacy Policy</h2>
      <p>
        We may update this Privacy Policy periodically. Changes will be posted with a new "Last Updated" date.
        Significant changes will be communicated via email or in-app notification. Continued use after changes
        constitutes acceptance of the updated policy.
      </p>

      <h2>11. Contact Us</h2>
      <p>For privacy-related questions, requests, or concerns:</p>
      <div className="highlight-box">
        <p>
          <strong>Email:</strong> privacy@couplestherapyassistant.com<br />
          <strong>Data Protection Officer:</strong> dpo@couplestherapyassistant.com<br />
          <strong>Address:</strong> [Company Address]
        </p>
        <p>We will respond to requests within 30 days.</p>
      </div>

      <h2>12. Your Data, Your Control</h2>
      <div className="highlight-box">
        <p>
          We believe you should have control over your data. Access your privacy settings in your profile to:
        </p>
        <ul>
          <li>Review what data we have</li>
          <li>Download your data</li>
          <li>Delete specific content</li>
          <li>Close your account</li>
          <li>Manage communication preferences</li>
        </ul>
      </div>

      <p style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid #dee2e6' }}>
        <em>
          For our Terms of Service, please visit <Link to="/terms">Terms of Service</Link>.
        </em>
      </p>
    </main>
  );
};

export default PrivacyPage;
