// Script to fix corrupted UTF-8 characters in Admin.tsx
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/Admin.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = [
  // Lock emoji: ðŸ"' -> 🔒
  ['\u00f0\u0178"\u2018', '\uD83D\uDD12'],
  // Hourglass: â³ -> ⏳
  ['\u00e2\u00b3', '\u23F3'],
  // Scroll emoji: ðŸ"œ -> 📜
  ['\u00f0\u0178"\u009c', '\uD83D\uDCDC'],
  // ✅ from Ã¢Å"â€¦
  ['\u00c3\u00a2\u00c5\u201c\u00e2\u20ac\u00a6', '\u2705'],
  // Green circle ðŸŸ¢ -> 🟢
  ['\u00f0\u0178\u0178\u00a2', '\uD83D\uDFE2'],
  // White circle âšª -> ⚪
  ['\u00e2\u0161\u00aa', '\u26AA'],
  // Peace: estÃ¡ -> está
  ['\u00e2st\u00c3\u00a1', 'está'],
];

for (const [from, to] of replacements) {
  content = content.split(from).join(to);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done! Fixed encoding in Admin.tsx');
