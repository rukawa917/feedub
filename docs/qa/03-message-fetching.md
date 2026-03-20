# Message Fetching Test Scenarios

## Overview
Test scenarios for async message fetching from Telegram, progress tracking, cancellation, and error handling.

---

## Initial Sync

### TS-FETCH-001: Trigger initial message sync
**Priority**: Critical
**Type**: Happy Path

**Given** user has selected channels and no messages exist
**When** sync is triggered (auto or manual)
**Then**
- API call to `POST /messages/fetch` made with channel_ids
- Fetch operation created with status "pending"
- Progress indicator appears
- Background fetch begins

**Notes**: Auto-trigger on first login after channel selection

---

### TS-FETCH-002: Progress indicator during fetch
**Priority**: Critical
**Type**: Happy Path

**Given** fetch operation is in progress
**When** progress updates come in (polling)
**Then**
- Progress bar shows completion percentage
- Current channel name displayed
- "X of Y channels" count shown
- Message count incrementing

**Notes**: Polling interval ~3 seconds via `GET /messages/fetch/{id}`

---

### TS-FETCH-003: Channel-by-channel progress
**Priority**: High
**Type**: Happy Path

**Given** fetch is processing multiple channels
**When** each channel completes
**Then**
- Completed channels count increases
- Current channel name updates
- Progress percentage increases
- Visual feedback per channel completion

---

### TS-FETCH-004: Fetch completes successfully
**Priority**: Critical
**Type**: Happy Path

**Given** fetch operation is running
**When** all channels are processed
**Then**
- Status changes to "completed"
- Final message count displayed
- Success notification/indicator shown
- Message list updates with fetched messages
- Progress indicator disappears

---

## Subsequent Syncs

### TS-FETCH-005: Incremental sync (new messages only)
**Priority**: Critical
**Type**: Happy Path

**Given** user has existing messages from previous sync
**When** user triggers another sync
**Then**
- Only messages newer than existing are fetched
- Deduplication via min_message_id works
- Existing messages preserved
- New message count reflects only additions

**Notes**: Uses `min_id` parameter to Telegram API

---

### TS-FETCH-006: Manual sync button
**Priority**: High
**Type**: Happy Path

**Given** user is on dashboard with no active fetch
**When** user clicks "Sync" / "Fetch Messages" button
**Then**
- Button shows loading state
- Fetch operation begins
- Progress indicator appears
- Button disabled during fetch

---

## Cancellation

### TS-FETCH-007: Cancel fetch operation
**Priority**: High
**Type**: Happy Path

**Given** fetch operation is in progress
**When** user clicks "Cancel" button
**Then**
- Confirmation dialog appears
- On confirm: API call to `POST /messages/fetch/{id}/cancel`
- Fetch status changes to "cancelled"
- Messages from current fetch are rolled back
- Progress indicator disappears

**Notes**: Rollback uses fetch_id on messages table

---

### TS-FETCH-008: Cancel confirmation dialog
**Priority**: Medium
**Type**: Happy Path

**Given** user clicks Cancel during fetch
**When** confirmation dialog appears
**Then**
- Clear warning about data loss
- "Cancel Sync" and "Continue" options
- Dismissing dialog continues fetch
- Cancel button disabled while processing

---

### TS-FETCH-009: Rollback on cancel
**Priority**: High
**Type**: Happy Path

**Given** fetch has inserted 500 messages when cancelled
**When** cancel is confirmed
**Then**
- All messages with that fetch_id are deleted
- Database returns to pre-fetch state
- Previously existing messages unaffected

---

## Navigation During Fetch

### TS-FETCH-010: Navigate away during fetch
**Priority**: High
**Type**: Edge Case

**Given** fetch is in progress
**When** user navigates to different page or closes tab
**Then**
- Fetch continues in background (backend)
- On return, status polling resumes
- Progress indicator reappears with current state

**Notes**: Background task runs independently of frontend

---

## Rate Limiting

### TS-FETCH-011: Rate limit enforcement (1 per hour)
**Priority**: High
**Type**: Security

**Given** user completed a fetch within the last hour
**When** user attempts to start another fetch
**Then**
- API returns 429 or rate limit error
- User sees message about wait time
- Sync button disabled with countdown

**Notes**: Rate limit is 1 fetch per hour per user

---

### TS-FETCH-012: Rate limit countdown display
**Priority**: Medium
**Type**: Happy Path

**Given** user is rate limited
**When** viewing sync button
**Then**
- Button shows "Available in X minutes"
- Countdown updates in real-time
- Button enables when limit expires

---

## Error Handling

### TS-FETCH-013: Partial channel failure
**Priority**: High
**Type**: Error

**Given** fetch is processing 5 channels
**When** one channel fails (e.g., permissions revoked)
**Then**
- Failed channel recorded in failed_channels array
- Other channels continue processing
- Final status shows partial success
- Error details available in response

---

### TS-FETCH-014: Session expired during fetch
**Priority**: High
**Type**: Error

**Given** fetch is in progress
**When** Telegram session becomes invalid
**Then**
- Fetch status changes to "failed"
- Error type: "session_expired"
- User prompted to re-authenticate
- Clear error message displayed

---

### TS-FETCH-015: Network error during fetch
**Priority**: High
**Type**: Error

**Given** fetch is in progress
**When** network connection lost
**Then**
- Backend continues (if server-side)
- Frontend shows connection error
- On reconnect, polling resumes
- Fetch may complete in background

---

### TS-FETCH-016: Database error during fetch
**Priority**: Medium
**Type**: Error

**Given** fetch is inserting messages
**When** database error occurs
**Then**
- Fetch status changes to "failed"
- Error type: "connection_error"
- Partial data may be saved
- User can retry

---

## Edge Cases

### TS-FETCH-017: Fetch with no new messages
**Priority**: Medium
**Type**: Edge Case

**Given** all messages already synced
**When** user triggers sync
**Then**
- Fetch completes quickly
- Message count shows 0 new
- "Already up to date" message
- Not counted against rate limit? (implementation dependent)

---

### TS-FETCH-018: Very large channel (10k+ messages)
**Priority**: Medium
**Type**: Performance

**Given** user has channel with many messages
**When** initial sync runs
**Then**
- Progress updates frequently
- Batch insertion (500 per batch)
- No timeout errors
- Memory usage stays reasonable

**Notes**: 1000 message limit per channel prevents runaway

---

### TS-FETCH-019: Fetch while already fetching
**Priority**: Medium
**Type**: Edge Case

**Given** fetch is already in progress
**When** user tries to start another fetch
**Then**
- API rejects duplicate fetch
- "Fetch already in progress" message
- Existing fetch continues unaffected

---

## Status Polling

### TS-FETCH-020: Active fetch detection on page load
**Priority**: High
**Type**: Happy Path

**Given** fetch was started in another tab/session
**When** user loads dashboard
**Then**
- `GET /messages/fetch/active` finds ongoing fetch
- Progress indicator shows current state
- Polling begins automatically
