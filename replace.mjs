import fs from 'fs';
import path from 'path';

const dir = 'e:/End_Sem_Project/slate_lms/src/components/landing';

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Regex replacements
  // text-[#FFFFFF] -> text-[var(--text)]
  content = content.replace(/text-\[#FFFFFF\]/g, 'text-[var(--text)]');
  // bg-[#FFFFFF] -> bg-[var(--white-surface)]
  content = content.replace(/bg-\[#FFFFFF\]/g, 'bg-[var(--white-surface)]');
  // text-[#0A0A0A] -> text-[var(--white-text)]
  content = content.replace(/text-\[#0A0A0A\]/g, 'text-[var(--white-text)]');
  
  // text-[#8E8E93] -> text-[var(--text-secondary)]
  content = content.replace(/text-\[#8E8E93\]/g, 'text-[var(--text-secondary)]');
  // text-[#48484A] -> text-[var(--text-muted)]
  content = content.replace(/text-\[#48484A\]/g, 'text-[var(--text-muted)]');
  
  // bg-[#0A0A0A] -> bg-[var(--bg)]
  content = content.replace(/bg-\[#0A0A0A\]/g, 'bg-[var(--bg)]');
  // bg-[#111111] -> bg-[var(--surface)]
  content = content.replace(/bg-\[#111111\]/g, 'bg-[var(--surface)]');
  // bg-[#1C1C1E] -> bg-[var(--surface-raised)]
  content = content.replace(/bg-\[#1C1C1E\]/g, 'bg-[var(--surface-raised)]');
  
  // borders
  content = content.replace(/border-\[rgba\(255,255,255,0\.0[78]\)\]/g, 'border-[var(--border)]');
  content = content.replace(/border-\[rgba\(255,255,255,0\.06\)\]/g, 'border-[var(--border)]');
  content = content.replace(/border-\[rgba\(255,255,255,0\.1[245]\)\]/g, 'border-[var(--border-hover)]');
  content = content.replace(/hover:bg-\[rgba\(255,255,255,0\.0[456]\)\]/g, 'hover:bg-[rgba(0,0,0,0.06)]');
  content = content.replace(/bg-\[rgba\(255,255,255,0\.05\)\]/g, 'bg-[rgba(0,0,0,0.05)]');
  
  // navbar specific scroll transforms
  content = content.replace(/'rgba\(10,10,10,0\)', 'rgba\(10,10,10,0\.72\)'/g, "'rgba(255,255,255,0)', 'rgba(255,255,255,0.80)'");
  content = content.replace(/'rgba\(255,255,255,0\)', 'rgba\(255,255,255,0\.08\)'/g, "'rgba(0,0,0,0)', 'var(--border)'");
  
  // Other white stuff
  content = content.replace(/hover:bg-\[#E5E5E5\]/g, 'hover:bg-[rgba(0,0,0,0.8)]');
  content = content.replace(/border-[#0A0A0A]/g, 'border-[var(--bg)]');
  
  // For the grid background in HeroSection
  content = content.replace(/rgba\(255,255,255,0\.03\)/g, 'rgba(0,0,0,0.05)');

  // For LiveBanner
  content = content.replace(/text-\[#FF5F57\]/g, 'text-[var(--traffic-red)]');
  content = content.replace(/text-\[#FEBC2E\]/g, 'text-[var(--traffic-yellow)]');
  content = content.replace(/text-\[#28C840\]/g, 'text-[var(--traffic-green)]');
  content = content.replace(/bg-\[#FF5F57\]/g, 'bg-[var(--traffic-red)]');
  content = content.replace(/bg-\[#FEBC2E\]/g, 'bg-[var(--traffic-yellow)]');
  content = content.replace(/bg-\[#28C840\]/g, 'bg-[var(--traffic-green)]');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.tsx')) {
    processFile(path.join(dir, file));
  }
}

// Process page.tsx
const pagePath = 'e:/End_Sem_Project/slate_lms/src/app/(public)/page.tsx';
if (fs.existsSync(pagePath)) {
  processFile(pagePath);
}

// Process layout.tsx
const layoutPath = 'e:/End_Sem_Project/slate_lms/src/app/(public)/layout.tsx';
if (fs.existsSync(layoutPath)) {
  processFile(layoutPath);
}

console.log("Done overwriting colors");
