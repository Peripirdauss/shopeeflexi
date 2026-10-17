import fs from 'fs';
import { PDFParse } from 'pdf-parse';

const pdfs = [
  { country: 'BN', file: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/9f3cd7da247f1909.pdf' },
  { country: 'PH', file: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/75ef01a6819e2ba8.pdf' },
  { country: 'MY', file: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/541eb33ad2b59468.pdf' },
  { country: 'SG', file: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/6f054f17f03ef6b4.pdf' },
  { country: 'TH', file: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/d84339ef5d48ef44.pdf' },
];

for (const pdf of pdfs) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`COUNTRY: ${pdf.country}`);
  console.log(`${'='.repeat(80)}`);
  try {
    const buf = fs.readFileSync(pdf.file);
    const parser = new PDFParse();
    const data = await parser.loadPDF(buf);
    console.log(`Pages: ${data.numpages || 'N/A'}`);
    // Try to get text
    const text = data.text || (data.getText ? await data.getText() : JSON.stringify(Object.keys(data)));
    console.log(`---TEXT START---`);
    console.log(text);
    console.log(`---TEXT END---`);
  } catch (e) {
    console.error(`Error: ${e.message}`);
    console.error(e.stack);
  }
}
