const fs = require('fs');
const pdf = require('pdf-parse');

function render_page(pageData) {
  return pageData.getTextContent().then(function(textContent) {
    let lastY, text = '';
    for (let item of textContent.items) {
      if (lastY == item.transform[5] || !lastY) {
        text += ' ' + item.str;
      } else {
        text += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    return text;
  });
}

const pdfSources = {
  BN: {
    countryCode: 'BN',
    countryName: 'Brunei Darussalam',
    currency: 'MYR',
    sourceUrl: 'https://deo.shopeemobile.com/shopee/cms_cdn_bucket/c6c56a498471443eb6535e199e43cfaa_Rincian%20Biaya%20Pengiriman%20Ekspor%20Shopee%20FLEXI%20%20-%20BN.pdf',
    sourceFileName: 'c6c56a498471443eb6535e199e43cfaa_Rincian Biaya Pengiriman Ekspor Shopee FLEXI  - BN.pdf',
    version: '2024.1-official',
    effectiveDate: '2024-01-01',
    maxOrderWeightG: 30000,
    hasZones: false,
    zones: [{ code: 'ALL', name: 'Seluruh Brunei Darussalam' }]
  },
  PH: {
    countryCode: 'PH',
    countryName: 'Filipina',
    currency: 'PHP',
    sourceUrl: 'https://deo.shopeemobile.com/shopee/cms_cdn_bucket/c0a74d80a884495aa511fe0ff3fbf1e9_Rincian%20Biaya%20Pengiriman%20Ekspor%20Shopee%20FLEXI%20%20-%20PH.pdf',
    sourceFileName: 'c0a74d80a884495aa511fe0ff3fbf1e9_Rincian Biaya Pengiriman Ekspor Shopee FLEXI  - PH.pdf',
    version: '2024.1-official',
    effectiveDate: '2024-01-01',
    maxOrderWeightG: 30000,
    hasZones: true,
    zones: [
      { code: 'A', name: 'Zona A (Metro Manila)' },
      { code: 'BCD', name: 'Zona B, C, D (North/South Luzon, Visayas, dll)' }
    ]
  },
  MY: {
    countryCode: 'MY',
    countryName: 'Malaysia',
    currency: 'MYR',
    sourceUrl: 'https://deo.shopeemobile.com/shopee/cms_cdn_bucket/6a2816ad11b94d3d8be6e970752529cf_Rincian%20Biaya%20Pengiriman%20Ekspor%20Shopee%20FLEXI%20%20-%20MY.pdf',
    sourceFileName: '6a2816ad11b94d3d8be6e970752529cf_Rincian Biaya Pengiriman Ekspor Shopee FLEXI  - MY.pdf',
    version: '2024.1-official',
    effectiveDate: '2024-01-01',
    maxOrderWeightG: 30000,
    hasZones: true,
    zones: [
      { code: 'WEST', name: 'Malaysia Barat (Semenanjung)' },
      { code: 'EAST', name: 'Malaysia Timur (Sabah, Sarawak, Labuan)' }
    ]
  },
  SG: {
    countryCode: 'SG',
    countryName: 'Singapura',
    currency: 'SGD',
    sourceUrl: 'https://deo.shopeemobile.com/shopee/cms_cdn_bucket/2041b473607f403fae29e7c9eae2d7de_Rincian%20Biaya%20Pengiriman%20Ekspor%20Shopee%20FLEXI%20%20-%20SG.pdf',
    sourceFileName: '2041b473607f403fae29e7c9eae2d7de_Rincian Biaya Pengiriman Ekspor Shopee FLEXI  - SG.pdf',
    version: '2024.1-official',
    effectiveDate: '2024-01-01',
    maxOrderWeightG: 25000, // Official maximum checkout weight limit for SG is 25kg
    maxTariffWeightG: 30000,
    hasZones: false,
    zones: [{ code: 'ALL', name: 'Seluruh Singapura' }]
  },
  TH: {
    countryCode: 'TH',
    countryName: 'Thailand',
    currency: 'THB',
    sourceUrl: 'https://deo.shopeemobile.com/shopee/cms_cdn_bucket/86fc3c086a3c4eedb6a270ea6561e57c_Rincian%20Biaya%20Pengiriman%20Ekspor%20Shopee%20FLEXI%20%20-%20TH.pdf',
    sourceFileName: '86fc3c086a3c4eedb6a270ea6561e57c_Rincian Biaya Pengiriman Ekspor Shopee FLEXI  - TH.pdf',
    version: '2024.1-official',
    effectiveDate: '2024-01-01',
    maxOrderWeightG: 30000,
    hasZones: true,
    zones: [
      { code: 'A', name: 'Zona A (Bangkok, Nonthaburi, Pathum Thani, Samut Prakan)' },
      { code: 'B', name: 'Zona B (Provinsi Lainnya)' }
    ]
  }
};

const pdfFiles = {
  BN: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/9f3cd7da247f1909.pdf',
  SG: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/6f054f17f03ef6b4.pdf',
  MY: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/541eb33ad2b59468.pdf',
  TH: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/d84339ef5d48ef44.pdf',
  PH: '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/.tempmediaStorage/75ef01a6819e2ba8.pdf'
};

async function parseAll() {
  console.log('--- EXTRACTING BN ---');
  const bnBuf = fs.readFileSync(pdfFiles.BN);
  const bnData = await pdf(bnBuf, { pagerender: render_page });
  const bnLines = bnData.text.split('\n');
  const bnRates = [];
  for (let l of bnLines) {
    const parts = l.trim().split(/\s+/);
    if (parts.length === 4 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const weight = parseInt(parts[0]);
      const total = parseFloat(parts[1]);
      const buyer = parseFloat(parts[2]);
      const seller = parseFloat(parts[3]);
      bnRates.push({ weight, total, buyer, seller });
    }
  }
  console.log(`BN rows: ${bnRates.length}`);

  console.log('--- EXTRACTING SG ---');
  const sgBuf = fs.readFileSync(pdfFiles.SG);
  const sgData = await pdf(sgBuf, { pagerender: render_page });
  const sgLines = sgData.text.split('\n');
  const sgRates = [];
  for (let l of sgLines) {
    const parts = l.trim().split(/\s+/);
    if (parts.length === 4 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const weight = parseInt(parts[0]);
      const total = parseFloat(parts[1]);
      const buyer = parseFloat(parts[2]);
      const seller = parseFloat(parts[3]);
      sgRates.push({ weight, total, buyer, seller });
    }
  }
  console.log(`SG rows: ${sgRates.length}`);

  console.log('--- EXTRACTING MY ---');
  const myBuf = fs.readFileSync(pdfFiles.MY);
  const myData = await pdf(myBuf, { pagerender: render_page });
  const myLines = myData.text.split('\n');
  const myRates = [];
  for (let l of myLines) {
    const parts = l.trim().split(/\s+/);
    if (parts.length === 7 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const weight = parseInt(parts[0]);
      const westTotal = parseFloat(parts[1]);
      const westBuyer = parseFloat(parts[2]);
      const westSeller = parseFloat(parts[3]);
      const eastTotal = parseFloat(parts[4]);
      const eastBuyer = parseFloat(parts[5]);
      const eastSeller = parseFloat(parts[6]);
      myRates.push({
        weight,
        west: { total: westTotal, buyer: westBuyer, seller: westSeller },
        east: { total: eastTotal, buyer: eastBuyer, seller: eastSeller }
      });
    }
  }
  console.log(`MY rows: ${myRates.length}`);

  console.log('--- EXTRACTING TH ---');
  const thBuf = fs.readFileSync(pdfFiles.TH);
  const thData = await pdf(thBuf, { pagerender: render_page });
  const thLines = thData.text.split('\n');
  const thRates = [];
  for (let l of thLines) {
    const parts = l.trim().split(/\s+/);
    if (parts.length === 7 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const weight = parseInt(parts[0]);
      const zoneATotal = parseFloat(parts[1]);
      const zoneABuyer = parseFloat(parts[2]);
      const zoneASeller = parseFloat(parts[3]);
      const zoneBTotal = parseFloat(parts[4]);
      const zoneBBuyer = parseFloat(parts[5]);
      const zoneBSeller = parseFloat(parts[6]);
      thRates.push({
        weight,
        zoneA: { total: zoneATotal, buyer: zoneABuyer, seller: zoneASeller },
        zoneB: { total: zoneBTotal, buyer: zoneBBuyer, seller: zoneBSeller }
      });
    }
  }
  console.log(`TH rows: ${thRates.length}`);

  console.log('--- EXTRACTING PH ---');
  const phBuf = fs.readFileSync(pdfFiles.PH);
  const phData = await pdf(phBuf, { pagerender: render_page });
  const phLines = phData.text.split('\n');
  const phRates = [];
  for (let l of phLines) {
    const parts = l.trim().split(/\s+/);
    if (parts.length === 7 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const weight = parseInt(parts[0]);
      const zoneATotal = parseFloat(parts[1]);
      const zoneABuyer = parseFloat(parts[2]);
      const zoneASeller = parseFloat(parts[3]);
      const zoneBCDTotal = parseFloat(parts[4]);
      const zoneBCDBuyer = parseFloat(parts[5]);
      const zoneBCDSeller = parseFloat(parts[6]);
      phRates.push({
        weight,
        zoneA: { total: zoneATotal, buyer: zoneABuyer, seller: zoneASeller },
        zoneBCD: { total: zoneBCDTotal, buyer: zoneBCDBuyer, seller: zoneBCDSeller }
      });
    }
  }
  console.log(`PH rows: ${phRates.length}`);

  const counts = { BN: bnRates.length, SG: sgRates.length, MY: myRates.length, TH: thRates.length, PH: phRates.length };
  for (let [c, count] of Object.entries(counts)) {
    if (count !== 3000) {
      throw new Error(`Country ${c} expected 3000 rows but got ${count}`);
    }
  }

  const dataset = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalDestinations: 5,
      totalRowsPerDestination: 3000,
      totalRowsOverall: 15000,
      destinations: ['BN', 'PH', 'MY', 'SG', 'TH'],
      sources: pdfSources
    },
    tariffs: {
      BN: { info: pdfSources.BN, rates: bnRates },
      PH: { info: pdfSources.PH, rates: phRates },
      MY: { info: pdfSources.MY, rates: myRates },
      SG: { info: pdfSources.SG, rates: sgRates },
      TH: { info: pdfSources.TH, rates: thRates }
    }
  };

  const outputPath = '/Users/mac/.gemini/antigravity-ide/brain/4adee4b7-8a3b-477b-9826-12010abe3ecd/scratch/official_tariffs.json';
  fs.writeFileSync(outputPath, JSON.stringify(dataset, null, 2));
  console.log('SUCCESS! Wrote official_tariffs.json:', (fs.statSync(outputPath).size / 1024).toFixed(1), 'KB');
}

parseAll().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
