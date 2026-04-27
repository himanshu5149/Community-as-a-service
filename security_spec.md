# Security Specification - CaaS (Community as a Service)

## 1. Data Invariants
- A user can only post messages to groups they are aware of (isSignedIn).
- A user can only edit or delete their own messages (if enabled, current implementation is create-only).
- Poll votes are linked to the voter's UID to prevent duplicate votes.
- Moderation reports are immutable once created by a reporter.
- Gamification stats are only writable by the system or restricted logic (simulated in frontend for now, but rules will protect them).
- Spaces are collaborative; only members can update them.

## 2. The Dirty Dozen Payloads (Test Cases)

1. **Identity Spoofing**: Create a message with `userId` of another user.
2. **Shadow Field Injection**: Update a group with an unauthorized `isVerified: true` field.
3. **Orphaned Record**: Create a message in a non-existent group (if group ID is not validated).
4. **Denial of Wallet**: Create a document with a 1MB string as ID.
5. **PII Leak**: A non-admin reading another user's private stats or notifications.
6. **State Shortcutting**: Transitioning a report status directly from `pending` to `resolved` without being an admin.
7. **Recursive Write**: Attempting to batch a message write with an unauthorized points increment.
8. **Query Scraping**: Listing all reports without being an admin.
9. **Duplicate Voting**: Attempting to vote multiple times in a poll by bypassing client checks.
10. **Path Poisoning**: Using `../` or special characters in a document ID.
11. **Timestamp Spoofing**: Providing a `createdAt` value from 1970 instead of `request.time`.
12. **Unauthorized Privilege Escalation**: Adding oneself to an `admins` collection.

## 3. Test Runner (Draft)
A test runner would verify that all the above payloads return `PERMISSION_DENIED` using the Firebase Emulator.
