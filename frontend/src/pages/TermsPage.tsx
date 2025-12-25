import React from 'react';
import { Link } from 'react-router-dom';
import '../components/layout/Layout.css';

const TermsPage: React.FC = () => {
  return (
    <div className="legal-page">
      <Link to="/" className="back-link">← Back to Home</Link>

      <h1>Terms of Service</h1>
      <p className="last-updated">Last Updated: December 25, 2024</p>

      <div className="warning-box">
        <p><strong>Important Notice:</strong> This service provides AI-generated guidance and is not a substitute for professional therapy, counseling, or mental health services. In case of emergency or crisis, please contact emergency services immediately.</p>
      </div>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing and using the Couples Therapy Assistant ("Service"), you agree to be bound by these Terms of Service.
        If you do not agree to these terms, please do not use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        Couples Therapy Assistant is an AI-powered platform designed to provide general relationship guidance and support.
        The Service includes:
      </p>
      <ul>
        <li>AI-generated conversation facilitation between partners</li>
        <li>Pattern recognition in relationship dynamics</li>
        <li>General therapeutic techniques and exercises</li>
        <li>Educational content about relationship health</li>
      </ul>

      <h2>3. Limitations and Disclaimers</h2>

      <h3>3.1 Not Professional Therapy</h3>
      <p>
        This Service does <strong>not</strong> provide professional therapy, counseling, or mental health services.
        The AI assistant is not a licensed therapist, psychologist, or medical professional. All guidance provided
        is for informational and educational purposes only.
      </p>

      <h3>3.2 Not for Crisis Situations</h3>
      <div className="warning-box">
        <p>
          <strong>Do not use this Service in crisis situations.</strong> If you or someone you know is experiencing:
        </p>
        <ul>
          <li>Suicidal thoughts or behaviors</li>
          <li>Domestic violence or abuse</li>
          <li>Severe mental health crisis</li>
          <li>Medical emergency</li>
        </ul>
        <p>
          Please contact emergency services (911) or crisis hotlines immediately. See our Crisis Resources in the footer.
        </p>
      </div>

      <h3>3.3 AI Limitations</h3>
      <p>
        The AI assistant may:
      </p>
      <ul>
        <li>Provide inaccurate or incomplete information</li>
        <li>Misunderstand context or nuance</li>
        <li>Generate responses that may not be appropriate for all situations</li>
        <li>Fail to recognize serious mental health issues</li>
      </ul>
      <p>
        Users should exercise critical judgment and seek professional help when needed.
      </p>

      <h2>4. User Responsibilities</h2>

      <h3>4.1 Appropriate Use</h3>
      <p>You agree to use the Service:</p>
      <ul>
        <li>In good faith and for its intended purpose</li>
        <li>With honesty and authenticity</li>
        <li>With respect for your partner and the process</li>
        <li>In compliance with all applicable laws</li>
      </ul>

      <h3>4.2 Prohibited Activities</h3>
      <p>You may not:</p>
      <ul>
        <li>Use the Service to harass, abuse, or harm others</li>
        <li>Share accounts or login credentials</li>
        <li>Attempt to circumvent security measures</li>
        <li>Use the Service for any illegal purpose</li>
        <li>Impersonate another person</li>
        <li>Attempt to extract or reverse-engineer the AI models</li>
      </ul>

      <h3>4.3 Content Responsibility</h3>
      <p>
        You are responsible for all content you provide to the Service. You agree not to share:
      </p>
      <ul>
        <li>Information about third parties without consent</li>
        <li>Illegal, harmful, or abusive content</li>
        <li>False or misleading information</li>
        <li>Content that violates others' rights</li>
      </ul>

      <h2>5. Privacy and Data</h2>
      <p>
        Your use of the Service is also governed by our <Link to="/privacy">Privacy Policy</Link>.
        By using the Service, you consent to our data practices as described in the Privacy Policy.
      </p>

      <h2>6. Account Security</h2>
      <p>
        You are responsible for maintaining the confidentiality of your account credentials and for all activities
        that occur under your account. You agree to:
      </p>
      <ul>
        <li>Use a strong, unique password</li>
        <li>Not share your account with others</li>
        <li>Notify us immediately of any unauthorized access</li>
        <li>Log out after each session on shared devices</li>
      </ul>

      <h2>7. Intellectual Property</h2>
      <p>
        The Service, including all content, features, and functionality, is owned by Couples Therapy Assistant
        and protected by copyright, trademark, and other intellectual property laws. You may not:
      </p>
      <ul>
        <li>Copy, modify, or distribute the Service or its content</li>
        <li>Use the Service's branding without permission</li>
        <li>Create derivative works based on the Service</li>
      </ul>

      <h2>8. Termination</h2>
      <p>
        We reserve the right to suspend or terminate your access to the Service at any time, with or without cause,
        with or without notice. Grounds for termination include:
      </p>
      <ul>
        <li>Violation of these Terms of Service</li>
        <li>Fraudulent or illegal activity</li>
        <li>Abuse of the Service or other users</li>
        <li>Extended period of inactivity</li>
      </ul>
      <p>
        You may terminate your account at any time through the profile settings.
      </p>

      <h2>9. Limitation of Liability</h2>
      <div className="highlight-box">
        <p>
          <strong>TO THE FULLEST EXTENT PERMITTED BY LAW:</strong>
        </p>
        <ul>
          <li>The Service is provided "AS IS" without warranties of any kind</li>
          <li>We are not liable for any damages arising from use of the Service</li>
          <li>We do not guarantee accuracy, reliability, or availability of the Service</li>
          <li>You use the Service at your own risk</li>
        </ul>
        <p>
          We are not responsible for decisions made based on AI-generated advice or for outcomes of using the Service.
        </p>
      </div>

      <h2>10. Indemnification</h2>
      <p>
        You agree to indemnify and hold harmless Couples Therapy Assistant, its affiliates, and personnel from any
        claims, damages, or expenses arising from your use of the Service or violation of these Terms.
      </p>

      <h2>11. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately
        upon posting. Your continued use of the Service after changes constitutes acceptance of the modified terms.
        We will notify users of significant changes via email or in-app notification.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These Terms are governed by the laws of the United States and the state in which our company is registered,
        without regard to conflict of law provisions. Any disputes shall be resolved in the courts of that jurisdiction.
      </p>

      <h2>13. Severability</h2>
      <p>
        If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or
        eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
      </p>

      <h2>14. Contact Information</h2>
      <p>
        For questions about these Terms of Service, please contact us at:
      </p>
      <div className="highlight-box">
        <p>
          <strong>Email:</strong> legal@couplestherapyassistant.com<br />
          <strong>Address:</strong> [Company Address]
        </p>
      </div>

      <h2>15. Reporting Issues</h2>
      <p>
        If you encounter inappropriate advice, technical issues, or have concerns about the Service:
      </p>
      <ul>
        <li>Use the "Report this advice" button on concerning AI responses</li>
        <li>Contact our support team at support@couplestherapyassistant.com</li>
        <li>For urgent safety concerns, contact emergency services</li>
      </ul>

      <div className="warning-box">
        <p>
          <strong>Remember:</strong> This Service is a tool to support your relationship journey, not a replacement
          for professional help. If you're facing serious relationship challenges, abuse, or mental health concerns,
          please seek qualified professional assistance.
        </p>
      </div>
    </div>
  );
};

export default TermsPage;
