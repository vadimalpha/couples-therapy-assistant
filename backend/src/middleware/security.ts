import helmet from 'helmet';

/**
 * Security Middleware Configuration
 *
 * Configures Helmet.js with security headers for production deployment.
 * Protects against common web vulnerabilities.
 */

/**
 * Production-ready Helmet configuration
 * Includes CSP, HSTS, and other security headers
 */
export const securityMiddleware = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Allow inline styles for React and styled-components
      styleSrc: ["'self'", "'unsafe-inline'"],
      // Allow inline scripts for React (consider nonce in production)
      scriptSrc: ["'self'", "'unsafe-inline'"],
      // Allow images from self and data URIs
      imgSrc: ["'self'", 'data:', 'https:'],
      // Allow fonts from self
      fontSrc: ["'self'"],
      // Connect to API and WebSocket
      connectSrc: ["'self'", 'ws:', 'wss:'],
      // Restrict frames
      frameSrc: ["'none'"],
      // Restrict objects
      objectSrc: ["'none'"],
      // Upgrade insecure requests in production
      upgradeInsecureRequests: [],
    },
  },

  // Strict Transport Security (HSTS)
  // Force HTTPS for 1 year
  hsts: {
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true,
    preload: true,
  },

  // X-Frame-Options: Prevent clickjacking
  frameguard: {
    action: 'deny',
  },

  // X-Content-Type-Options: Prevent MIME sniffing
  noSniff: true,

  // X-XSS-Protection: Enable browser XSS filter
  xssFilter: true,

  // Referrer-Policy: Control referrer information
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin',
  },

  // X-DNS-Prefetch-Control: Control DNS prefetching
  dnsPrefetchControl: {
    allow: false,
  },

  // X-Download-Options: Prevent downloads from opening
  ieNoOpen: true,

  // X-Permitted-Cross-Domain-Policies: Restrict cross-domain policies
  permittedCrossDomainPolicies: {
    permittedPolicies: 'none',
  },
});

/**
 * Development-friendly Helmet configuration
 * Relaxed CSP for local development
 */
export const devSecurityMiddleware = helmet({
  contentSecurityPolicy: false, // Disable CSP in development
  hsts: false, // No HSTS in development
});

/**
 * Get appropriate security middleware based on environment
 */
export function getSecurityMiddleware() {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? securityMiddleware : devSecurityMiddleware;
}
