<script lang="ts">
  import { tick } from "svelte";
  import productsData from "./lib/products.json";
  import instagramIcon from "./assets/instagram.svg";
  import AdminPanel from "./lib/AdminPanel.svelte";
  
  const isDev = import.meta.env.DEV;
  
  interface Product {
    no?: string;
    title: string;
    desc: string;
    img: string;
    link?: string;
  }

  const products: Product[] = productsData;
  const curatorImg = "/images/3cc2cb34-25c8-480b-b590-ca330fdf9379.jpg";

  let searchQuery = "";
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    searchQuery = params.get("search") || "";
  }
  let isSearching = false;
  let searchTimeout: ReturnType<typeof setTimeout>;
  let productsList = products; // Local state for products
  let filteredProducts: Product[] = productsList;

  function handleAdminUpdate(newProducts: Product[]) {
    productsList = newProducts;
  }

  let copiedProductId: string | null = null;
  let copyTimeout: ReturnType<typeof setTimeout>;

  async function shareProduct(product: Product) {
    const searchVal = product.no || product.title;
    const shareUrl = `${window.location.origin}${window.location.pathname}?search=${encodeURIComponent(searchVal)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Cek produk pilihan ini: ${product.title}`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
        copyToClipboard(shareUrl, searchVal);
      }
    } else {
      copyToClipboard(shareUrl, searchVal);
    }
  }

  async function copyToClipboard(url: string, id: string) {
    try {
      await navigator.clipboard.writeText(url);
      copiedProductId = id;
      clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copiedProductId = null;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }

  $: {
    isSearching = true;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filteredProducts = productsList.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.no?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      isSearching = false;

      // Update URL query parameter
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (searchQuery) {
          url.searchParams.set("search", searchQuery);
        } else {
          url.searchParams.delete("search");
        }
        window.history.replaceState({}, "", url.toString());
      }
    }, 350);
  }

  let currentPage = 1;
  const itemsPerPage = 6;

  $: totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  $: paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when searching
  $: if (searchQuery) currentPage = 1;

  const setPage = async (p: number) => {
    if (p >= 1 && p <= totalPages) {
      currentPage = p;
      await tick();
      
      // Delay slightly to ensure iOS Safari has fully rendered/settled the DOM changes
      setTimeout(() => {
        const el = document.getElementById("product-list");
        if (el) {
          // Adjusting for sticky header height (approx 120px)
          const offset = el.getBoundingClientRect().top + window.scrollY - 120;
          window.scrollTo({ top: offset, behavior: "smooth" });
        }
      }, 50);
    }
  };

</script>

<svelte:head>
  <title>The Fate of Affiliate | {searchQuery ? `Hasil Cari: ${searchQuery}` : "Cari produk pilihan favoritmu"}</title>
  <meta name="description" content="Temukan koleksi produk pilihan terbaik mulai dari fashion, gadget, hingga dekorasi di The Fate of Affiliate." />
</svelte:head>

<div class="bg-decor">
  <div class="circle circle-1"></div>
  <div class="circle circle-2"></div>
  <div class="dots dots-1"></div>
  <div class="dots dots-2"></div>
</div>

<main class="container">
  <div class="main-layout">
    <aside class="curator-card">
      <img src={curatorImg} alt="Raflya" class="curator-img" />
      <h2 class="curator-name">Rumondang Raflya Syahdani Harahap</h2>
      <p class="curator-bio">
        Mencari barang-barang pilihan terbaik untukmu. Diulas with cinta, ikuti terus untuk lebih banyak inspirasi!
      </p>
      <div class="social-links">
        <a href="https://instagram.com/raflyasyahdani11" target="_blank" rel="noopener noreferrer" class="social-icon"><img src={instagramIcon} alt="Instagram" /></a>
      </div>
    </aside>

    <div class="content">
      <header class="header">
        <h1 class="sr-only">The Fate of Affiliate - Katalog Produk Terpercaya</h1>
        <div class="search-container">
          <span class="search-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </span>
          <input 
            type="text" 
            class="search-input" 
            placeholder="Cari produk pilihan favoritmu..." 
            bind:value={searchQuery}
          />
          {#if isSearching}
            <div class="search-loader"></div>
          {/if}
        </div>
      </header>

      <div class="product-grid {isSearching ? "searching" : ""}" id="product-list">
        {#each paginatedProducts as product}
          <div class="product-card">
             <div class="product-img-wrapper">
               <img 
                 src={product.img} 
                 alt={product.title} 
                 class="product-img" 
                 loading="lazy" 
                 on:load={(e) => (e.target as HTMLImageElement).classList.add("loaded")}
               />
               <button 
                 class="btn-share" 
                 on:click|stopPropagation|preventDefault={() => shareProduct(product)} 
                 aria-label="Bagikan produk"
                 title="Bagikan produk ini"
               >
                 {#if copiedProductId === (product.no || product.title)}
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                   <span class="tooltip">Tersalin!</span>
                 {:else}
                   <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                 {/if}
               </button>
             </div>
            <div class="product-info">
              <h3 class="product-title">{product.title}</h3>
              <p class="product-desc">{product.desc}</p>
            </div>
            <a href={product.link || "#"} target="_blank" rel="noopener noreferrer" class="btn-check" style="text-decoration: none; display: block; text-align: center;">
              CEK SEKARANG
            </a>
          </div>
        {/each}

        {#if filteredProducts.length === 0}
          <div class="no-results">
            <div class="no-results-icon">🤎</div>
            <h3>Produk tidak ditemukan</h3>
            <p>Ups! Sepertinya produk pilihan yang kamu cari belum tersedia. Coba kata kunci lain!</p>
          </div>
        {/if}
      </div>

      {#if totalPages > 1}
        <div class="pagination">
          <button 
            class="page-item" 
            on:click={() => setPage(currentPage - 1)} 
            disabled={currentPage === 1}
            aria-label="Previous Page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
          
          {#each Array(totalPages) as _, i}
            <button 
              class="page-item {currentPage === i + 1 ? "active" : ""}" 
              on:click={() => setPage(i + 1)}
            >
              {i + 1}
            </button>
          {/each}

          <button 
            class="page-item" 
            on:click={() => setPage(currentPage + 1)} 
            disabled={currentPage === totalPages}
            aria-label="Next Page"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      {/if}
    </div>
  </div>
</main>

{#if isDev}
  <AdminPanel bind:products={productsList} onUpdate={handleAdminUpdate} />
{/if}

<footer class="footer">
  <div class="footer-content">
    <div class="footer-top">
      <p style="font-size: 0.95rem;">© 2026 The Fate of Affiliate. Temukan produk favorit Anda! Ikuti kami:</p>
      <div class="social-links" style="gap: 15px;">
        <a href="https://instagram.com/raflyasyahdani11" target="_blank" rel="noopener noreferrer" class="social-icon" style="filter: brightness(0) invert(1)"><img src={instagramIcon} alt="Instagram" /></a>
      </div>
      <div class="footer-links">
        <a href="/" class="footer-link">Kebijakan Privasi</a>
        <a href="/" class="footer-link">Kontak</a>
      </div>
    </div>
  </div>
</footer>
