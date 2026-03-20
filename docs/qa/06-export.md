# Export Test Scenarios

## Overview
Test scenarios for exporting messages in TXT and Markdown formats with filter support.

---

## Basic Export

### TS-EXPORT-001: Export to TXT format
**Priority**: Critical
**Type**: Happy Path

**Given** user has messages on dashboard
**When** user clicks Export > TXT
**Then**
- Export process begins
- File downloads with `.txt` extension
- Content formatted with structured blocks
- Emoji icons for metadata
- ASCII separators between messages

**Notes**: TXT format optimized for AI model consumption

---

### TS-EXPORT-002: Export to Markdown format
**Priority**: Critical
**Type**: Happy Path

**Given** user has messages on dashboard
**When** user clicks Export > Markdown
**Then**
- Export process begins
- File downloads with `.md` extension
- Content formatted with headers (H1/H2/H3)
- Messages grouped by chat
- Human-readable formatting

---

### TS-EXPORT-003: Export dropdown menu
**Priority**: High
**Type**: Happy Path

**Given** export button is visible
**When** user clicks Export button
**Then**
- Dropdown shows format options (TXT, Markdown)
- Clear labels for each format
- Click on format triggers export

---

## Filtered Export

### TS-EXPORT-004: Export with active search filter
**Priority**: High
**Type**: Happy Path

**Given** user has search filter active (e.g., "meeting")
**When** user exports
**Then**
- Only messages matching search included
- Export file contains filtered subset
- Filename may indicate filter applied

---

### TS-EXPORT-005: Export with chat filter
**Priority**: High
**Type**: Happy Path

**Given** user has chat filter active
**When** user exports
**Then**
- Only messages from selected chats included
- Chat grouping in Markdown reflects filter

---

### TS-EXPORT-006: Export with date range
**Priority**: High
**Type**: Happy Path

**Given** user has date range filter active
**When** user exports
**Then**
- Only messages within date range included
- Chronological ordering preserved

---

### TS-EXPORT-007: Export with multiple filters
**Priority**: High
**Type**: Happy Path

**Given** user has search + chat + date filters active
**When** user exports
**Then**
- All filters applied to export
- Export reflects exact filtered view
- Consistent with on-screen results

---

## Export Limits

### TS-EXPORT-008: Export limit warning (1000 messages)
**Priority**: High
**Type**: Edge Case

**Given** filtered results contain >1000 messages
**When** user initiates export
**Then**
- Warning displayed about limit
- "Exporting first 1000 messages"
- Option to narrow filters suggested
- Export proceeds with limit

**Notes**: Prevents browser memory issues

---

### TS-EXPORT-009: Export exactly 1000 messages
**Priority**: Medium
**Type**: Edge Case

**Given** filtered results contain exactly 1000+ messages
**When** export completes
**Then**
- File contains 1000 messages
- Oldest 1000 or newest 1000 (consistent order)
- No truncation mid-message

---

## File Download

### TS-EXPORT-010: Filename format
**Priority**: Medium
**Type**: Happy Path

**Given** export completes
**When** file downloads
**Then**
- Filename includes timestamp
- Format: `feedub-export-YYYYMMDD-HHMMSS.txt`
- Or similar identifiable pattern

---

### TS-EXPORT-011: Download triggers correctly
**Priority**: High
**Type**: Happy Path

**Given** export file generated
**When** download initiated
**Then**
- Browser download dialog appears (or auto-download)
- File saves to default downloads folder
- No browser errors

---

## Export Content Quality

### TS-EXPORT-012: TXT format structure
**Priority**: High
**Type**: Happy Path

**Given** TXT export completes
**When** opening exported file
**Then**
- Each message in structured block
- Metadata clearly labeled (sender, time, chat)
- Content preserved accurately
- Unicode/emoji handled correctly

---

### TS-EXPORT-013: Markdown format structure
**Priority**: High
**Type**: Happy Path

**Given** Markdown export completes
**When** opening exported file
**Then**
- H1 header with export title
- H2 headers per chat
- H3 or bullets per message
- Proper markdown syntax
- Renders correctly in markdown viewers

---

### TS-EXPORT-014: Special characters in export
**Priority**: Medium
**Type**: Edge Case

**Given** messages contain special chars (emoji, unicode, URLs)
**When** exported
**Then**
- Characters preserved correctly
- No encoding issues
- URLs clickable in markdown

---

## Edge Cases

### TS-EXPORT-015: Export with no messages
**Priority**: Medium
**Type**: Edge Case

**Given** filters result in zero messages
**When** user tries to export
**Then**
- Appropriate message shown
- "No messages to export"
- Export button disabled or shows feedback

---

### TS-EXPORT-016: Export during message fetch
**Priority**: Low
**Type**: Edge Case

**Given** message fetch is in progress
**When** user tries to export
**Then**
- Export uses currently available messages
- Or waits for fetch completion
- Clear behavior either way

---

### TS-EXPORT-017: Very long messages
**Priority**: Low
**Type**: Edge Case

**Given** message with very long content (5000+ chars)
**When** exported
**Then**
- Full content included
- No truncation
- Formatting preserved

---

## Performance

### TS-EXPORT-018: Export performance (1000 messages)
**Priority**: Medium
**Type**: Performance

**Given** 1000 messages to export
**When** export initiated
**Then**
- Completes within 5-10 seconds
- Progress indication (if slow)
- No browser freeze
- Memory usage reasonable

---

### TS-EXPORT-019: Batch fetching for export
**Priority**: Medium
**Type**: Performance

**Given** export needs to fetch messages
**When** export runs
**Then**
- Fetches in batches (200 per request)
- Progress updates between batches
- Handles pagination correctly
