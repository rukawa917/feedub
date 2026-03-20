# Security Policy

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 1.0.x   | Yes                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT open a public issue.**
2. Open a private security advisory on GitHub, or email the maintainer with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. You will receive an acknowledgment within 48 hours.
4. We will work with you to understand and address the issue before any public disclosure.

## Security Considerations

Feedub is a **self-hosted** application designed for personal use. Please be aware of:

- **Telegram session strings** are stored in the database. Protect your `~/.feedub/data/` directory.
- **JWT secrets** are auto-generated during setup. Keep your `~/.feedub/.env` file private.
- **LLM API keys** (if configured) are stored in `~/.feedub/.env`. Never commit this file.
- Always run Feedub behind a **reverse proxy** (Caddy, Nginx) with HTTPS in production.
