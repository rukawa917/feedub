# Channel Selection Test Scenarios

## Overview
Test scenarios for the channel selection feature that allows users to choose which Telegram channels/groups to sync messages from.

---

## First Login Flow

### TS-CHAN-001: Channel selector appears on first login
**Priority**: Critical
**Type**: Happy Path

**Given** user has just completed authentication for the first time
**When** user is redirected to dashboard
**Then**
- Channel selector modal/panel appears automatically
- Loading state shows while fetching channels
- User cannot access dashboard until selection is made

**Notes**: Fresh login flag is set in sessionStorage

---

### TS-CHAN-002: Channel list loads successfully
**Priority**: Critical
**Type**: Happy Path

**Given** channel selector is open
**When** channels are fetched from `/channels/available`
**Then**
- List of all user's Telegram channels/groups appears
- Each channel shows: name, type badge, member count, last message date
- Channels are sorted (by name or activity)
- Loading spinner disappears

**Notes**: API fetches fresh data from Telegram

---

### TS-CHAN-003: Channel metadata display
**Priority**: Medium
**Type**: Happy Path

**Given** channel list is loaded
**When** viewing channel entries
**Then**
- Channel name is displayed clearly
- Type badge shows (Channel, Supergroup, Group)
- Member count shows with K/M suffix for large numbers (e.g., 10.5K)
- Last message date shows relative time (Today, Yesterday, 3d ago, etc.)

**Notes**: Member count may be null for private chats

---

## Selection Actions

### TS-CHAN-004: Select individual channel
**Priority**: Critical
**Type**: Happy Path

**Given** channel list is displayed
**When** user clicks on a channel checkbox
**Then**
- Checkbox becomes checked
- Selected count updates in header
- Channel visually indicates selection state

---

### TS-CHAN-005: Deselect individual channel
**Priority**: High
**Type**: Happy Path

**Given** a channel is currently selected
**When** user clicks on the selected channel's checkbox
**Then**
- Checkbox becomes unchecked
- Selected count decreases
- Visual selection state removed

---

### TS-CHAN-006: Select all channels
**Priority**: High
**Type**: Happy Path

**Given** channel list is displayed with some unselected
**When** user clicks "Select All" button
**Then**
- All channel checkboxes become checked
- Selected count equals total channel count
- Button may change to "Clear All"

---

### TS-CHAN-007: Clear all selections
**Priority**: High
**Type**: Happy Path

**Given** some or all channels are selected
**When** user clicks "Clear All" / "Deselect All"
**Then**
- All checkboxes become unchecked
- Selected count shows 0
- "Done" button may become disabled or show warning

---

## Saving Selections

### TS-CHAN-008: Save channel selections
**Priority**: Critical
**Type**: Happy Path

**Given** user has selected one or more channels
**When** user clicks "Done - Start Sync" button
**Then**
- API call to `PUT /channels/selections` made
- Selections are persisted to database
- Channel selector closes
- Message fetch begins automatically

**Notes**: Selections include channel_id, title, type

---

### TS-CHAN-009: Selections persist across sessions
**Priority**: High
**Type**: Happy Path

**Given** user previously saved channel selections
**When** user logs in again
**Then**
- `GET /channels/selections` returns saved selections
- User goes directly to dashboard (no selector modal)
- Future fetches use saved channel list

---

## Modifying Selections

### TS-CHAN-010: Change channels from dashboard
**Priority**: High
**Type**: Happy Path

**Given** user is on dashboard with existing selections
**When** user clicks "Change Channels" button
**Then**
- Channel selector opens
- Previously selected channels are pre-checked
- User can modify selections
- "Done" saves changes

**Notes**: Button location may vary (header, sidebar, settings)

---

### TS-CHAN-011: Add new channel to selections
**Priority**: High
**Type**: Happy Path

**Given** user opens channel selector with existing selections
**When** user selects additional channels and saves
**Then**
- New channels added to selections
- Next sync includes new channels
- Existing messages from old channels preserved

---

### TS-CHAN-012: Remove channel from selections
**Priority**: High
**Type**: Happy Path

**Given** user opens channel selector with existing selections
**When** user deselects a channel and saves
**Then**
- Channel removed from selections
- Next sync excludes that channel
- Existing messages from that channel remain in database

**Notes**: Messages are NOT deleted when channel is deselected

---

## Error Handling

### TS-CHAN-013: Channel list fails to load
**Priority**: High
**Type**: Error

**Given** channel selector opens
**When** API call to `/channels/available` fails
**Then**
- Error message displays
- Retry button is available
- User can dismiss and try again later

**Notes**: Check network errors, 500 errors, timeout

---

### TS-CHAN-014: Save selections fails
**Priority**: High
**Type**: Error

**Given** user clicks "Done" to save selections
**When** API call to `PUT /channels/selections` fails
**Then**
- Error message displays
- Selections remain in local state
- User can retry saving

---

## Edge Cases

### TS-CHAN-015: User has no channels/groups
**Priority**: Medium
**Type**: Edge Case

**Given** user's Telegram account has no channels or groups
**When** channel selector opens
**Then**
- Empty state message displays
- Guidance on joining channels shown
- "Skip" or "Continue anyway" option available

---

### TS-CHAN-016: Refresh channel list
**Priority**: Medium
**Type**: Happy Path

**Given** channel selector is open with loaded list
**When** user clicks "Refresh" button
**Then**
- Loading indicator shows
- Fresh channel list fetched from Telegram
- New channels appear, removed channels disappear
- Selection state preserved for existing channels

**Notes**: Useful if user joined new channel during session

---

### TS-CHAN-017: Very long channel name
**Priority**: Low
**Type**: Edge Case

**Given** user has channel with very long name
**When** viewing in channel list
**Then**
- Name truncates with ellipsis
- Full name visible on hover (tooltip)
- Layout doesn't break

---

### TS-CHAN-018: Large number of channels (100+)
**Priority**: Medium
**Type**: Performance

**Given** user has 100+ channels/groups
**When** channel selector loads
**Then**
- List renders without significant delay
- Scrolling is smooth
- Select All works efficiently
- No browser freeze

**Notes**: Consider virtual scrolling for very large lists
