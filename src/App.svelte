<script lang="ts">
  import { tick } from "svelte";
  import productsData from "./lib/products.json";
  import instagramIcon from "./assets/instagram.svg";
  import threadsIcon from "./assets/threads.svg";
  import AdminPanel from "./lib/AdminPanel.svelte";
  import ProductCard from "./lib/molecules/ProductCard.svelte";
  import CuratorCard from "./lib/molecules/CuratorCard.svelte";
  
  const isDev = import.meta.env.DEV;
  
  interface Product {
    no?: string;
    title: string;
    desc: string;
    img: string;
    link?: string;
  }

  const products: Product[] = productsData;

  let searchQuery = "";
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    searchQuery = params.get("product") || "";
  }
  let isSearching = false;
  let searchTimeout: ReturnType<typeof setTimeout>;
  let productsList = products; // Local state for products
  let filteredProducts: Product[] = productsList;

  function handleAdminUpdate(newProducts: Product[]) {
    productsList = newProducts;
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
          url.searchParams.set("product", searchQuery);
        } else {
          url.searchParams.delete("product");
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
    <CuratorCard />

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
          <ProductCard {product} />
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
        <a href="https://www.threads.net/@raflyasyahdani11" target="_blank" rel="noopener noreferrer" class="social-icon" style="filter: brightness(0) invert(1)"><img src={threadsIcon} alt="Threads" /></a>
      </div>
      <div class="footer-links">
        <a href="/" class="footer-link">Kebijakan Privasi</a>
        <a href="/" class="footer-link">Kontak</a>
      </div>
    </div>
  </div>
</footer>
