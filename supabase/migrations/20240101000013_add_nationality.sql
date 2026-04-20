-- Add nationality column to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS nationality TEXT;
