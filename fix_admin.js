const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Admin.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const replacements = {
  'ðŸ”’': '🔒',
  'ðŸ‘¥': '👥',
  'â ³': '⏳',
  'âš”ï¸ ': '⚔️',
  'ðŸ °': '🏰',
  'âœ…': '✅',
  'ðŸš«': '🚫',
  'ðŸ“¹': '📹',
  'ðŸ’°': '💰',
  'ðŸ‘ ï¸ ': '👁️',
  'ðŸŸ¢': '🟢',
  'âšª': '⚪',
  'Ã¢Å“â€¦': '✅',
  'ðŸ§¹': '🧹',
  'âœ¨': '✨',
  'ðŸ“œ': '📜',
  'âœ•': '✖️',
  'âž•': '➕',
  'UsuÃ¡rios': 'Usuários',
  'Ãšltimo': 'Último',
  'MonetizaÃ§Ã£o': 'Monetização',
  'ModeraÃ§Ã£o': 'Moderação',
  'AprovaÃ§Ã£o': 'Aprovação',
  'ConfiguraÃ§Ãµes': 'Configurações',
  'AnÃºncio': 'Anúncio',
  'TÃ­tulo': 'Título',
  'DescriÃ§Ã£o': 'Descrição',
  'HistÃ³ria': 'História',
  'imprÃ³prias': 'impróprias',
  'comentÃ¡rios': 'comentários',
  'estÃ¡': 'está',
  'TransmissÃ£o': 'Transmissão',
  'PelÃºcia': 'Pelúcia',
  'SanguÃ­neo': 'Sanguíneo',
  'MÃ¡gico': 'Mágico',
  'Âº': 'º',
  'Ã¡rea': 'área',
  'Ã¡': 'á',
  'Ã©': 'é',
  'Ã³': 'ó',
  'Ãº': 'ú',
  'Ã­': 'í',
  'Ã£': 'ã',
  'Ãµ': 'õ',
  'Ã§': 'ç',
  'Ã‰': 'É',
  'Ã“': 'Ó',
  'Ãš': 'Ú',
  'Ã ': 'Í',
  'Ãƒ': 'Ã',
  'Ã•': 'Õ',
  'Ã‡': 'Ç'
};

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed encoding in Admin.tsx');
