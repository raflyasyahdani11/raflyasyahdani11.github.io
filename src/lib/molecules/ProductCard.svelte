<script lang="ts">
  interface Product {
    no?: string;
    title: string;
    desc: string;
    img: string;
    link?: string;
  }

  export let product: Product;

  let copied = false;
  let copyTimeout: ReturnType<typeof setTimeout>;

  async function shareProduct() {
    const searchVal = product.no || product.title;
    const shareUrl = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(searchVal)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Cek produk pilihan ini: ${product.title}`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  }

  async function copyToClipboard(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
      clearTimeout(copyTimeout);
      copyTimeout = setTimeout(() => {
        copied = false;
      }, 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  }
</script>

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
      on:click|stopPropagation|preventDefault={shareProduct} 
      aria-label="Bagikan produk"
      title="Bagikan produk ini"
    >
      {#if copied}
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
