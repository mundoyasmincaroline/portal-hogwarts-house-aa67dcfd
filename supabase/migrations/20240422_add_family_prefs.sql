ALTER TABLE characters ADD COLUMN IF NOT EXISTS family_allow_siblings BOOLEAN DEFAULT true; ALTER TABLE characters ADD COLUMN IF NOT EXISTS family_allow_extended BOOLEAN DEFAULT true;
