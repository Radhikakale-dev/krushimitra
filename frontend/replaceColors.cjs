const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const replacements = {
  // Backgrounds
  'bg-dark-950': 'bg-background',
  'bg-dark-900': 'bg-surface',
  'bg-dark-800': 'bg-surface-hover',
  'bg-dark-850': 'bg-surface-hover', // mapping 850 to hover state
  'bg-slate-900': 'bg-surface',
  'bg-slate-800': 'bg-surface-hover',
  
  // Borders
  'border-slate-800': 'border-divider',
  'border-slate-700': 'border-divider',
  
  // Text
  'text-slate-200': 'text-content',
  'text-slate-300': 'text-content',
  'text-slate-400': 'text-content-muted',
  'text-slate-500': 'text-content-muted',
  'text-white': 'text-content', // This might be risky, but usually white is content base in dark mode
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      // Specifically avoid replacing text-white inside buttons which usually have colored backgrounds (e.g. bg-primary-500)
      // Since it's hard to parse perfectly with regex, we will replace text-white only if it's NOT inside a button-like or badge-like string.
      // Actually, to be safe, let's ONLY replace text-white when we are sure, or just replace it and manually fix buttons if they break.
      // Wait, primary buttons are usually text-white, and in light mode they should STILL be white!
      // Okay, let's REMOVE text-white from the automatic replacements to be safe.
      delete replacements['text-white'];
      
      for (const [oldClass, newClass] of Object.entries(replacements)) {
        // Use a regex to match whole words only (the class name)
        const regex = new RegExp(`(?<=['"\\\`\\\\s]|\\b)${oldClass}(?=['"\\\`\\\\s]|\\b)`, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, newClass);
          changed = true;
        }
      }

      if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated: ${fullPath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log('Color replacement complete!');
