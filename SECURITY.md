# Security Policy • Rajarajeswari College of Engineering (RRCE ERP)

The RRCE ERP engineering team takes data protection, academic integrity, and cyber security with the utmost seriousness.

## Supported Versions

Only the latest production release on the `main` branch deployed to production is actively supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability within the RRCE ERP platform, please report it responsibly:

1. **Email**: Contact the security engineering team at `security@rrce.org` or `admin@rrce.org`.
2. **Details to Include**:
   - Description of the vulnerability and attack vector
   - Step-by-step reproduction steps or proof-of-concept
   - Impact assessment on students, faculty, or system data
   - Any suggested mitigations or patches
3. **Response Timeline**:
   - Initial acknowledgement: within 24 hours
   - Triaged assessment and severity rating: within 48 hours
   - Patch deployment and resolution: within 7 days for critical vulnerabilities

Please **DO NOT** disclose the vulnerability publicly or to third parties before the RRCE ERP security team has validated and patched the issue.

## Security Architecture Highlights

- **Edge Runtime Middleware**: Route-level role enforcement across `/student`, `/faculty`, `/hod`, `/admissions`, and `/principal`.
- **Double-Submit CSRF**: State-modifying HTTP operations require validated CSRF tokens and SameSite cookies.
- **Adaptive Rate Limiting & Account Lockout**: Sliding-window rate limiting on authentication routes with temporary account lockout after 5 consecutive failed attempts.
- **Database Row-Level Security & Tamper-Proof Audit**: PostgreSQL RLS with append-only audit trail rules.
- **Credential Protection**: Bcrypt password hashing (10 salt rounds), SHA-256 hashed refresh tokens with rotation and reuse detection.
- **Content Security Policy**: Comprehensive HTTP headers (CSP, HSTS preload, X-Frame-Options: DENY, X-Content-Type-Options: nosniff).
