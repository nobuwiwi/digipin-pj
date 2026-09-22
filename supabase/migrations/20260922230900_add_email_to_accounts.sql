/*
  Add email column to accounts for email linkage (Device Transfer)
*/
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS email text UNIQUE;
