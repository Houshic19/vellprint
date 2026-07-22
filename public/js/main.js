document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle
  const mobileMenu = document.getElementById('mobile-menu');
  const navbar = document.getElementById('navbar');

  if (mobileMenu && navbar) {
    mobileMenu.addEventListener('click', () => {
      navbar.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });
  }

  // Close nav on menu item click
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      if (navbar) navbar.classList.remove('active');
      if (mobileMenu) mobileMenu.classList.remove('open');
    });
  });

  // 2. Fixed Header Scroll Styling
  const header = document.querySelector('header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // 3. Custom Image Slider in Hero Section
  const slides = document.querySelectorAll('.slide');
  let currentSlide = 0;
  const slideInterval = 5000; // 5 seconds

  function nextSlide() {
    if (slides.length <= 1) return;
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }

  if (slides.length > 1) {
    setInterval(nextSlide, slideInterval);
  }

  // 4. Fetch and Render Offers with Staggered Animations
  const offersContainer = document.getElementById('offers-container');

  async function fetchOffers() {
    try {
      const response = await fetch(window.API_BASE_URL + '/api/offers');
      const data = await response.json();

      if (data.success && data.offers.length > 0) {
        offersContainer.innerHTML = '';
        data.offers.forEach((offer, index) => {
          const card = document.createElement('div');
          card.className = 'offer-card reveal-scale'; // reveal class

          const bgImage = offer.image_path ? `style="background-image: url('${offer.image_path}');"` : '';
          const whatsappUrl = `https://wa.me/919894833377?text=${encodeURIComponent(`Hi Vell Print Technology, I am interested in the offer: "${offer.title}" (${offer.discount}) enquired from your website.`)}`;
          
          card.innerHTML = `
            <a href="${whatsappUrl}" target="_blank" style="display:block; height:100%; color:inherit;">
              <div class="offer-img-wrapper" ${bgImage}>
                <span class="offer-badge">${offer.discount}</span>
              </div>
              <div class="offer-details">
                <h3>${offer.title}</h3>
                <p>${offer.description || ''}</p>
                <div class="offer-dates">
                  <span><i class="fa-regular fa-calendar"></i> Starts: ${offer.start_date || 'N/A'}</span>
                  <span>Ends: ${offer.end_date || 'N/A'}</span>
                </div>
              </div>
            </a>
          `;
          offersContainer.appendChild(card);
          
          // Trigger stagger entry animation
          setTimeout(() => {
            card.classList.add('active');
          }, index * 150);
        });
      } else {
        offersContainer.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
            <i class="fa-solid fa-tags" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
            <p>No active promotional offers right now. Check back soon!</p>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error fetching offers:', err);
      offersContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--color-primary);"></i>
          <p>Failed to retrieve active offers. Please reload the page.</p>
        </div>
      `;
    }
  }

  // 5. Fetch and Render Gallery Items with Staggered Animations
  const galleryContainer = document.getElementById('gallery-container');

  async function fetchGallery() {
    try {
      const response = await fetch(window.API_BASE_URL + '/api/gallery');
      const data = await response.json();

      if (data.success && data.items.length > 0) {
        galleryContainer.innerHTML = '';
        data.items.forEach((item, index) => {
          const div = document.createElement('div');
          div.className = 'gallery-item reveal'; // reveal class
          
          const whatsappUrl = `https://wa.me/919894833377?text=${encodeURIComponent(`Hi Vell Print Technology, I am interested in the production work: "${item.title}" seen in your website gallery.`)}`;
          
          div.innerHTML = `
            <a href="${whatsappUrl}" target="_blank" style="display:block; height:100%;">
              <img src="${item.image_path}" alt="${item.title}" class="gallery-img" onerror="this.src='https://images.unsplash.com/photo-1616400619175-5ebd30090406?auto=format&fit=crop&q=80&w=350'">
              <div class="gallery-overlay">
                <span class="gallery-title">${item.title}</span>
              </div>
            </a>
          `;
          galleryContainer.appendChild(div);

          // Trigger stagger entry animation
          setTimeout(() => {
            div.classList.add('active');
          }, index * 100);
        });
      } else {
        galleryContainer.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
            <i class="fa-regular fa-image" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
            <p>No photos uploaded to the gallery yet.</p>
          </div>
        `;
      }
    } catch (err) {
      console.error('Error fetching gallery:', err);
      galleryContainer.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <i class="fa-solid fa-triangle-exclamation" style="font-size: 2.5rem; margin-bottom: 1rem; color: var(--color-primary);"></i>
          <p>Failed to load gallery items.</p>
        </div>
      `;
    }
  }

  async function fetchTestimonials() {
    const testiGrid = document.getElementById('testimonials-grid');
    if (!testiGrid) return;
    try {
      const response = await fetch(window.API_BASE_URL + '/api/testimonials');
      const data = await response.json();
      if (data.success && data.testimonials.length > 0) {
        testiGrid.innerHTML = '';
        data.testimonials.forEach(t => {
          const stars = Array(t.rating).fill('<i class="fa-solid fa-star"></i>').join('');
          testiGrid.innerHTML += `
            <div class="service-card" style="padding:2.5rem;">
              <div style="color:var(--color-secondary); font-size:1.5rem; margin-bottom:1rem;">
                ${stars}
              </div>
              <p style="font-style:italic; line-height:1.6; color:var(--theme-text-muted); margin-bottom:1.5rem;">"${t.content}"</p>
              <strong style="font-size:0.9rem; color:var(--theme-text);">- ${t.name}, ${t.company}</strong>
            </div>
          `;
        });
      } else {
        testiGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--theme-text-muted);">
            <i class="fa-solid fa-star" style="font-size: 2.5rem; margin-bottom: 1rem;"></i>
            <p>No testimonials added yet.</p>
          </div>
        `;
      }
    } catch (err) {
      testiGrid.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--theme-text-muted);">
          <p>Failed to load testimonials.</p>
        </div>
      `;
    }
  }

  // Call API loaders
  fetchOffers();
  fetchGallery();
  fetchTestimonials();

  // 6. Scroll Reveal Intersection Observer Logic (Trendy dynamic reveals)
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
  
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          observer.unobserve(entry.target); // Stop tracking once revealed
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback if observer is not supported
    revealElements.forEach(el => el.classList.add('active'));
  }

  // 7. Form validation and Submission following Modern Forms guide
  const form = document.getElementById('contactForm');
  
  if (form) {
    const inputs = form.querySelectorAll('input, textarea, select');
    
    // Validate individual field
    function validateField(input) {
      const errorDiv = document.getElementById(`${input.id}-error`);
      if (!errorDiv) return true;

      // Reset
      errorDiv.textContent = '';
      
      if (input.validity.valid) {
        return true;
      }
      
      // Select appropriate error message
      if (input.validity.valueMissing) {
        errorDiv.textContent = 'This field is required.';
      } else if (input.validity.typeMismatch && input.type === 'email') {
        errorDiv.textContent = 'Please enter a valid email address.';
      } else if (input.validity.tooShort) {
        errorDiv.textContent = `Minimum length is ${input.minLength} characters.`;
      } else if (input.validity.patternMismatch && input.id === 'phone') {
        errorDiv.textContent = 'Please enter exactly 10 numeric digits.';
      } else {
        errorDiv.textContent = 'Invalid input value.';
      }
      
      return false;
    }

    // Attach event listeners for real-time validation (Validation Timing Matrix)
    inputs.forEach(input => {
      // Validate on blur (user exits the field)
      input.addEventListener('blur', () => {
        validateField(input);
      });

      // Clear errors on typing (non-intrusive)
      input.addEventListener('input', () => {
        const errorDiv = document.getElementById(`${input.id}-error`);
        if (errorDiv) errorDiv.textContent = '';
      });
    });

    // Handle form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      let isFormValid = true;
      inputs.forEach(input => {
        const isValid = validateField(input);
        if (!isValid) isFormValid = false;
      });

      if (!isFormValid) {
        // Focus first invalid element to assist screen readers
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      // If valid, disable submit button to prevent double-posts
      const submitBtn = document.getElementById('contactSubmitBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Submitting...';
      }

      // Gather form data
      const formData = new FormData(form);
      const data = {};
      formData.forEach((value, key) => data[key] = value);

      // Perform AJAX post simulation
      setTimeout(() => {
        alert('Thank you! Your inquiry has been sent. A Vell Print representative will contact you shortly.');
        form.reset();
        
        // Re-enable submit button
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Request a Quote';
        }
      }, 1500);
    });
  }

  // ============================================================
  // CALLBACK FORM HANDLER
  // ============================================================
  const callbackForm = document.getElementById('callbackForm');
  if (callbackForm) {
    callbackForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('cbName').value.trim();
      const phone = document.getElementById('cbPhone').value.trim();
      const btn = callbackForm.querySelector('button[type="submit"]');
      const oldHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Submitting...';
      btn.disabled = true;

      try {
        const res = await fetch(window.API_BASE_URL + '/api/callbacks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone })
        });
        const data = await res.json();
        if (data.success) {
          callbackForm.style.display = 'none';
          document.getElementById('callbackSuccess').style.display = 'block';
        } else {
          alert(data.message || 'Failed to submit callback request.');
          btn.innerHTML = oldHtml;
          btn.disabled = false;
        }
      } catch (err) {
        alert('Network error. Please try again.');
        btn.innerHTML = oldHtml;
        btn.disabled = false;
      }
    });
  }

  // ============================================================
  // BLOG PREVIEW SECTION (Homepage)
  // ============================================================
  const blogPreviewGrid = document.getElementById('blog-preview-grid');
  if (blogPreviewGrid) {
    (async function loadBlogPreviews() {
      try {
        const res = await fetch(window.API_BASE_URL + '/api/blog');
        const data = await res.json();
        if (data.success && data.posts.length > 0) {
          const posts = data.posts.slice(0, 3); // Show max 3
          blogPreviewGrid.innerHTML = '';
          posts.forEach((post, idx) => {
            const dateStr = new Date(post.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
            const card = document.createElement('a');
            card.href = '/blog/' + post.slug;
            card.className = 'offer-card reveal';
            card.style.cssText = 'text-decoration:none; display:flex; flex-direction:column; height:100%;';
            card.innerHTML = `
              <div class="offer-img-wrapper" style="background-image:url('${post.image_path}'); height:200px; background-size:cover; background-position:center;">
                <span class="offer-badge">${post.category}</span>
              </div>
              <div class="offer-details" style="padding:1.5rem; display:flex; flex-direction:column; flex-grow:1;">
                <h3 style="font-size:1.15rem; margin-bottom:0.5rem; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">${post.title}</h3>
                <p style="font-size:0.85rem; color:var(--theme-text-muted); display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical; overflow:hidden; margin-bottom:1rem; flex-grow:1;">${post.excerpt}</p>
                <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.75rem; color:var(--theme-text-muted); border-top:1px solid var(--theme-border); padding-top:0.75rem; margin-top:auto;">
                  <span><i class="fa-solid fa-user"></i> ${post.author}</span>
                  <span><i class="fa-solid fa-calendar"></i> ${dateStr}</span>
                </div>
              </div>
            `;
            blogPreviewGrid.appendChild(card);
            setTimeout(() => card.classList.add('active'), idx * 150);
          });
        } else {
          blogPreviewGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--theme-text-muted);"><p>No blog posts yet.</p></div>';
        }
      } catch (err) {
        blogPreviewGrid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--theme-text-muted);"><p>Unable to load blog posts.</p></div>';
      }
    })();
  }

  // ============================================================
  // Live WhatsApp Chat Integration
  // ============================================================
  (function initWhatsAppWidget() {
    // Avoid duplicate widgets if loaded multiple times
    if (document.getElementById('whatsapp-floating-widget')) return;

    // Detect if we are on a product page to pre-fill the message
    let initialMessage = "Hi Vell Print, I have a question about my account/order.";
    const productTitleEl = document.querySelector('#productTitle');
    if (productTitleEl && productTitleEl.textContent) {
      initialMessage = `Hi Vell Print, I have a question about: ${productTitleEl.textContent}`;
    }

    const encodedMessage = encodeURIComponent(initialMessage);
    const waUrl = `https://wa.me/919894833377?text=${encodedMessage}`;

    const waWidget = document.createElement('a');
    waWidget.id = 'whatsapp-floating-widget';
    waWidget.href = waUrl;
    waWidget.target = '_blank';
    waWidget.className = 'whatsapp-fab';
    waWidget.innerHTML = `
      <i class="fa-brands fa-whatsapp"></i>
    `;
    document.body.appendChild(waWidget);
  })();

  // ============================================================
  // Social Proof Toasts
  // ============================================================
  (function initSocialProof() {
    const products = ['HP Printhead', 'Epson Maintenance Box', 'Canon Ink Cartridge', 'Dell Laptop Battery', 'Networking Cable'];
    const cities = ['Chennai', 'Bangalore', 'Coimbatore', 'Madurai', 'Kochi', 'Hyderabad'];

    const toast = document.createElement('div');
    toast.className = 'social-toast';
    toast.innerHTML = `
      <div class="social-toast-icon"><i class="fa-solid fa-shopping-bag"></i></div>
      <div class="social-toast-text" id="social-toast-msg"></div>
    `;
    document.body.appendChild(toast);

    function showToast() {
      const p = products[Math.floor(Math.random() * products.length)];
      const c = cities[Math.floor(Math.random() * cities.length)];
      document.getElementById('social-toast-msg').innerHTML = `A dealer from <strong>${c}</strong> just enquired about <strong>${p}</strong>.<br><span>Just now</span>`;
      
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 5000);
    }

    // Trigger every 30-45 seconds
    setInterval(() => {
      showToast();
    }, 30000 + Math.random() * 15000);
  })();

  // ============================================================
  // Exit-Intent Callback Popup
  // ============================================================
  (function initExitIntent() {
    if (localStorage.getItem('vell_exit_intent_shown')) return;

    const modalHtml = `
      <div id="exit-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; align-items:center; justify-content:center;">
        <div style="background:var(--theme-card); padding:2rem; border-radius:12px; max-width:400px; width:90%; position:relative; text-align:center;">
          <button id="close-exit" style="position:absolute; top:10px; right:10px; background:transparent; border:none; font-size:1.5rem; cursor:pointer; color:var(--theme-text);">&times;</button>
          <h2 style="margin-bottom:1rem; color:var(--color-primary);"><i class="fa-solid fa-phone-volume"></i> Leaving so soon?</h2>
          <p style="margin-bottom:1.5rem; color:var(--theme-text-muted);">Need a custom bulk quote? Drop your number and our B2B sales team will call you back instantly with our best pricing!</p>
          <form id="exit-form" style="display:flex; flex-direction:column; gap:1rem;">
            <input type="text" id="exit-name" placeholder="Your Name" required style="padding:0.75rem; border:1px solid var(--theme-border); border-radius:4px; background:var(--theme-bg); color:var(--theme-text);">
            <input type="tel" id="exit-phone" placeholder="Your Phone Number" required style="padding:0.75rem; border:1px solid var(--theme-border); border-radius:4px; background:var(--theme-bg); color:var(--theme-text);">
            <button type="submit" class="cta-btn" style="width:100%;">Request Callback</button>
          </form>
          <p id="exit-success" style="display:none; color:hsl(120, 70%, 45%); margin-top:1rem; font-weight:bold;">We'll call you shortly!</p>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('exit-modal');
    const form = document.getElementById('exit-form');

    const handleMouseLeave = (e) => {
      if (e.clientY < 50) {
        modal.style.display = 'flex';
        localStorage.setItem('vell_exit_intent_shown', 'true');
        document.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
    
    // Only add listener on desktop
    if (window.innerWidth > 768) {
      document.addEventListener('mouseleave', handleMouseLeave);
    }

    document.getElementById('close-exit').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('exit-name').value;
      const phone = document.getElementById('exit-phone').value;

      try {
        await fetch(window.API_BASE_URL + '/api/callbacks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, message: 'Exit intent callback request' })
        });
        form.style.display = 'none';
        document.getElementById('exit-success').style.display = 'block';
        setTimeout(() => modal.style.display = 'none', 3000);
      } catch (err) {
        console.error('Exit intent error:', err);
      }
    });
  })();

});