# Message Filtering Test Scenarios

## Overview
Test scenarios for message search, filtering by various criteria, filter combinations, and persistence.

---

## Text Search

### TS-FILTER-001: Basic text search
**Priority**: Critical
**Type**: Happy Path

**Given** user has messages loaded on dashboard
**When** user types "hello" in search box
**Then**
- Search is debounced (300ms delay)
- API call with `search=hello` parameter
- Results show only messages containing "hello"
- Search term highlighted in results (if implemented)

---

### TS-FILTER-002: Search debouncing
**Priority**: High
**Type**: Performance

**Given** search box is focused
**When** user types "telegram" quickly (one char at a time)
**Then**
- API call only made after 300ms pause
- No API call for each keystroke
- Final search for full term "telegram"

**Notes**: Prevents API spam, improves UX

---

### TS-FILTER-003: Clear search
**Priority**: High
**Type**: Happy Path

**Given** search has active query
**When** user clears search box (backspace or X button)
**Then**
- Search filter removed
- Full message list restored
- Other active filters still apply

---

### TS-FILTER-004: Search with no results
**Priority**: Medium
**Type**: Edge Case

**Given** user searches for term not in any message
**When** search completes
**Then**
- Empty state displayed
- "No messages found" message
- Suggestion to adjust search
- Clear search option available

---

### TS-FILTER-005: Search special characters
**Priority**: Low
**Type**: Edge Case

**Given** user searches for special chars (e.g., "@#$%")
**When** search executes
**Then**
- No errors or crashes
- Search handles special chars gracefully
- Results match if special chars exist in messages

---

## Chat/Channel Filter

### TS-FILTER-006: Filter by single chat
**Priority**: High
**Type**: Happy Path

**Given** user has messages from multiple chats
**When** user selects one chat from filter
**Then**
- Only messages from selected chat shown
- Chat filter shows selected state
- Message count updates

---

### TS-FILTER-007: Filter by multiple chats
**Priority**: High
**Type**: Happy Path

**Given** chat filter is available
**When** user selects multiple chats
**Then**
- Messages from all selected chats shown
- Each selected chat indicated in filter
- Results are union of selected chats

---

### TS-FILTER-008: Clear chat filter
**Priority**: High
**Type**: Happy Path

**Given** chat filter is active
**When** user clears chat selection
**Then**
- All chats included again
- Filter shows "All Chats" or similar
- Message list updates

---

### TS-FILTER-009: Chat filter with search
**Priority**: High
**Type**: Happy Path

**Given** many chats available in filter
**When** user types in chat filter search
**Then**
- Chat list filters to matching names
- Selection state preserved
- Easy to find specific chat

---

## Date Range Filter

### TS-FILTER-010: Filter by date range
**Priority**: High
**Type**: Happy Path

**Given** messages span multiple dates
**When** user sets start and end date
**Then**
- Only messages within range shown
- Date picker shows selected range
- Inclusive of start and end dates

---

### TS-FILTER-011: Quick filter - Today
**Priority**: High
**Type**: Happy Path

**Given** quick filter buttons available
**When** user clicks "Today"
**Then**
- Date range set to today only
- Messages from today shown
- Quick filter shows selected state

---

### TS-FILTER-012: Quick filter - This Week
**Priority**: Medium
**Type**: Happy Path

**Given** quick filter buttons available
**When** user clicks "This Week"
**Then**
- Date range set to current week (Mon-Sun or Sun-Sat)
- Messages from this week shown

---

### TS-FILTER-013: Quick filter - This Month
**Priority**: Medium
**Type**: Happy Path

**Given** quick filter buttons available
**When** user clicks "This Month"
**Then**
- Date range set to current calendar month
- Messages from this month shown

---

### TS-FILTER-014: Custom date range
**Priority**: Medium
**Type**: Happy Path

**Given** date picker is open
**When** user selects specific start and end dates
**Then**
- Custom range applied
- Date picker shows selected dates
- Results filtered accordingly

---

### TS-FILTER-015: Clear date filter
**Priority**: Medium
**Type**: Happy Path

**Given** date filter is active
**When** user clears date selection
**Then**
- All dates included
- Date picker resets
- "All Time" or similar shown

---

## Message Type Filter

### TS-FILTER-016: Filter by message type - Photos
**Priority**: Medium
**Type**: Happy Path

**Given** messages include various types
**When** user selects "Photo" type filter
**Then**
- Only photo messages shown
- Type filter shows selected state
- Text-only messages excluded

---

### TS-FILTER-017: Filter by message type - Videos
**Priority**: Medium
**Type**: Happy Path

**Given** messages include videos
**When** user selects "Video" type filter
**Then**
- Only video messages shown

---

### TS-FILTER-018: Filter by message type - Documents
**Priority**: Medium
**Type**: Happy Path

**Given** messages include documents
**When** user selects "Document" type filter
**Then**
- Only document messages shown

---

### TS-FILTER-019: Filter by multiple types
**Priority**: Medium
**Type**: Happy Path

**Given** type filter supports multi-select
**When** user selects Photo and Video
**Then**
- Photos and videos both shown
- Text-only messages excluded

---

## Media Filter

### TS-FILTER-020: Show only messages with media
**Priority**: Medium
**Type**: Happy Path

**Given** media toggle available
**When** user enables "Has Media" filter
**Then**
- Only messages with attachments shown
- Text-only messages excluded
- Toggle shows enabled state

---

### TS-FILTER-021: Show only messages without media
**Priority**: Low
**Type**: Happy Path

**Given** media filter has "No Media" option
**When** user selects it
**Then**
- Only text-only messages shown
- Messages with media excluded

---

## Filter Combinations

### TS-FILTER-022: Combine search and chat filter
**Priority**: High
**Type**: Happy Path

**Given** user has multiple filters available
**When** user searches "meeting" AND selects "Work Chat"
**Then**
- Only messages in Work Chat containing "meeting"
- Both filters shown as active
- Results reflect AND combination

---

### TS-FILTER-023: Combine search, chat, and date
**Priority**: High
**Type**: Happy Path

**Given** multiple filters active
**When** user has search + chat + date range
**Then**
- All filters applied (AND logic)
- Only matching messages shown
- Active filter count indicated

---

### TS-FILTER-024: Combine all filter types
**Priority**: Medium
**Type**: Happy Path

**Given** all filters available
**When** user sets: search + chat + date + type + media
**Then**
- All filters apply simultaneously
- Results match all criteria
- Performance acceptable

---

### TS-FILTER-025: No results with filter combination
**Priority**: Medium
**Type**: Edge Case

**Given** restrictive filter combination
**When** no messages match all criteria
**Then**
- Empty state shown
- Active filters displayed
- Easy to loosen filters

---

## Filter Persistence

### TS-FILTER-026: Filters persist on page refresh
**Priority**: High
**Type**: Happy Path

**Given** user has active filters
**When** user refreshes page
**Then**
- Filter state restored from localStorage
- Same filters applied
- Results match previous view

---

### TS-FILTER-027: Filters persist across sessions
**Priority**: Medium
**Type**: Happy Path

**Given** user has active filters and closes browser
**When** user returns later
**Then**
- Filter state restored
- User sees same filtered view

---

### TS-FILTER-028: Clear all filters
**Priority**: High
**Type**: Happy Path

**Given** multiple filters active
**When** user clicks "Clear All Filters" / "Reset"
**Then**
- All filters removed
- Full message list shown
- Filter UI reset to defaults

---

## Mobile Experience

### TS-FILTER-029: Filter drawer on mobile
**Priority**: High
**Type**: Happy Path

**Given** user on mobile viewport
**When** user taps filter button
**Then**
- Filter drawer slides in
- All filter options accessible
- Close button available
- Apply button applies filters

---

### TS-FILTER-030: Filter badge on mobile
**Priority**: Medium
**Type**: Happy Path

**Given** filters active on mobile
**When** filter drawer is closed
**Then**
- Badge shows active filter count
- Easy to see filters are applied
- Tap opens drawer to modify

---

## Performance

### TS-FILTER-031: Large result set performance
**Priority**: Medium
**Type**: Performance

**Given** filter matches 10,000+ messages
**When** results render
**Then**
- Pagination keeps list manageable
- Scrolling is smooth
- No browser freeze
- Load more works correctly

---

### TS-FILTER-032: Filter change responsiveness
**Priority**: Medium
**Type**: Performance

**Given** user changes filter
**When** new results load
**Then**
- Loading indicator shows
- Results appear within 2-3 seconds
- No UI jank or freeze
