import os
import re

migrations_dir = 'supabase/migrations'
files = [f for f in os.listdir(migrations_dir) if f.endswith('.sql')]

tables = set()
rls_enabled = set()

for file in files:
    with open(os.path.join(migrations_dir, file), 'r') as f:
        content = f.read()
        # Find all CREATE TABLE statements
        created = re.findall(r'CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(?:public\.)?(\w+)', content, re.IGNORECASE)
        tables.update(created)
        # Find all ENABLE RLS statements
        enabled = re.findall(r'ALTER TABLE\s+(?:public\.)?(\w+)\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY', content, re.IGNORECASE)
        rls_enabled.update(enabled)

no_rls = tables - rls_enabled
print("Tables without RLS:")
for t in sorted(no_rls):
    print(f"- {t}")
