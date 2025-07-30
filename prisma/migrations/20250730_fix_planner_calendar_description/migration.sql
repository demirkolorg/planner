-- Migration to fix "Planner Takvimi" project description
-- Updates the description to correctly explain that only Google Calendar events are imported to this project

UPDATE "Project" 
SET "notes" = '🔄 Google Calendar ile otomatik senkronize olan özel proje. Google Calendar''daki etkinlikler buraya görev olarak aktarılır.'
WHERE "name" = 'Planner Takvimi';