const fs = require('fs');
const pdf = require('pdf-parse');

const pdfs = [
  { country: 'BN', file: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/9f3cd7da247f1909.pdf' },
  { country: 'PH', file: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/75ef01a6819e2ba8.pdf' },
  { country: 'MY', file: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/541eb33ad2b59468.pdf' },
  { country: 'SG', file: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/6f054f17f03ef6b4.pdf' },
  { country: 'TH', file: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/d84339ef5d48ef44.pdf' },
];

async function main() {
  for (const p of pdfs) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`COUNTRY: ${p.country}`);
    console.log(`${'='.repeat(80)}`);
    try {
      const buf = fs.readFileSync(p.file);
      const data = await pdf(buf);
      console.log(`Pages: ${data.numpages}`);
      console.log(`---TEXT START---`);
      console.log(data.text);
      console.log(`---TEXT END---`);
    } catch (e) {
      console.error(`Error: ${e.message}`);
    }
  }
}

main();
