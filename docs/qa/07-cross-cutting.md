# Cross-Cutting Test Scenarios

## Overview
Test scenarios for security, performance, and accessibility that apply across all features.

---

## Security

### TS-SEC-001: Authentication required for all API endpoints
**Priority**: Critical
**Type**: Security

**Given** user is not authenticated
**When** accessing any protected endpoint (e.g., `/messages`, `/channels`)
**Then**
- API returns 401 Unauthorized or 403 Forbidden
- No data exposed
- Redirect to login (frontend)

---

### TS-SEC-002: JWT token validation
**Priority**: Critical
**Type**: Security

**Given** request has invalid/expired JWT token
**When** API request made
**Then**
- Request rejected with 401
- Error message indicates auth failure
- No data returned

---

### TS-SEC-003: XSS prevention in message display
**Priority**: Critical
**Type**: Security

**Given** message contains script tags or XSS payload
**When** message displayed in UI
**Then**
- Script not executed
- Content escaped/sanitized
- Safe display of raw text

**Test payload**: `<script>alert('xss')</script>`

---

### TS-SEC-004: XSS prevention in search
**Priority**: High
**Type**: Security

**Given** user enters XSS payload in search box
**When** search executed and results displayed
**Then**
- Payload not executed
- Search treats as literal text
- No JavaScript execution

---

### TS-SEC-005: Rate limiting enforcement
**Priority**: High
**Type**: Security

**Given** rate limits configured (3/5min auth, 1/hr fetch)
**When** limits exceeded
**Then**
- API returns 429 Too Many Requests
- Clear error message with retry time
- Limits reset after cooldown

---

### TS-SEC-006: Session invalidation on logout
**Priority**: High
**Type**: Security

**Given** user logs out
**When** attempting to use old token
**Then**
- Token no longer valid
- API rejects requests
- Must re-authenticate

---

### TS-SEC-007: HTTPS enforcement
**Priority**: Critical
**Type**: Security

**Given** user accesses app via HTTP
**When** page loads
**Then**
- Redirected to HTTPS
- All resources loaded over HTTPS
- No mixed content warnings

---

### TS-SEC-008: Sensitive data not in URL
**Priority**: High
**Type**: Security

**Given** authentication or sensitive operations
**When** examining browser history/URL bar
**Then**
- No tokens in URLs
- No passwords in query params
- Sensitive data in headers/body only

---

### TS-SEC-009: CORS configuration
**Priority**: High
**Type**: Security

**Given** request from unauthorized origin
**When** API request made
**Then**
- CORS error (blocked by browser)
- Only allowed origins work
- Credentials handled correctly

---

### TS-SEC-010: Phone number encryption verification
**Priority**: High
**Type**: Security

**Given** user registered with phone number
**When** examining database directly
**Then**
- Phone number encrypted (not plaintext)
- Decryption only with proper key
- Consistent encryption format

---

## Performance

### TS-PERF-001: Initial page load time
**Priority**: High
**Type**: Performance

**Given** user navigates to app
**When** measuring load time
**Then**
- First contentful paint < 2s
- Time to interactive < 4s
- No blocking resources

**Tools**: Lighthouse, Chrome DevTools

---

### TS-PERF-002: API response times
**Priority**: High
**Type**: Performance

**Given** authenticated user makes requests
**When** measuring API latency
**Then**
- `/health` < 200ms
- `/messages` (paginated) < 500ms
- `/messages/fetch/{id}` < 300ms

---

### TS-PERF-003: Search debouncing effectiveness
**Priority**: Medium
**Type**: Performance

**Given** user types in search box
**When** typing "telegram" (8 chars)
**Then**
- Only 1 API call made (after 300ms pause)
- Not 8 separate calls
- Network tab confirms debouncing

---

### TS-PERF-004: Pagination prevents overload
**Priority**: High
**Type**: Performance

**Given** user has 10,000+ messages
**When** loading message list
**Then**
- Initial load fetches limited batch (50-100)
- "Load more" for additional
- No full dataset loaded at once

---

### TS-PERF-005: Large list rendering
**Priority**: Medium
**Type**: Performance

**Given** message list with 500+ items
**When** scrolling through list
**Then**
- Smooth scrolling (60fps)
- No jank or stuttering
- Memory usage stable

---

### TS-PERF-006: Memory leak detection
**Priority**: Medium
**Type**: Performance

**Given** user navigates between pages repeatedly
**When** monitoring memory in DevTools
**Then**
- Memory stays stable
- No continuous growth
- Garbage collection working

---

### TS-PERF-007: Bundle size
**Priority**: Medium
**Type**: Performance

**Given** production build
**When** examining bundle
**Then**
- Main JS < 500KB gzipped (warning level)
- CSS < 50KB gzipped
- No unnecessary dependencies

---

## Accessibility

### TS-A11Y-001: Keyboard navigation - Login
**Priority**: High
**Type**: Accessibility

**Given** user using keyboard only
**When** navigating login page
**Then**
- Tab moves through all interactive elements
- Focus visible on current element
- Enter submits forms
- Logical tab order

---

### TS-A11Y-002: Keyboard navigation - Dashboard
**Priority**: High
**Type**: Accessibility

**Given** user using keyboard on dashboard
**When** navigating
**Then**
- Can reach all filters via Tab
- Can navigate message list
- Can access export and sync buttons
- Skip links available (optional)

---

### TS-A11Y-003: Focus management on modals
**Priority**: High
**Type**: Accessibility

**Given** modal/dialog opens
**When** using keyboard
**Then**
- Focus trapped inside modal
- Can Tab through modal controls
- Escape closes modal
- Focus returns to trigger on close

---

### TS-A11Y-004: Screen reader - Form labels
**Priority**: High
**Type**: Accessibility

**Given** screen reader user on login
**When** navigating form
**Then**
- Labels read correctly
- Required fields indicated
- Error messages announced

**Tools**: VoiceOver, NVDA

---

### TS-A11Y-005: Screen reader - Message list
**Priority**: Medium
**Type**: Accessibility

**Given** screen reader user on dashboard
**When** navigating messages
**Then**
- Message content read
- Metadata (sender, time) accessible
- List semantics correct

---

### TS-A11Y-006: Color contrast
**Priority**: High
**Type**: Accessibility

**Given** default theme
**When** checking contrast ratios
**Then**
- Text meets WCAG AA (4.5:1)
- Large text meets 3:1
- Interactive elements distinguishable

**Tools**: Lighthouse, axe DevTools

---

### TS-A11Y-007: Color contrast - Dark mode
**Priority**: Medium
**Type**: Accessibility

**Given** dark mode enabled
**When** checking contrast
**Then**
- Same standards as light mode
- Text readable on dark background
- No low-contrast elements

---

### TS-A11Y-008: Focus indicators visible
**Priority**: High
**Type**: Accessibility

**Given** keyboard navigation
**When** element is focused
**Then**
- Clear visual focus indicator
- Not relying on color alone
- Visible in both themes

---

### TS-A11Y-009: Error identification
**Priority**: High
**Type**: Accessibility

**Given** form validation error occurs
**When** error displays
**Then**
- Error associated with field (aria-describedby)
- Error text clear and actionable
- Not relying on color alone

---

### TS-A11Y-010: Responsive design - Touch targets
**Priority**: Medium
**Type**: Accessibility

**Given** mobile viewport
**When** interacting with buttons/links
**Then**
- Touch targets min 44x44px
- Adequate spacing between targets
- Easy to tap intended element

---

## Error Handling

### TS-ERR-001: Network error recovery
**Priority**: High
**Type**: Error

**Given** network connection lost
**When** user tries action
**Then**
- Clear error message
- Retry option available
- No crash or freeze

---

### TS-ERR-002: API error display
**Priority**: High
**Type**: Error

**Given** API returns 500 error
**When** error occurs
**Then**
- User-friendly error message
- Technical details hidden (or expandable)
- Action suggestions provided

---

### TS-ERR-003: Graceful degradation
**Priority**: Medium
**Type**: Error

**Given** optional feature fails (e.g., clustering API)
**When** user continues using app
**Then**
- Core features still work
- Clear indication of limited functionality
- No cascading failures

---

### TS-ERR-004: Error boundary catches React errors
**Priority**: High
**Type**: Error

**Given** React component throws error
**When** error occurs
**Then**
- Error boundary catches it
- Fallback UI displayed
- App doesn't crash entirely
- Error logged for debugging

---

### TS-ERR-005: Invalid route handling
**Priority**: Medium
**Type**: Error

**Given** user navigates to non-existent route
**When** 404 page loads
**Then**
- Clear "Page not found" message
- Navigation options provided
- No blank/broken page
