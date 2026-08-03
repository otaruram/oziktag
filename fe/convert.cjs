const fs = require('fs');
let content = fs.readFileSync('src/styles.css', 'utf-8');
content = content.replace(/oklch\(([0-9.]+) 0 0\)/g, (match, l) => {
  const lightness = Math.round(parseFloat(l) * 100);
  return `hsl(0 0% ${lightness}%)`;
});
content = content.replace(/oklch\(0 0 0 \/ 0.1\)/g, 'rgba(0, 0, 0, 0.1)');
fs.writeFileSync('src/styles.css', content);
