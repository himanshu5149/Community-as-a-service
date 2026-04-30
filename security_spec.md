# Security Specification: CaaS (Community as a Service)

## 1. Data Invariants
- A `Channel` cannot exist without a valid `groupId`.
- A `Message` must belong to an existing `groupId` (and optionally `channelId`) that the user is a member of.
- A `Member` entry must have a `role` matching the allowed enum.
- `User` profiles (PII) like email can only be read by the owner or a super-admin.
- `points` and `level` can only be updated via recognized gamification actions (though we'll allow client-side updates for now, we should strictly gate the values).
- `Conversation` messages are strictly restricted to the two participants.

## 2. The "Dirty Dozen" Payloads (Attacker Strategy)

1.  **Identity Spoofing**: Attempting to create a `Message` with a different `userId`.
2.  **Shadow Field Injection**: Adding `isVerified: true` to a user profile update.
3.  **Privilege Escalation**: Attempting to set `role: 'admin'` during signup.
4.  **Resource Poisoning**: Sending a 1MB string as a `Message` text.
5.  **Relational Bypass**: Posting a message to a `groupId` the user isn't in.
6.  **Path variable poisoning**: Using a 1KB string as a `groupId` in a path.
7.  **PII Leak**: An authenticated user attempting to `get` another user's profile which contains sensitive fields.
8.  **Orphaned Channel**: Creating a channel in a group the user doesn't moderate.
9.  **Timestamp Fraud**: Sending a `createdAt` value from the future.
10. **State Shortcut**: Updating a report's status to 'dismissed' without being an admin.
11. **Direct Message Scraping**: Attempting to `list` messages of a `conversations` the user is not part of.
12. **Denial of Wallet**: Bombarding `ai_interactions` with high-frequency writes to drain quota.

## 3. The Test Runner Plan

We will simulate these scenarios using a test runner (logic in rules) to ensure they are denied.
- `isValidMessage` will check `request.auth.uid`.
- `affectedKeys().hasOnly()` will block shadow fields.
- `data.text.size() <= 5000` will prevent resource poisoning.
- `isGroupMember` lookup will prevent relational bypass.
