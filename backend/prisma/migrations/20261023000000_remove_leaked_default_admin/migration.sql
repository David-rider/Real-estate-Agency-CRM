-- Removes the default admin account (admin@xyz.com) whose password was
-- published in the old seed script. Access is cut off first; the row is then
-- deleted. If the account still owns records (clients, deals, audit history…)
-- it stays disabled and anonymised instead, so no business data is lost.
DO $$
DECLARE
    u RECORD;
BEGIN
    FOR u IN SELECT id FROM "User" WHERE lower(email) = 'admin@xyz.com' LOOP
        UPDATE "User"
           SET "password" = NULL, "googleId" = NULL, "appleId" = NULL, "isActive" = false,
               "passwordResetToken" = NULL, "passwordResetExpiry" = NULL, "emailVerifyToken" = NULL,
               "email" = 'removed-' || id || '@removed.invalid'
         WHERE id = u.id;
        DELETE FROM "Notification" WHERE "userId" = u.id;
        BEGIN
            DELETE FROM "User" WHERE id = u.id;
            RAISE NOTICE 'Deleted default account admin@xyz.com (%)', u.id;
        EXCEPTION WHEN foreign_key_violation THEN
            RAISE NOTICE 'admin@xyz.com (%) still owns records: disabled and anonymised instead of deleted', u.id;
        END;
    END LOOP;
END $$;
