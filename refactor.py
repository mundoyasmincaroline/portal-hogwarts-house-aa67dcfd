import re, os

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

os.makedirs('src/routes', exist_ok=True)

lazy_imports = re.findall(r'const \w+ = lazy\(\(\) => import\(\".*?\"\)\);', content)

app_imports = ['Landing', 'Login', 'Register', 'DashboardLayout', 'Terms', 'Privacy', 'ParentsGuide', 'Support']

app_imports_str = []
dash_imports_str = []

for imp in lazy_imports:
    name = re.search(r'const (\w+) =', imp).group(1)
    if name in app_imports:
        app_imports_str.append(imp)
    else:
        imp = imp.replace('./pages/', '@/pages/')
        dash_imports_str.append(imp)

routes_match = re.search(r'(<Route path="/dashboard" element=\{[\s\S]*?\}>)([\s\S]*?)(</Route>)', content)
if routes_match:
    dash_routes = routes_match.group(2)

    dashboard_routes_file = f'''import {{ lazy }} from "react";
import {{ Route }} from "react-router-dom";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

{chr(10).join(dash_imports_str)}

export const DashboardRoutes = (
  <>
{dash_routes}
  </>
);
'''
    with open('src/routes/DashboardRoutes.tsx', 'w', encoding='utf-8') as f:
        f.write(dashboard_routes_file)

    new_content = re.sub(r'const \w+ = lazy\(\(\) => import\(\".*?\"\)\);\n?', '', content)
    imports_to_insert = '\n'.join(app_imports_str) + '\nimport { DashboardRoutes } from "@/routes/DashboardRoutes";\n'
    new_content = new_content.replace('// Critical Routes', '// Routes\n' + imports_to_insert)

    new_content = re.sub(
        r'(<Route path="/dashboard" element=\{[\s\S]*?\}>)[\s\S]*?(</Route>)',
        r'\1\n                  {DashboardRoutes}\n                \2',
        new_content
    )

    new_content = new_content.replace('// Lazy Routes\n', '')

    with open('src/App.tsx', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print('Successfully split App.tsx')
else:
    print('Failed to find dashboard routes')
