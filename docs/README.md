# Feedub Documentation

## Quick Reference

| Doc | Purpose |
|-----|---------|
| [self-hosting.md](./self-hosting.md) | Self-hosting deployment guide |
| [environment-variables.md](./environment-variables.md) | All configuration variables |
| [architecture/](./architecture/) | System diagrams, data flows, and ADRs |
| [qa/](./qa/) | QA test scenarios |

## By Audience

**Users / Self-Hosters**: [self-hosting.md](./self-hosting.md) or `pip install feedub && feedub init`

**New Developers**: [CONTRIBUTING.md](../CONTRIBUTING.md) -> [architecture/system-overview](./architecture/system-overview.md) -> [backend-data-flow](./architecture/backend-data-flow.md) or [frontend-data-flow](./architecture/frontend-data-flow.md)

**Architecture**: [architecture/system-overview](./architecture/system-overview.md) -> data flow docs -> [ADRs](./architecture/decisions/)

## Directory Structure

```
docs/
├── README.md                      # This index
├── self-hosting.md                # Self-hosting deployment guide
├── environment-variables.md       # All configuration variables
├── architecture/                  # Architecture docs
│   ├── system-overview.md         # High-level diagram
│   ├── backend-data-flow.md       # Backend layers
│   ├── frontend-data-flow.md      # Frontend state
│   └── decisions/                 # ADRs
│       ├── adr-001-message-export.md
│       ├── adr-002-channel-filtering.md
│       ├── adr-003-phone-encryption.md
│       └── adr-004-frontend-compliance.md
└── qa/                            # QA test scenarios
    ├── README.md
    └── 01-04, 06-07 test scenario files
```
