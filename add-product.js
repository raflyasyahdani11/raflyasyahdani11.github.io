import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRODUCTS_PATH = path.join(__dirname, 'src', 'lib', 'products.json');

// Regex untuk mencari link di dalam teks
const URL_REGEX = /https?:\/\/[^\s]+/g;

async function fetchMetadata(url) {
  try {
    const apiUrl = `https://api.microlink.io?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl);
    const result = await response.json();

    if (result.status !== 'success') return null;

    const { data } = result;
    return {
      title: data.title || 'Produk Tanpa Nama',
      desc: data.description || 'Tidak ada deskripsi.',
      img: data.image?.url || data.logo?.url || 'https://via.placeholder.com/500?text=No+Image',
      link: url
    };
  } catch (error) {
    return null;
  }
}

async function processUrls(urls) {
  console.log(`🚀 Memulai proses untuk ${urls.length} link...\n`);
  
  // Baca data produk yang sudah ada sekali di awal
  let products = [];
  try {
    const fileData = fs.readFileSync(PRODUCTS_PATH, 'utf-8');
    products = JSON.parse(fileData);
  } catch (e) {
    products = [];
  }

  for (const url of urls) {
    console.log(`🔍 Memproses: ${url}...`);
    const metadata = await fetchMetadata(url);

    if (metadata) {
      const lastNo = products.length > 0 ? parseInt(products[products.length - 1].no) : 0;
      const newNo = (lastNo + 1).toString().padStart(3, '0');

      const newProduct = {
        no: newNo,
        ...metadata
      };

      products.push(newProduct);
      console.log(`✅ OK: ${metadata.title}`);
    } else {
      console.log(`❌ Gagal mengambil data untuk: ${url}`);
    }
  }

  // Simpan semua sekaligus ke file
  fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(products, null, 2), 'utf-8');
  console.log(`\n✨ SELESAI! ${urls.length} slot diproses.`);
}

const input = process.argv[2];

if (!input) {
  console.log('\nCara pakai:');
  console.log('1. Satu Link: node add-product.js <URL>');
  console.log('2. Lewat File: node add-product.js <FILE_PATH.txt>');
  process.exit(0);
}

// Cek apakah input adalah file
if (fs.existsSync(input) && fs.lstatSync(input).isFile()) {
  const content = fs.readFileSync(input, 'utf-8');
  const urls = content.match(URL_REGEX) || [];
  if (urls.length > 0) {
    processUrls([...new Set(urls)]); // Pakai Set untuk hapus duplikat
  } else {
    console.log('❌ Tidak ditemukan link di dalam file tersebut.');
  }
} else {
  // Input adalah link langsung
  const urls = input.match(URL_REGEX);
  if (urls) {
    processUrls([urls[0]]);
  } else {
    console.log('❌ Input bukan link atau path file yang valid.');
  }
}
