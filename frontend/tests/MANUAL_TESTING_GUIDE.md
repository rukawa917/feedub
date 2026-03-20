# Feedub Channel Filter - Manual Testing Guide

**Created**: 2025-12-24
**Purpose**: Manual validation of channel filtering functionality
**Related**: CHANNEL_FILTER_FIX.md, frontend/tests/e2e/channel-filter.spec.ts

---

## Prerequisites

Before testing, ensure:

- [x] **Backend running**: `cd backend && uv run uvicorn src.main:app --reload` (http://localhost:8000)
- [x] **Frontend running**: `cd frontend && npm run dev` (http://localhost:5173)
- [x] **Authenticated**: Logged in with valid Telegram account
- [x] **Messages fetched**: At least one channel with messages in database
- [x] **DevTools open**: Browser DevTools → Network tab

---

## Test Suite

### Test 1: Verify Filter UI Exists

**Objective**: Confirm channel filter UI is accessible

**Steps**:
1. Navigate to http://localhost:5173
2. Login if needed (phone + verification code)
3. Wait for dashboard to load
4. **Desktop**: Look for filter sidebar on left side
5. **Mobile**: Tap "Filters" button at bottom
6. Find "Advanced Filters" section
7. Look for "Chat Filter" or "Channel Filter" component

**Expected Result**:
- ✅ Filter UI is visible and accessible
- ✅ Advanced Filters section exists
- ✅ Chat/Channel filter component is present

**Screenshot**: Take screenshot if filter UI not found

---

### Test 2: Select Single Channel

**Objective**: Verify single channel filtering works end-to-end

**Steps**:
1. Open DevTools → Network tab
2. Clear network log (trash icon)
3. Open Advanced Filters
4. Click on channel selector/dropdown
5. Select a channel (e.g., "COINNESS News Feed (코인니스)")
6. Wait for message list to update (~1-2 seconds)

**Verify Network Request**:
1. Find `GET /messages?` request in Network tab
2. Click on request → Headers tab
3. Check **Query String Parameters**:
   - Should see: `chat_ids: -1001234567890` (or similar)
   - **Critical**: Value should be an INTEGER, not a string
4. Click on request → Response tab
5. Verify response contains only messages from selected channel
6. Check each message's `chat_id` field matches selected channel

**Verify UI**:
1. Message list shows only messages from selected channel
2. Each message displays the channel name
3. Message count updates to show filtered count
4. Selected channel appears as a "chip" or tag in filter UI

**Expected Result**:
- ✅ Network request sends `chat_ids` as integer
- ✅ Backend returns only messages from that channel
- ✅ UI displays filtered messages correctly
- ✅ No console errors or warnings

**Failure Symptoms**:
- ❌ Messages don't filter (all messages still shown)
- ❌ Network request shows `chat_ids` as string: `"-1001234567890"`
- ❌ Backend returns empty array
- ❌ Console error about type mismatch

---

### Test 3: Select Multiple Channels

**Objective**: Verify multiple channel selection works (if supported)

**Steps**:
1. With one channel already selected, select another channel
2. Check Network tab for new `GET /messages` request
3. Verify URL contains multiple `chat_ids` parameters

**Expected Result**:
- ✅ URL shows: `?chat_ids=-1001111111111&chat_ids=-1002222222222`
- ✅ Messages from BOTH channels appear
- ✅ Both channels shown as chips/tags in filter UI

**Note**: If multi-select not supported, this test is N/A

---

### Test 4: Deselect Channel (Remove Filter)

**Objective**: Verify removing channel filter works

**Steps**:
1. With channel(s) selected, find the channel chip/tag
2. Click the "X" or remove button on the chip
3. Watch Network tab for new API request
4. Verify message list updates

**Expected Result**:
- ✅ Channel removed from filter UI
- ✅ New API request without that `chat_id`
- ✅ Message list includes messages from removed channel again
- ✅ If all channels removed, shows all messages

---

### Test 5: Clear All Filters

**Objective**: Verify "Clear all" button works

**Steps**:
1. Select one or more channels
2. Click "Clear all" or "Reset" button (if exists)
3. Verify all filters removed

**Expected Result**:
- ✅ All channel chips/tags removed
- ✅ API request without `chat_ids` parameter
- ✅ Message list shows all messages
- ✅ Filter state reset to default

---

### Test 6: Combined Filters

**Objective**: Verify channel filter works with other filters

**Steps**:
1. Select a channel
2. Also enter text in search box
3. Also select a date range (if supported)
4. Verify API request includes ALL filter parameters

**Expected Result**:
- ✅ URL contains: `?chat_ids=-100...&q=search+term&start_date=...`
- ✅ Messages match ALL filters (AND logic)
- ✅ Removing one filter updates results correctly

---

### Test 7: Mobile Viewport

**Objective**: Verify filtering works on mobile

**Steps**:
1. Resize browser to mobile width (390px) or use DevTools device emulation
2. Tap "Filters" button at bottom
3. Filter drawer slides up from bottom
4. Select a channel in the drawer
5. Close drawer by tapping X or overlay
6. Verify messages filtered

**Expected Result**:
- ✅ Drawer opens and closes smoothly
- ✅ Channel filter accessible in drawer
- ✅ Filter persists after closing drawer
- ✅ Messages filter correctly
- ✅ Network request same as desktop

---

### Test 8: Persistence (Optional)

**Objective**: Verify filter state persists across page refresh

**Steps**:
1. Select a channel
2. Refresh the page (F5)
3. Wait for page to reload

**Expected Result** (if persistence enabled):
- ✅ Channel filter restored from localStorage
- ✅ Filtered messages load automatically

**Expected Result** (if no persistence):
- ❌ Filter state cleared
- ❌ All messages shown

**Note**: Check implementation - persistence may not be enabled for channel filters

---

## Debugging Checklist

### If Channel Filter Doesn't Work

1. **Check Console for Errors**:
   ```
   Browser Console (F12) → Console tab
   Look for: TypeError, Network errors, API errors
   ```

2. **Verify Network Request**:
   ```
   Network tab → GET /messages
   Check Query String Parameters:
   - chat_ids should be INTEGER: -1001234567890
   - NOT string: "-1001234567890"
   ```

3. **Check Backend Response**:
   ```
   Network tab → Response tab
   Verify: messages array is not empty
   Verify: all messages have matching chat_id
   ```

4. **Check Frontend State**:
   ```
   React DevTools → Components → MessageFilters
   Look at filters.advanced.chatIds value
   ```

5. **Verify Backend is Running**:
   ```
   curl http://localhost:8000/health
   Should return: {"status": "ok"}
   ```

6. **Check Fix is Applied**:
   ```
   frontend/src/hooks/useServerFilteredMessages.ts:60-62
   Should have: params.chat_ids = filters.advanced.chatIds.map(id => parseInt(id, 10))
   ```

---

## Common Issues

### Issue 1: Filter UI Not Visible

**Symptoms**:
- Can't find "Chat Filter" or "Channel Filter" component
- Advanced Filters section missing

**Possible Causes**:
- Feature not yet implemented (check spec 004 tasks.md)
- Component not rendered due to error
- Mobile drawer not opening

**Debug**:
- Check browser console for React errors
- Inspect DOM for filter elements
- Verify mobile drawer opens (tap filter button)

---

### Issue 2: Filtering Doesn't Work

**Symptoms**:
- Selecting channel doesn't filter messages
- All messages still shown

**Possible Causes**:
1. **Type mismatch** (string vs integer) - THE KNOWN BUG
   - Fix: Convert chat IDs to integers in useServerFilteredMessages.ts
2. API request not sent
3. Backend error (check backend logs)

**Debug**:
```bash
# Check backend logs
cd backend
uv run uvicorn src.main:app --reload

# Look for errors in console output
```

---

### Issue 3: No Channels in Dropdown

**Symptoms**:
- Channel dropdown is empty
- No channels to select

**Possible Causes**:
- No messages fetched yet
- Backend not returning channel list
- Frontend not fetching channels

**Debug**:
```bash
# Check if messages exist
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/messages | jq '.messages | length'

# Should be > 0
```

**Fix**:
- Fetch messages first: POST /messages/fetch
- Wait for fetch to complete (check status)
- Refresh dashboard

---

## Success Criteria

**Testing is successful when**:

- [x] Channel filter UI is visible and usable
- [x] Selecting channel sends API request with INTEGER chat_ids
- [x] Backend returns only messages from selected channel(s)
- [x] UI displays filtered messages correctly
- [x] Message count updates to show filtered total
- [x] Deselecting channel removes filter
- [x] "Clear all" button resets all filters
- [x] No console errors or warnings
- [x] Works on desktop viewport (≥768px width)
- [x] Works on mobile viewport (<768px width)

---

## Automated Testing

After manual validation, run automated E2E tests:

```bash
cd frontend

# Start dev server in background
npm run dev &

# Login manually at http://localhost:5173
# (This stores auth token in localStorage)

# Run E2E tests
npm run test:e2e -- tests/e2e/channel-filter.spec.ts

# Stop dev server
pkill -f "vite"
```

**Note**: E2E tests skip if not authenticated. Manual login required.

---

## Test Report Template

Copy this to document your test results:

```markdown
## Channel Filter Test Report

**Date**: YYYY-MM-DD
**Tester**: [Your Name]
**Environment**: Development / Production

### Test Results

| Test | Status | Notes |
|------|--------|-------|
| T1: Filter UI exists | ✅ / ❌ | |
| T2: Single channel select | ✅ / ❌ | |
| T3: Multiple channel select | ✅ / ❌ / N/A | |
| T4: Deselect channel | ✅ / ❌ | |
| T5: Clear all filters | ✅ / ❌ | |
| T6: Combined filters | ✅ / ❌ | |
| T7: Mobile viewport | ✅ / ❌ | |
| T8: Persistence | ✅ / ❌ / N/A | |

### Issues Found

1. [Issue description]
   - Severity: Critical / Medium / Low
   - Repro steps: ...
   - Expected: ...
   - Actual: ...
   - Screenshot: ...

### Browser Console Errors

\`\`\`
[Paste any console errors here]
\`\`\`

### Network Request Examples

\`\`\`
GET /messages?chat_ids=-1001234567890
Response: { "messages": [...], "total": 42 }
\`\`\`

### Overall Status

- ✅ All tests passed - Ready for production
- ⚠️  Minor issues found - Deploy with warnings
- ❌ Critical issues found - Do not deploy

### Recommendations

[Any recommendations for fixes or improvements]
```

---

## References

- **Root Cause Analysis**: `CHANNEL_FILTER_FIX.md`
- **Implementation Fix**: `frontend/src/hooks/useServerFilteredMessages.ts:60-62`
- **Backend Schema**: `backend/src/schemas/message.py:23`
- **E2E Test**: `frontend/tests/e2e/channel-filter.spec.ts`
- **Mobile Drawer Test**: `frontend/tests/e2e/mobile-filter-drawer.spec.ts`

---

**Last Updated**: 2025-12-24
