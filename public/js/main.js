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

  // Call API loaders
  fetchOffers();
  fetchGallery();

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

});