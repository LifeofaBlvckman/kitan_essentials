// Copies the browser builds of our libraries into public/vendor so the site
// can be hosted as plain static files (Netlify, Vercel, GitHub Pages…).
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const out = path.join(root, 'public', 'vendor');
const files = [
  ['node_modules/gsap/dist/gsap.min.js', 'gsap.min.js'],
  ['node_modules/gsap/dist/ScrollTrigger.min.js', 'ScrollTrigger.min.js'],
  ['node_modules/gsap/dist/SplitText.min.js', 'SplitText.min.js'],
  ['node_modules/lenis/dist/lenis.min.js', 'lenis.min.js'],
  ['node_modules/@supabase/supabase-js/dist/umd/supabase.js', 'supabase.min.js'],
];

fs.mkdirSync(out, { recursive: true });
for (const [from, to] of files) {
  fs.copyFileSync(path.join(root, from), path.join(out, to));
  console.log('vendor →', to);
}
