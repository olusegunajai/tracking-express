# Security Specification - Tokyo Express

## Data Invariants
1. **Admin Exclusive Write**: Only authenticated users with a valid record in the `users` collection (or designated as admin) can create, update, or delete any resource.
2. **Package Tracking**: Public users can READ a single package document if they know the tracking number, but they cannot LIST all packages.
3. **History Subcollection**: History entries are immutable once created and must link to a valid parent package.
4. **Tracking Number Uniqueness**: While Firestore doesn't enforce uniqueness constraints natively across documents without a transaction or specific ID structure, we will use the tracking number as the document ID for packages to enforce uniqueness.
5. **Schema Integrity**: All writes must conform to the type and size limits defined in `isValid[Entity]`.

## The Dirty Dozen Payloads

1. **Payload 1: Unauthenticated Package Creation**
   - Origin: Unauthenticated user
   - Goal: Create a package entry.
   - Expected: PERMISSION_DENIED

2. **Payload 2: Massive ID Injection**
   - Origin: Admin
   - Goal: Create a route with an ID string that is 1MB in size.
   - Expected: PERMISSION_DENIED (isValidId check)

3. **Payload 3: Shadow Update**
   - Origin: Admin
   - Goal: Add `isSystemVerified: true` to a package document.
   - Expected: PERMISSION_DENIED (hasOnly affectedKeys)

4. **Payload 4: Negative Weight Poisoning**
   - Origin: Admin
   - Goal: Create a package with `weight: -100`.
   - Expected: PERMISSION_DENIED (weight > 0 validation)

5. **Payload 5: History Orphan**
   - Origin: Admin
   - Goal: Add history entry to a non-existent package.
   - Expected: PERMISSION_DENIED (parent document check)

6. **Payload 6: Read-All Package Scrape**
   - Origin: Unauthenticated user
   - Goal: `list` all documents in the `packages` collection.
   - Expected: PERMISSION_DENIED (No blanket reads)

7. **Payload 7: Role Swapping**
   - Origin: Admin
   - Goal: Update an existing user's role to a non-existent role `super-admin`.
   - Expected: PERMISSION_DENIED (enum validation)

8. **Payload 8: Backdated History**
   - Origin: Admin
   - Goal: Force a `timestamp` in the past for a history entry.
   - Expected: PERMISSION_DENIED (request.time check)

9. **Payload 9: Content Hijack**
   - Origin: Authenticated but unauthorized user (simulated)
   - Goal: Update the "hero" section content.
   - Expected: PERMISSION_DENIED (Internal admin check)

10. **Payload 10: XSS in Section Name**
    - Origin: Admin
    - Goal: Create content section with name `<script>alert(1)</script>`.
    - Expected: PERMISSION_DENIED (Regex ID check)

11. **Payload 11: Bulk Status Leak**
    - Origin: Unauthenticated user
    - Goal: Query packages by status without knowing tracking numbers.
    - Expected: PERMISSION_DENIED (Secure list queries)

12. **Payload 12: Admin Self-Credential Update**
    - Origin: Authenticated user
    - Goal: Update `isAdmin` flag in a user profile if we had such a field (standard Identity integrity test).
    - Expected: PERMISSION_DENIED

## Test Plan
The `firestore.rules.test.ts` will verify these 12 scenarios using the `@firebase/rules-unit-testing` framework.
