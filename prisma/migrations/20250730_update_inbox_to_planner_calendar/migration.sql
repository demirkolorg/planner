-- Migration to update "Gelen Kutusu" project name to "Planner Takvimi"
-- This migration updates existing projects and changes the emoji from 📥 to 📅
-- Also adds notes about Google Calendar integration

UPDATE "Project" 
SET "name" = 'Planner Takvimi', 
    "emoji" = '📅',
    "notes" = '🔄 Google Calendar ile otomatik senkronize olan özel proje. Google Calendar''daki etkinlikler buraya görev olarak aktarılır.'
WHERE "name" = 'Gelen Kutusu';

-- Also update any existing "Planner Takvimi" projects that might not have notes
UPDATE "Project" 
SET "notes" = '🔄 Google Calendar ile otomatik senkronize olan özel proje. Google Calendar''daki etkinlikler buraya görev olarak aktarılır.'
WHERE "name" = 'Planner Takvimi' AND ("notes" IS NULL OR "notes" = '');