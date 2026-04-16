<script lang="ts">
  import productsData from './lib/products.json';
  import instagramIcon from './assets/instagram.svg';
  import tiktokIcon from './assets/tiktok.svg';
  import youtubeIcon from './assets/youtube.svg';
  
  interface Product {
    no?: string;
    title: string;
    desc: string;
    img: string;
  }

  const products: Product[] = productsData;
  const curatorImg = '/images/curator.png';

  let searchQuery = "";
  let isSearching = false;
  let searchTimeout: ReturnType<typeof setTimeout>;
  let filteredProducts: Product[] = products;

  $: {
    isSearching = true;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      filteredProducts = products.filter(p => 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.no?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      isSearching = false;
    }, 350);
  }

  let currentPage = 1;
  const itemsPerPage = 4;

  $: totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  $: paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when searching
  $: if (searchQuery) currentPage = 1;

  const setPage = (p: number) => {
    if (p >= 1 && p <= totalPages) {
      currentPage = p;
      const el = document.getElementById('product-list');
      if (el) {
        // Adjusting for sticky header height (approx 120px)
        const offset = el.getBoundingClientRect().top + window.scrollY - 120;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    }
  };

</script>

<svelte:head>
  <title>The Faith of Affiliate | {searchQuery ? `Hasil Cari: ${searchQuery}` : 'Cari produk pilihan favoritmu'}</title>
  <meta name="description" content="Temukan koleksi produk pilihan terbaik mulai dari fashion, gadget, hingga dekorasi di The Faith of Affiliate." />
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
      <h2 class="curator-name">Raflya, Affiliate Curator</h2>
      <p class="curator-bio">
        Mencari barang-barang pilihan terbaik untukmu. Diulas with cinta, ikuti terus untuk lebih banyak inspirasi!
      </p>
      <div class="social-links">
        <span class="social-icon"><img src={instagramIcon} alt="Instagram" /></span>
        <span class="social-icon"><img src={tiktokIcon} alt="TikTok" /></span>
        <span class="social-icon"><img src={youtubeIcon} alt="YouTube" /></span>
      </div>
    </aside>

    <div class="content">
      <header class="header">
        <h1 class="sr-only">The Faith of Affiliate - Katalog Produk Terpercaya</h1>
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

      <div class="product-grid {isSearching ? 'searching' : ''}" id="product-list">
        {#each paginatedProducts as product}
          <div class="product-card">
            <div class="product-img-wrapper">
              <img 
                src={product.img} 
                alt={product.title} 
                class="product-img" 
                loading="lazy" 
                on:load={(e) => (e.target as HTMLImageElement).classList.add('loaded')}
              />
            </div>
            <div class="product-info">
              <h3 class="product-title">{product.title}</h3>
              <p class="product-desc">{product.desc}</p>
            </div>
            <button class="btn-check">CEK SEKARANG</button>
          </div>
        {/each}

        {#if filteredProducts.length === 0}
          <div class="no-results">
            <div class="no-results-icon">🌸</div>
            <h3>Produk tidak ditemukan</h3>
            <p>Ups! Sepertinya produk pink yang kamu cari belum tersedia. Coba kata kunci lain!</p>
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
              class="page-item {currentPage === i + 1 ? 'active' : ''}" 
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

<footer class="footer">
  <div class="footer-content">
    <div class="footer-top">
      <p style="font-size: 0.95rem;">© 2026 The Faith of Affiliate. Temukan produk favorit Anda! Ikuti kami:</p>
      <div class="social-links" style="gap: 15px;">
        <span class="social-icon" style="filter: brightness(0) invert(1)"><img src={instagramIcon} alt="Instagram" /></span>
        <span class="social-icon" style="filter: brightness(0) invert(1)"><img src={tiktokIcon} alt="TikTok" /></span>
        <span class="social-icon" style="filter: brightness(0) invert(1)"><img src={youtubeIcon} alt="YouTube" /></span>
      </div>
      <div class="footer-links">
        <a href="/" class="footer-link">Kebijakan Privasi</a>
        <a href="/" class="footer-link">Kontak</a>
      </div>
    </div>
  </div>
</footer>
