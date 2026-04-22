<script lang="ts">
  
  interface Product {
    no?: string;
    title: string;
    desc: string;
    img: string;
    link?: string;
  }

  export let products: Product[] = [];
  export let onUpdate = (_newProducts: Product[]) => {};

  let isOpen = false;
  let isDownloading = ""; // Stores index of downloading item
  let message = "";

  async function downloadImage(url: string, filename: string, index: number) {
    if (!url || !url.startsWith('http')) return;
    isDownloading = index.toString();
    
    try {
      const response = await fetch('/_admin/download-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, filename })
      });
      const result = await response.json();
      if (result.path) {
        products[index].img = result.path;
        products = [...products];
        onUpdate(products);
      }
    } catch (e) {
      console.error("Gagal download gambar:", e);
    } finally {
      isDownloading = "";
    }
  }

  function handleImgInput(index: number) {
    const url = products[index].img;
    if (url && url.startsWith('http')) {
      downloadImage(url, products[index].title, index);
    }
  }

  async function deleteImageFile(path: string) {
    if (!path || !path.startsWith('/images/products/')) return;
    try {
      await fetch('/_admin/delete-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path })
      });
    } catch (e) {
      console.error("Gagal hapus file gambar:", e);
    }
  }

  async function cleanupUnusedImages() {
    if (!confirm("Hapus semua file gambar yang tidak dipakai di tabel?")) return;
    
    const activeImages = products.map(p => p.img).filter(img => img.startsWith('/images/products/'));
    
    try {
      const response = await fetch('/_admin/cleanup-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeImages })
      });
      const result = await response.json();
      if (result.success) {
        message = `✅ Berhasil hapus ${result.deletedCount} file sampah`;
        setTimeout(() => message = "", 3000);
      }
    } catch (e: any) {
      alert("Gagal cleanup: " + e.message);
    }
  }

  async function saveToServer() {
    try {
      const response = await fetch('/_admin/save-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(products)
      });
      if (response.ok) {
        message = "✅ Berhasil disimpan ke products.json";
        setTimeout(() => message = "", 3000);
      } else {
        throw new Error("Gagal menyimpan");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    }
  }



  function addManual() {
    const lastNo = products.length > 0 ? parseInt(products[products.length - 1].no || '0') : 0;
    const newNo = (lastNo + 1).toString().padStart(3, '0');
    
    const newProduct = {
      no: newNo,
      title: "Produk Baru",
      desc: "Deskripsi produk baru",
      img: "/images/placeholder.png",
      link: ""
    };
    
    products = [...products, newProduct];
    onUpdate(products);
  }

  async function importFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      
      if (!data.title) {
        throw new Error("Format JSON tidak valid (minimal harus ada title)");
      }

      const lastNo = products.length > 0 ? parseInt(products[products.length - 1].no || '0') : 0;
      const newNo = (lastNo + 1).toString().padStart(3, '0');

      const newProduct = {
        no: newNo,
        title: data.title,
        desc: data.desc || data.title, // Generate desc dari title jika kosong
        img: data.img || "/images/placeholder.png",
        link: data.link || "" // Tetap kosong jika tidak ada link
      };

      // Tambahkan ke list
      products = [...products, newProduct];
      const newIdx = products.length - 1;
      
      // Jika ada gambar eksternal, otomatis download
      if (newProduct.img.startsWith('http')) {
        await downloadImage(newProduct.img, newProduct.title, newIdx);
      }

      onUpdate(products);
      message = "✅ Berhasil import & generate data!";
      setTimeout(() => message = "", 3000);
    } catch (e: any) {
      alert("Gagal import: " + e.message);
    }
  }

  let selectedIndices: Set<number> = new Set();

  function toggleSelectAll(e: any) {
    if (e.target.checked) {
      selectedIndices = new Set(products.map((_, i) => i));
    } else {
      selectedIndices = new Set();
    }
    selectedIndices = selectedIndices;
  }

  function toggleSelect(idx: number) {
    if (selectedIndices.has(idx)) {
      selectedIndices.delete(idx);
    } else {
      selectedIndices.add(idx);
    }
    selectedIndices = selectedIndices;
  }

  async function deleteSelected() {
    if (selectedIndices.size === 0) return;
    if (confirm(`Hapus ${selectedIndices.size} produk terpilih beserta filenya?`)) {
      const toDelete = products.filter((_, i) => selectedIndices.has(i));
      
      // Hapus filenya satu per satu
      for (const product of toDelete) {
        if (product.img.startsWith('/images/products/')) {
          await deleteImageFile(product.img);
        }
      }

      products = products.filter((_, i) => !selectedIndices.has(i));
      selectedIndices = new Set();
      onUpdate(products);
    }
  }

  async function deleteProduct(idx: number) {
    if (confirm("Hapus produk ini beserta filenya?")) {
      const product = products[idx];
      if (product.img.startsWith('/images/products/')) {
        await deleteImageFile(product.img);
      }
      products = products.filter((_, i) => i !== idx);
      onUpdate(products);
    }
  }

  function toggleAdmin() {
    isOpen = !isOpen;
    selectedIndices = new Set();
  }
</script>

<div class="admin-trigger">
  <button on:click={toggleAdmin} class="btn-toggle">
    {isOpen ? 'Close Admin' : '⚙️ Admin Panel'}
  </button>
</div>

{#if isOpen}
<div class="admin-panel">
  <div class="admin-header">
    <h2>Admin Panel (Local Only)</h2>
    {#if message}
      <span class="msg">{message}</span>
    {/if}
    <button on:click={saveToServer} class="btn-save">SIMPAN KE FILE</button>
  </div>

  <div class="admin-actions">
    <button on:click={addManual} class="btn-manual">
      + Tambah Kosong
    </button>
    <button on:click={importFromClipboard} class="btn-import">
      📋 Import dari Scraper
    </button>
    {#if selectedIndices.size > 0}
      <button on:click={deleteSelected} class="btn-bulk-del">
        Hapus Terpilih ({selectedIndices.size})
      </button>
    {/if}
    <button on:click={cleanupUnusedImages} class="btn-cleanup" title="Hapus file gambar yang tidak ada di daftar">
      🧹 Cleanup Files
    </button>
  </div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          <th style="width: 40px;"><input type="checkbox" on:change={toggleSelectAll} checked={selectedIndices.size === products.length && products.length > 0} /></th>
          <th style="width: 60px;">No</th>
          <th style="width: 200px;">Title</th>
          <th>Description</th>
          <th>Image URL</th>
          <th>Link</th>
          <th style="width: 80px;">Aksi</th>
        </tr>
      </thead>
      <tbody>
        {#each products as product, i}
          <tr class={selectedIndices.has(i) ? 'selected' : ''}>
            <td><input type="checkbox" checked={selectedIndices.has(i)} on:change={() => toggleSelect(i)} /></td>
            <td><input type="text" bind:value={product.no} class="sm" /></td>
            <td><input type="text" bind:value={product.title} /></td>
            <td><input type="text" bind:value={product.desc} /></td>
            <td>
              <div class="img-input-group">
                <input 
                  type="text" 
                  bind:value={product.img} 
                  on:blur={() => handleImgInput(i)}
                  placeholder="Paste URL gambar..."
                />
                {#if isDownloading === i.toString()}
                  <span class="loading-spin">⌛</span>
                {/if}
              </div>
            </td>
            <td><input type="text" bind:value={product.link} /></td>
            <td>
              <button on:click={() => deleteProduct(i)} class="btn-del">Hapus</button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
{/if}

<style>
  .admin-trigger {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
  }
  .btn-toggle {
    background: #333;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 30px;
    cursor: pointer;
    box-shadow: 0 4px 10px rgba(0,0,0,0.3);
  }
  .admin-panel {
    position: fixed;
    top: 50px;
    left: 50px;
    right: 50px;
    bottom: 50px;
    background: white;
    z-index: 9998;
    border-radius: 20px;
    box-shadow: 0 0 50px rgba(0,0,0,0.5);
    display: flex;
    flex-direction: column;
    padding: 30px;
    color: #333;
    overflow: hidden;
  }
  .admin-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  .msg { color: green; font-weight: bold; }
  .btn-save {
    background: #27ae60;
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: bold;
  }
  .btn-manual {
    background: #3498db;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
  }
  .btn-import {
    background: #9b59b6;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
  }
  .admin-actions {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
    align-items: center;
  }
  .table-container {
    flex: 1;
    overflow-y: auto;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  th { text-align: left; padding: 10px; background: #f5f5f5; }
  td { padding: 5px; border-bottom: 1px solid #eee; }
  input {
    width: 100%;
    padding: 8px;
    border: 1px solid #eee;
    border-radius: 4px;
    font-size: 0.9rem;
  }
  input.sm { width: 50px; }
  .btn-del {
    background: #e74c3c;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 5px;
    cursor: pointer;
  }
  .loading-spin {
    font-size: 1.2rem;
    animation: spin 1s infinite linear;
  }
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .img-input-group {
    display: flex;
    gap: 5px;
    align-items: center;
  }
  .btn-bulk-del {
    background: #c0392b;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: bold;
  }
  .btn-cleanup {
    background: #7f8c8d;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 8px;
    cursor: pointer;
    margin-left: auto;
  }
  tr.selected td {
    background: #fff5f5;
  }
  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    cursor: pointer;
  }
</style>
