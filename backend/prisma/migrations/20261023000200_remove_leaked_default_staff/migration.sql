-- Removes the other two default accounts from the old public seed script
-- (manager@xyz.com, agent@xyz.com), which shared the published password.
-- Same approach as the admin removal: access is cut off first, then the row is
-- deleted; if the account still owns records (clients, listings, deals, audit
-- history…) it stays disabled and anonymised so no business data is lost.
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id, email FROM "User" WHERE lower(email) IN ('manager@xyz.com', 'agent@xyz.com') LOOP
        UPDATE "User"
           SET "password" = NULL, "googleId" = NULL, "appleId" = NULL, "isActive" = false,
               "passwordResetToken" = NULL, "passwordResetExpiry" = NULL, "emailVerifyToken" = NULL,
               "email" = 'removed-' || id || '@removed.invalid'
         WHERE id = u.id;
        DELETE FROM "Notification" WHERE "userId" = u.id;
        BEGIN
            DELETE FROM "User" WHERE id = u.id;
            RAISE NOTICE 'Deleted default account % (%)', u.email, u.id;
        EXCEPTION WHEN foreign_key_violation THEN
            RAISE NOTICE '% (%) still owns records: disabled and anonymised instead of deleted', u.email, u.id;
        END;
    END LOOP;
END $$;
