const { execSync } = require('child_process');
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const cmd = `"${edgePath}" --headless=new --dump-dom "https://johanneschristiantahun.github.io/Pokedex-mini/#/pokemon/bulbasaur"`;
try {
  const out = execSync(cmd, { encoding: 'utf8', timeout: 15000 });
  console.log('DOM length:', out.length);
  const hasModel = out.includes('model-viewer');
  const has3dText = out.includes('3D (360');
  const rootMatch = out.match(/<div id="root">([\s\S]*?)<\/div>\s*<\/body>/);
  console.log('Root content:', rootMatch ? rootMatch[1].slice(0, 500) : 'Not found');
  console.log('Full out sample:', out.slice(0, 1000));
} catch (err) {
  console.error('Exec error:', err.message);
}
