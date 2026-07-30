/**
 * Floating Bubble Product Discovery
 * 
 * Injects a floating overlay of bubbles that users can interact with
 * to discover promotional products.
 */

(async function initFloatingBubbles() {
  // 1. Configuration
  const CONFIG = {
    enabled: true,
    minBubbles: 6,
    maxBubbles: 15,
    minSize: 60,
    maxSize: 110,
    speedFactor: 0.5,
    autoHideTimeout: 10000, // 10 seconds
    colors: ['rgba(255, 65, 108, 0.2)', 'rgba(26, 115, 232, 0.2)', 'rgba(255, 179, 0, 0.2)']
  };

  // Check Accessibility Preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!CONFIG.enabled || prefersReducedMotion) {
    console.log("Floating bubbles disabled (or reduced motion preferred).");
    return;
  }

  // 2. Fetch Promotional Products
  let promotionalProducts = [];
  try {
    const res = await fetch(`${window.API_BASE_URL || ''}/api/products`);
    const data = await res.json();
    if (data.success && data.products) {
      // Filter for promotional (featured, popular, new arrival)
      promotionalProducts = data.products.filter(p => p.is_featured || p.is_popular || p.is_new_arrival);
      // Fallback to random products if no promos
      if (promotionalProducts.length === 0) {
        promotionalProducts = data.products.sort(() => 0.5 - Math.random()).slice(0, 10);
      }
    }
  } catch (err) {
    console.error("Failed to load products for bubbles:", err);
  }

  if (promotionalProducts.length === 0) return;

  // 3. Setup Overlay Container
  const overlay = document.createElement('div');
  overlay.id = 'bubble-overlay';
  document.body.appendChild(overlay);

  // Setup Card Overlay
  const cardOverlay = document.createElement('div');
  cardOverlay.className = 'bubble-card-overlay';
  cardOverlay.innerHTML = `
    <div class="bubble-card">
      <button class="bubble-card-close"><i class="fa-solid fa-xmark"></i></button>
      <div class="bubble-badge">Special Offer</div>
      <div class="bubble-card-img-wrapper">
        <img class="bubble-card-img" src="" alt="Product Image">
      </div>
      <h3 class="bubble-card-title">Product Name</h3>
      <div class="bubble-card-rating">
        <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star-half-stroke"></i>
        <span>4.8 (120 reviews)</span>
      </div>
      <div class="bubble-card-price-row">
        <span class="bubble-card-price">₹0</span>
      </div>
      <div class="bubble-card-actions">
        <a href="#" class="bubble-btn bubble-btn-secondary"><i class="fa-regular fa-heart"></i></a>
        <a href="#" class="bubble-btn bubble-btn-primary card-shop-link"><i class="fa-solid fa-cart-shopping"></i> Shop Now</a>
      </div>
    </div>
  `;
  document.body.appendChild(cardOverlay);

  const cardCloseBtn = cardOverlay.querySelector('.bubble-card-close');
  let cardTimeout;

  function closeCard() {
    cardOverlay.classList.remove('active');
    clearTimeout(cardTimeout);
    setTimeout(spawnSingleBubble, 1000); // Spawn a new bubble shortly after closing
  }

  cardCloseBtn.addEventListener('click', closeCard);
  cardOverlay.addEventListener('click', (e) => {
    if (e.target === cardOverlay) closeCard();
  });

  // 4. Bubble Physics Engine
  class Bubble {
    constructor() {
      this.size = Math.random() * (CONFIG.maxSize - CONFIG.minSize) + CONFIG.minSize;
      this.x = Math.random() * (window.innerWidth - this.size);
      this.y = Math.random() * (window.innerHeight - this.size);
      this.vx = (Math.random() - 0.5) * CONFIG.speedFactor;
      this.vy = (Math.random() - 0.5) * CONFIG.speedFactor;
      
      this.product = promotionalProducts[Math.floor(Math.random() * promotionalProducts.length)];
      
      this.el = document.createElement('div');
      this.el.className = 'floating-bubble bubble-wobble';
      this.el.style.width = `${this.size}px`;
      this.el.style.height = `${this.size}px`;
      
      // Setup Product Image inside Bubble
      const inner = document.createElement('div');
      inner.className = 'inner-content';
      if (this.product.image_path) {
        inner.style.backgroundImage = `url('${this.product.image_path}')`;
      } else {
        inner.innerHTML = '<i class="fa-solid fa-box" style="font-size:2rem; color: var(--color-primary)"></i>';
      }
      this.el.appendChild(inner);
      
      // Random glow color
      const glowColor = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
      this.el.style.boxShadow = `inset -5px -5px 15px rgba(255,255,255,0.4), inset 5px 5px 15px rgba(255,255,255,0.7), 0 0 20px ${glowColor}`;

      this.el.addEventListener('click', () => this.burst());
      
      overlay.appendChild(this.el);
    }

    update() {
      if (this.bursting) return;
      
      this.x += this.vx;
      this.y += this.vy;

      // Bounce off edges
      if (this.x <= 0 || this.x + this.size >= window.innerWidth) this.vx *= -1;
      if (this.y <= 0 || this.y + this.size >= window.innerHeight) this.vy *= -1;

      this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
    }

    burst() {
      this.bursting = true;
      this.el.classList.remove('bubble-wobble');
      this.el.classList.add('bubble-burst');
      
      // Generate sparks
      for(let i=0; i<8; i++) {
        const spark = document.createElement('div');
        spark.className = 'bubble-spark';
        spark.style.left = `${this.x + this.size/2}px`;
        spark.style.top = `${this.y + this.size/2}px`;
        
        const angle = (Math.PI * 2 / 8) * i;
        const dist = 50 + Math.random() * 50;
        spark.style.setProperty('--tx', `${Math.cos(angle) * dist}px`);
        spark.style.setProperty('--ty', `${Math.sin(angle) * dist}px`);
        
        overlay.appendChild(spark);
        setTimeout(() => spark.remove(), 600);
      }

      // Show Card Overlay
      setTimeout(() => {
        showProductCard(this.product);
        this.el.remove();
        bubbles = bubbles.filter(b => b !== this);
      }, 300);
    }
  }

  function showProductCard(product) {
    const img = cardOverlay.querySelector('.bubble-card-img');
    img.src = product.image_path || '/img/placeholder.jpg';
    
    cardOverlay.querySelector('.bubble-card-title').textContent = product.name;
    cardOverlay.querySelector('.bubble-card-price').textContent = product.price ? `₹${Number(product.price).toLocaleString('en-IN')}` : 'Ask for Price';
    
    // Set badge based on promo type
    let badgeText = "Special Offer";
    if (product.is_featured) badgeText = "Featured";
    if (product.is_new_arrival) badgeText = "New Arrival";
    if (product.is_popular) badgeText = "Best Seller";
    cardOverlay.querySelector('.bubble-badge').textContent = badgeText;
    
    // Setup Link
    const shopLink = cardOverlay.querySelector('.card-shop-link');
    shopLink.href = `/product.html?id=${product.id}`;
    
    cardOverlay.classList.add('active');

    // Auto-hide timeout
    clearTimeout(cardTimeout);
    cardTimeout = setTimeout(closeCard, CONFIG.autoHideTimeout);
  }

  let bubbles = [];
  function determineBubbleCount() {
    const w = window.innerWidth;
    if (w < 600) return 6;
    if (w < 1024) return 10;
    return CONFIG.maxBubbles;
  }

  function spawnSingleBubble() {
    const targetCount = determineBubbleCount();
    if (bubbles.length < targetCount) {
      bubbles.push(new Bubble());
    }
  }

  // Initialize bubbles
  const initialCount = determineBubbleCount();
  for (let i = 0; i < initialCount; i++) {
    bubbles.push(new Bubble());
  }

  // Animation Loop
  function animate() {
    bubbles.forEach(b => b.update());
    requestAnimationFrame(animate);
  }
  
  // Start engine
  requestAnimationFrame(animate);
  
  // Handle Resize
  window.addEventListener('resize', () => {
    const targetCount = determineBubbleCount();
    if (bubbles.length < targetCount) {
      spawnSingleBubble();
    } else if (bubbles.length > targetCount) {
      // Remove excess bubbles gently
      const excess = bubbles.pop();
      if(excess) excess.el.remove();
    }
  });

})();
