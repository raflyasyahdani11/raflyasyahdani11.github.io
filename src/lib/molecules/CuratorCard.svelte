<script lang="ts">
  import instagramIcon from "../../assets/instagram.svg";
  import threadsIcon from "../../assets/threads.svg";

  export let curatorImg = "/images/3cc2cb34-25c8-480b-b590-ca330fdf9379.jpg";
  export let name = "Rumondang Raflya Syahdani Harahap";
  export let bio = "Mencari barang-barang pilihan terbaik untukmu. Diulas with cinta, ikuti terus untuk lebih banyak inspirasi!";
  export let instagramUrl = "https://instagram.com/raflyasyahdani11";
  export let threadsUrl = "https://www.threads.net/@raflyasyahdani11";
</script>

<aside class="curator-card">
  <img src={curatorImg} alt={name} class="curator-img" />
  <h2 class="curator-name">{name}</h2>
  <p class="curator-bio">
    {bio}
  </p>
  <div class="social-links">
    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" class="social-icon">
      <img src={instagramIcon} alt="Instagram" />
    </a>
    <a href={threadsUrl} target="_blank" rel="noopener noreferrer" class="social-icon">
      <img src={threadsIcon} alt="Threads" />
    </a>
  </div>
</aside>
