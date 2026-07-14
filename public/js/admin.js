document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const logoutWrapper = document.getElementById('logout-wrapper');
  const loginForm = document.getElementById('loginForm');
  const loginErrorAlert = document.getElementById('login-error-alert');
  
  let loggedInUser = localStorage.getItem('vell_admin_user');

  // Check auth state on load
  if (loggedInUser) {
    showDashboard();
  }

  // Utility: Export to CSV
  function exportToCSV(filename, rows) {
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  window.exportDealersCSV = async () => {
    try {
      const res = await fetch(window.API_BASE_URL + '/api/admin/dealers', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.dealers.length) {
        const rows = [["ID", "Business Name", "Owner Name", "Mobile", "GST", "Date"]];
        data.dealers.forEach(d => {
          rows.push([d.id, `"${d.business_name}"`, `"${d.owner_name}"`, d.mobile, d.gst_number || '', new Date(d.created_at).toLocaleDateString()]);
        });
        exportToCSV("dealers_export.csv", rows);
      }
    } catch(e) {}
  };

  window.exportEnquiriesCSV = async () => {
    try {
      const res = await fetch(window.API_BASE_URL + '/api/admin/enquiries', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.enquiries.length) {
        const rows = [["ID", "Business Name", "Dealer Name", "Phone", "Delivery Location", "Date"]];
        data.enquiries.forEach(e => {
          rows.push([e.id, `"${e.business_name}"`, `"${e.dealer_name}"`, e.phone, `"${e.delivery_location}"`, new Date(e.created_at).toLocaleDateString()]);
        });
        exportToCSV("enquiries_export.csv", rows);
      }
    } catch(e) {}
  };

  window.exportCallbacksCSV = async () => {
    try {
      const res = await fetch(window.API_BASE_URL + '/api/admin/callbacks', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.callbacks.length) {
        const rows = [["ID", "Name", "Phone", "Status", "Date"]];
        data.callbacks.forEach(c => {
          rows.push([c.id, `"${c.name}"`, c.phone, c.status, new Date(c.created_at).toLocaleDateString()]);
        });
        exportToCSV("callbacks_export.csv", rows);
      }
    } catch(e) {}
  };

  window.exportTicketsCSV = async () => {
    try {
      const res = await fetch(window.API_BASE_URL + '/api/admin/service-tickets', { credentials: 'include' });
      const data = await res.json();
      if (data.success && data.tickets.length) {
        const rows = [["ID", "Customer", "Equipment", "Issue", "Priority", "Status", "Date"]];
        data.tickets.forEach(t => {
          rows.push([t.id, `"${t.customer_name}"`, `"${t.equipment_type}"`, `"${t.issue_category}"`, t.priority, t.status, new Date(t.created_at).toLocaleDateString()]);
        });
        exportToCSV("tickets_export.csv", rows);
      }
    } catch(e) {}
  };

  // 1. Secure Authentication Login Form
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const usernameInput = document.getElementById('username');
      const passwordInput = document.getElementById('password');
      
      const usernameErr = document.getElementById('username-error');
      const passwordErr = document.getElementById('password-error');

      // Reset
      usernameErr.textContent = '';
      passwordErr.textContent = '';
      if (loginErrorAlert) {
        loginErrorAlert.textContent = '';
        loginErrorAlert.style.display = 'none';
      }

      let isValid = true;
      if (!usernameInput.value.trim()) {
        usernameErr.textContent = 'Username is required.';
        isValid = false;
      }
      if (!passwordInput.value.trim()) {
        passwordErr.textContent = 'Password is required.';
        isValid = false;
      }

      if (!isValid) return;

      const loginSubmitBtn = document.getElementById('loginSubmitBtn');
      loginSubmitBtn.disabled = true;
      loginSubmitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';

      try {
        const response = await fetch(window.API_BASE_URL + '/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: usernameInput.value.trim(),
            password: passwordInput.value
          })
        });

        const data = await response.json();

        if (data.success) {
          localStorage.setItem('vell_admin_user', data.username);
          showDashboard();
          loginForm.reset();
        } else {
          if (loginErrorAlert) {
            loginErrorAlert.textContent = data.message || 'Authentication failed.';
            loginErrorAlert.style.display = 'block';
          }
        }
      } catch (err) {
        console.error('Login error:', err);
        if (loginErrorAlert) {
          loginErrorAlert.textContent = 'Server connection error. Please try again.';
          loginErrorAlert.style.display = 'block';
        }
      } finally {
        loginSubmitBtn.disabled = false;
        loginSubmitBtn.innerHTML = '<i class="fa-solid fa-lock-open"></i> Authenticate Dashboard';
      }
    });
  }

  // Logout Handler
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      try {
        await fetch(window.API_BASE_URL + '/api/admin/logout', { method: 'POST', credentials: 'include' });
      } catch(e) {}
      localStorage.removeItem('vell_admin_user');
      location.reload();
    });
  }

  // 2. Dashboard UI transitions
  function showDashboard() {
    if (loginSection) loginSection.style.display = 'none';
    if (dashboardSection) {
      dashboardSection.style.display = 'block';
      dashboardSection.classList.add('active');
    }
    if (logoutWrapper) logoutWrapper.style.display = 'block';

    const userDisplay = document.getElementById('admin-user-display');
    if (userDisplay) {
      userDisplay.textContent = localStorage.getItem('vell_admin_user') || 'Admin';
    }

    // Load active dashboard data lists
    loadAdminOffers();
    loadAdminGallery();
    loadDashboardStats();
    loadMetadataFilters();
    loadAdminProducts();
    loadAdminDealers();
    loadAdminEnquiries();
    loadAdminCallbacks();
    loadAdminServiceTickets();
    loadAdminBlogPosts();
  }

  // Tab switching logic
  const tabButtons = document.querySelectorAll('.admin-nav-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetTab = btn.getAttribute('data-tab');
      const panels = document.querySelectorAll('.admin-panel');
      panels.forEach(panel => {
        panel.classList.remove('active');
        if (panel.id === targetTab) {
          panel.classList.add('active');
        }
      });
    });
  });

  // 3. Drag and Drop Upload Visualizers
  setupDragAndDrop('offer-upload-area', 'offerImage', 'offer-img-preview');
  setupDragAndDrop('gallery-upload-area', 'galleryImage', 'gallery-img-preview');
  setupDragAndDrop('product-upload-area', 'productImage', 'product-img-preview');

  function setupDragAndDrop(areaId, inputId, previewId) {
    const area = document.getElementById(areaId);
    const input = document.getElementById(inputId);
    const preview = document.getElementById(previewId);

    if (!area || !input) return;

    // Trigger input file click
    area.addEventListener('click', () => input.click());

    // Highlight area on drag events
    ['dragenter', 'dragover'].forEach(eventName => {
      area.addEventListener(eventName, (e) => {
        e.preventDefault();
        area.style.borderColor = 'var(--color-secondary)';
        area.style.background = 'rgba(244, 2, 140, 0.05)';
      }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      area.addEventListener(eventName, (e) => {
        e.preventDefault();
        area.style.borderColor = 'rgba(255,255,255,0.2)';
        area.style.background = 'rgba(255,255,255,0.02)';
      }, false);
    });

    // Handle dropped files
    area.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) {
        input.files = files;
        handleFilePreview(files[0], preview, area);
      }
    });

    // Handle input change
    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        handleFilePreview(input.files[0], preview, area);
      }
    });
  }

  function handleFilePreview(file, preview, area) {
    const reader = new FileReader();
    reader.onload = (e) => {
      preview.src = e.target.result;
      preview.style.display = 'block';
      
      const uploadIcon = area.querySelector('i');
      const uploadText = area.querySelector('p');
      if (uploadIcon) uploadIcon.style.display = 'none';
      if (uploadText) uploadText.textContent = `Selected: ${file.name}`;
    };
    reader.readAsDataURL(file);
  }

  // Reset drag and drop area indicators
  function resetUploadArea(areaId, previewId, placeholderText) {
    const area = document.getElementById(areaId);
    const preview = document.getElementById(previewId);
    if (!area || !preview) return;

    preview.style.display = 'none';
    preview.src = '';
    
    const uploadIcon = area.querySelector('i');
    const uploadText = area.querySelector('p');
    if (uploadIcon) uploadIcon.style.display = 'block';
    if (uploadText) uploadText.textContent = placeholderText;
  }

  // 4. Manage Offers (Fetch, Create, Delete)
  const adminOffersList = document.getElementById('admin-offers-list');
  const offerForm = document.getElementById('offerForm');

  async function loadAdminOffers() {
    if (!adminOffersList) return;
    try {
      const response = await fetch(window.API_BASE_URL + '/api/offers');
      const data = await response.json();

      if (data.success && data.offers.length > 0) {
        adminOffersList.innerHTML = '';
        data.offers.forEach(offer => {
          const div = document.createElement('div');
          div.className = 'admin-list-item';
          div.innerHTML = `
            <div class="admin-list-details">
              <h4>${offer.title}</h4>
              <p>${offer.discount} | Expires: ${offer.end_date || 'N/A'}</p>
            </div>
            <button class="delete-btn" data-id="${offer.id}"><i class="fa-regular fa-trash-can"></i> Delete</button>
          `;
          
          div.querySelector('.delete-btn').addEventListener('click', async (e) => {
            const offerId = e.target.getAttribute('data-id') || e.target.parentElement.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this offer?')) {
              await deleteOffer(offerId);
            }
          });

          adminOffersList.appendChild(div);
        });
      } else {
        adminOffersList.innerHTML = '<p style="color:var(--text-muted); padding: 1rem 0;">No active offers found.</p>';
      }
    } catch (err) {
      console.error('Error fetching admin offers:', err);
    }
  }

  async function deleteOffer(id) {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/admin/offers/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        loadAdminOffers();
        loadDashboardStats();
      } else {
        alert(data.message || 'Failed to delete offer.');
      }
    } catch (err) {
      console.error('Delete offer error:', err);
    }
  }

  if (offerForm) {
    offerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const titleInput = document.getElementById('offerTitle');
      const discountInput = document.getElementById('offerDiscount');
      const imageInput = document.getElementById('offerImage');
      
      const titleErr = document.getElementById('offerTitle-error');
      const discountErr = document.getElementById('offerDiscount-error');
      const imageErr = document.getElementById('offerImage-error');

      titleErr.textContent = '';
      discountErr.textContent = '';
      imageErr.textContent = '';

      let isValid = true;
      if (!titleInput.value.trim()) {
        titleErr.textContent = 'Title is required.';
        isValid = false;
      }
      if (!discountInput.value.trim()) {
        discountErr.textContent = 'Discount badge text is required.';
        isValid = false;
      }
      if (imageInput.files.length === 0) {
        imageErr.textContent = 'Banner image is required.';
        isValid = false;
      }

      if (!isValid) return;

      const submitBtn = document.getElementById('offerSubmitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';

      const formData = new FormData(offerForm);

      try {
        const response = await fetch(window.API_BASE_URL + '/api/admin/offers', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          offerForm.reset();
          resetUploadArea('offer-upload-area', 'offer-img-preview', 'Drag image here or click to upload');
          loadAdminOffers();
          loadDashboardStats();
          alert('Offer created successfully!');
        } else {
          alert(data.message || 'Failed to create offer.');
        }
      } catch (err) {
        console.error('Create offer error:', err);
        alert('Server error occurred during upload.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Publish Offer';
      }
    });
  }

  // 5. Manage Gallery (Fetch, Create, Delete)
  const adminGalleryList = document.getElementById('admin-gallery-list');
  const galleryForm = document.getElementById('galleryForm');

  async function loadAdminGallery() {
    if (!adminGalleryList) return;
    try {
      const response = await fetch(window.API_BASE_URL + '/api/gallery');
      const data = await response.json();

      if (data.success && data.items.length > 0) {
        adminGalleryList.innerHTML = '';
        data.items.forEach(item => {
          const div = document.createElement('div');
          div.className = 'admin-list-item';
          div.innerHTML = `
            <div class="admin-list-details">
              <h4>${item.title}</h4>
              <p>Uploaded: ${new Date(item.created_at).toLocaleDateString()}</p>
            </div>
            <button class="delete-btn" data-id="${item.id}"><i class="fa-regular fa-trash-can"></i> Delete</button>
          `;
          
          div.querySelector('.delete-btn').addEventListener('click', async (e) => {
            const itemId = e.target.getAttribute('data-id') || e.target.parentElement.getAttribute('data-id');
            if (confirm('Are you sure you want to delete this gallery item?')) {
              await deleteGalleryItem(itemId);
            }
          });

          adminGalleryList.appendChild(div);
        });
      } else {
        adminGalleryList.innerHTML = '<p style="color:var(--text-muted); padding: 1rem 0;">No photos in the gallery.</p>';
      }
    } catch (err) {
      console.error('Error fetching admin gallery:', err);
    }
  }

  async function deleteGalleryItem(id) {
    try {
      const response = await fetch(`${window.API_BASE_URL}/api/admin/gallery/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        loadAdminGallery();
      } else {
        alert(data.message || 'Failed to delete gallery item.');
      }
    } catch (err) {
      console.error('Delete gallery item error:', err);
    }
  }

  if (galleryForm) {
    galleryForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const titleInput = document.getElementById('galleryTitle');
      const imageInput = document.getElementById('galleryImage');
      
      const titleErr = document.getElementById('galleryTitle-error');
      const imageErr = document.getElementById('galleryImage-error');

      titleErr.textContent = '';
      imageErr.textContent = '';

      let isValid = true;
      if (!titleInput.value.trim()) {
        titleErr.textContent = 'Title is required.';
        isValid = false;
      }
      if (imageInput.files.length === 0) {
        imageErr.textContent = 'High-res image is required.';
        isValid = false;
      }

      if (!isValid) return;

      const submitBtn = document.getElementById('gallerySubmitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';

      const formData = new FormData(galleryForm);

      try {
        const response = await fetch(window.API_BASE_URL + '/api/admin/gallery', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });

        const data = await response.json();
        if (data.success) {
          galleryForm.reset();
          resetUploadArea('gallery-upload-area', 'gallery-img-preview', 'Drag photo here or click to upload');
          loadAdminGallery();
          alert('Gallery item uploaded successfully!');
        } else {
          alert(data.message || 'Failed to upload gallery item.');
        }
      } catch (err) {
        console.error('Upload gallery item error:', err);
        alert('Server error occurred during upload.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-circle-arrow-up"></i> Upload Photo';
      }
    });
  }

  // --- B2B MARKETPLACE DASHBOARD CODE ---

  const prodBrand = document.getElementById('prodBrand');
  const prodCategory = document.getElementById('prodCategory');
  const productForm = document.getElementById('productForm');
  const bulkProductForm = document.getElementById('bulkProductForm');
  const adminProductsList = document.getElementById('admin-products-list');
  const adminDealersList = document.getElementById('admin-dealers-list');
  const adminEnquiriesList = document.getElementById('admin-enquiries-list');

  // Stats
  async function loadDashboardStats() {
    try {
      const res = await fetch(window.API_BASE_URL + '/api/admin/dashboard/stats', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        document.getElementById('stat-products').textContent = data.stats.totalProducts;
        document.getElementById('stat-dealers').textContent = `${data.stats.totalDealers} (${data.stats.pendingDealers} pending)`;
        document.getElementById('stat-enquiries').textContent = data.stats.totalEnquiries;
        const statCb = document.getElementById('stat-callbacks');
        if (statCb) statCb.textContent = data.stats.totalCallbacks || 0;
        const statTk = document.getElementById('stat-tickets');
        if (statTk) statTk.textContent = `${data.stats.totalTickets || 0} (${data.stats.openTickets || 0} open)`;
        const statBl = document.getElementById('stat-blog');
        if (statBl) statBl.textContent = data.stats.totalBlogPosts || 0;

        // Render Chart.js
        if (window.Chart && document.getElementById('analyticsChart')) {
          const ctx = document.getElementById('analyticsChart').getContext('2d');
          if (window.analyticsChartInstance) {
            window.analyticsChartInstance.destroy();
          }
          window.analyticsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['Products', 'Dealers', 'Enquiries', 'Callbacks', 'Tickets', 'Blog Posts'],
              datasets: [{
                label: 'System Metrics',
                data: [
                  data.stats.totalProducts || 0,
                  data.stats.totalDealers || 0,
                  data.stats.totalEnquiries || 0,
                  data.stats.totalCallbacks || 0,
                  data.stats.totalTickets || 0,
                  data.stats.totalBlogPosts || 0
                ],
                backgroundColor: [
                  'rgba(54, 162, 235, 0.6)',
                  'rgba(75, 192, 192, 0.6)',
                  'rgba(255, 206, 86, 0.6)',
                  'rgba(153, 102, 255, 0.6)',
                  'rgba(255, 99, 132, 0.6)',
                  'rgba(201, 203, 207, 0.6)'
                ],
                borderColor: [
                  'rgb(54, 162, 235)',
                  'rgb(75, 192, 192)',
                  'rgb(255, 206, 86)',
                  'rgb(153, 102, 255)',
                  'rgb(255, 99, 132)',
                  'rgb(201, 203, 207)'
                ],
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              scales: {
                y: { beginAtZero: true }
              }
            }
          });
        }
      }
    } catch (e) {
      console.error('Stats loading error', e);
    }
  }

  // Filters Options
  async function loadMetadataFilters() {
    if (!prodBrand || !prodCategory) return;
    try {
      const res = await fetch(window.API_BASE_URL + '/api/store/metadata');
      const data = await res.json();
      if (data.success) {
        prodBrand.innerHTML = '<option value="">Select brand...</option>';
        prodCategory.innerHTML = '<option value="">Select category...</option>';
        
        data.brands.forEach(b => {
          prodBrand.innerHTML += `<option value="${b.id}">${b.name}</option>`;
        });
        data.categories.forEach(c => {
          prodCategory.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Products
  async function loadAdminProducts() {
    if (!adminProductsList) return;
    try {
      const res = await fetch(window.API_BASE_URL + '/api/products');
      const data = await res.json();
      if (data.success && data.products.length > 0) {
        adminProductsList.innerHTML = '';
        data.products.forEach(p => {
          const div = document.createElement('div');
          div.className = 'admin-list-item';
          div.innerHTML = `
            <div class="admin-list-details">
              <h4>${p.name}</h4>
              <p>${p.brand_name} | Part: ${p.part_number || 'N/A'} | SKU: ${p.sku || 'N/A'}</p>
            </div>
            <button class="delete-btn" data-id="${p.id}"><i class="fa-regular fa-trash-can"></i> Delete</button>
          `;

          div.querySelector('.delete-btn').addEventListener('click', async () => {
            if (confirm(`Delete product "${p.name}"?`)) {
              await deleteProduct(p.id);
            }
          });
          adminProductsList.appendChild(div);
        });
      } else {
        adminProductsList.innerHTML = '<p style="color:var(--text-muted); padding:1rem 0;">No spare products in catalog.</p>';
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function deleteProduct(id) {
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/products/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        loadAdminProducts();
        loadDashboardStats();
      } else {
        alert('Failed to delete product.');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Submit Product Form
  if (productForm) {
    productForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const name = document.getElementById('prodName').value.trim();
      const seo_url = document.getElementById('prodSeoUrl').value.trim();
      
      if (!name || !seo_url) {
        alert('Name and SEO URL are required.');
        return;
      }

      const submitBtn = document.getElementById('prodSubmitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving spare...';

      const formData = new FormData(productForm);

      try {
        const res = await fetch(window.API_BASE_URL + '/api/admin/products', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          productForm.reset();
          resetUploadArea('product-upload-area', 'product-img-preview', 'Click or drag image to upload');
          loadAdminProducts();
          loadDashboardStats();
          alert('Product added to catalog!');
        } else {
          alert(data.message || 'Failed to add product.');
        }
      } catch (err) {
        console.error(err);
        alert('Network error adding product.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-box-archive"></i> Add Spare Product';
      }
    });
  }

  // Bulk CSV Upload Form
  if (bulkProductForm) {
    bulkProductForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fileInput = document.getElementById('csvFile');
      if (fileInput.files.length === 0) return;

      const submitBtn = document.getElementById('bulkSubmitBtn');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading CSV...';

      const formData = new FormData(bulkProductForm);

      try {
        const res = await fetch(window.API_BASE_URL + '/api/admin/products/bulk', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          bulkProductForm.reset();
          loadAdminProducts();
          loadDashboardStats();
          alert(data.message);
        } else {
          alert(data.message || 'CSV Import failed.');
        }
      } catch (e) {
        console.error(e);
        alert('Network error bulk uploading CSV.');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-file-import"></i> Upload & Import Catalog';
      }
    });
  }

  // Dealers
  async function loadAdminDealers() {
    if (!adminDealersList) return;
    try {
      const res = await fetch(window.API_BASE_URL + '/api/admin/dealers', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.dealers.length > 0) {
        adminDealersList.innerHTML = '';
        data.dealers.forEach(d => {
          const card = document.createElement('div');
          card.style.background = 'var(--theme-card)';
          card.style.border = '1px solid var(--theme-border)';
          card.style.padding = '1.5rem';
          card.style.borderRadius = 'var(--border-radius-md)';
          card.style.display = 'flex';
          card.style.justifyContent = 'space-between';
          card.style.alignItems = 'center';
          card.style.flexWrap = 'wrap';
          card.style.gap = '1rem';

          const actionHtml = d.status === 'PENDING' ? `
            <button class="cta-btn approve-dealer-btn" data-id="${d.id}" style="background:hsl(120, 70%, 40%); font-size:0.8rem; padding:0.4rem 0.8rem; box-shadow:none;"><i class="fa-solid fa-check"></i> Approve Partner</button>
          ` : `<span style="font-size:0.8rem; font-weight:700; color:hsl(120,70%,45%);"><i class="fa-solid fa-circle-check"></i> Approved</span>`;

          card.innerHTML = `
            <div style="font-size:0.9rem; line-height:1.5;">
              <h4 style="font-size:1.1rem; color:var(--theme-text);">${d.business_name}</h4>
              <p><strong>Rep:</strong> ${d.dealer_name} | <strong>Mobile:</strong> ${d.phone} | <strong>Email:</strong> ${d.email}</p>
              <p><strong>GST:</strong> ${d.gst || 'N/A'} | <strong>PAN:</strong> ${d.pan || 'N/A'} | <strong>Type:</strong> ${d.business_type}</p>
              <p><strong>Address:</strong> ${d.address}, ${d.city}, ${d.state} - ${d.pincode}</p>
            </div>
            <div>
              ${actionHtml}
            </div>
          `;

          if (d.status === 'PENDING') {
            card.querySelector('.approve-dealer-btn').addEventListener('click', async () => {
              await approveDealer(d.id);
            });
          }

          adminDealersList.appendChild(card);
        });
      } else {
        adminDealersList.innerHTML = '<p style="color:var(--text-muted);">No dealer registrations found.</p>';
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function approveDealer(id) {
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/dealers/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'APPROVED' })
      });
      const data = await res.json();
      if (data.success) {
        loadAdminDealers();
        loadDashboardStats();
      } else {
        alert('Failed to update dealer status.');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Enquiries
  async function loadAdminEnquiries() {
    if (!adminEnquiriesList) return;
    try {
      const res = await fetch(window.API_BASE_URL + '/api/admin/enquiries', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.enquiries.length > 0) {
        adminEnquiriesList.innerHTML = '';
        data.enquiries.forEach(e => {
          const card = document.createElement('div');
          card.style.background = 'var(--theme-card)';
          card.style.border = '1px solid var(--theme-border)';
          card.style.padding = '1.5rem';
          card.style.borderRadius = 'var(--border-radius-md)';
          card.style.lineHeight = '1.6';
          card.style.fontSize = '0.9rem';

          card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; border-bottom:1px solid var(--theme-border); padding-bottom:0.75rem; margin-bottom:0.75rem;">
              <h4 style="font-size:1.1rem; color:var(--theme-text);">${e.business_name}</h4>
              <span style="font-size:0.8rem; color:var(--theme-text-muted);">${new Date(e.created_at).toLocaleString()}</span>
            </div>
            <p><strong>Dealer Rep:</strong> ${e.dealer_name} | <strong>Mobile:</strong> ${e.phone} | <strong>GST:</strong> ${e.gst || 'N/A'}</p>
            <p><strong>Delivery Target:</strong> ${e.delivery_location}</p>
            <p style="background:var(--theme-bg); padding:0.75rem; border-radius:4px; border:1px solid var(--theme-border); margin:0.5rem 0;"><strong>Requested Items:</strong> ${e.items_summary}</p>
            <p><strong>Remarks:</strong> <em>${e.remarks || 'None'}</em></p>
            <div style="margin-top: 1rem; border-top: 1px solid var(--theme-border); padding-top: 1rem; text-align: right;">
              <a href="/quote.html?id=${e.id}" target="_blank" class="admin-cta-btn" style="display:inline-block; padding:0.5rem 1rem; font-size:0.8rem;"><i class="fa-solid fa-file-invoice"></i> Generate Quote</a>
            </div>
          `;
          adminEnquiriesList.appendChild(card);
        });
      } else {
        adminEnquiriesList.innerHTML = '<p style="color:var(--text-muted);">No enquiries logs logged yet.</p>';
      }
    } catch (e) {
      console.error(e);
    }
  }

  // ============================================================
  // CALLBACK REQUESTS ADMIN
  // ============================================================
  async function loadAdminCallbacks() {
    const listEl = document.getElementById('admin-callbacks-list');
    if (!listEl) return;
    try {
      const res = await fetch(window.API_BASE_URL + '/api/admin/callbacks', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.callbacks.length > 0) {
        listEl.innerHTML = data.callbacks.map(cb => {
          const dt = new Date(cb.created_at).toLocaleString('en-IN');
          return `<div class="service-card" style="padding:1rem 1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
            <div>
              <strong style="font-size:1rem;"><i class="fa-solid fa-user"></i> ${cb.name}</strong>
              <p style="font-size:0.85rem; color:var(--theme-text-muted); margin-top:0.25rem;"><i class="fa-solid fa-phone"></i> <a href="tel:${cb.phone}" style="color:var(--color-primary); font-weight:700;">${cb.phone}</a></p>
            </div>
            <span style="font-size:0.75rem; color:var(--theme-text-muted);"><i class="fa-solid fa-clock"></i> ${dt}</span>
          </div>`;
        }).join('');
      } else {
        listEl.innerHTML = '<p style="color:var(--theme-text-muted); text-align:center;">No callback requests yet.</p>';
      }
    } catch (e) {
      listEl.innerHTML = '<p style="color:hsl(0,75%,50%);">Failed to load callbacks.</p>';
    }
  }

  // ============================================================
  // SERVICE TICKETS ADMIN
  // ============================================================
  async function loadAdminServiceTickets() {
    const listEl = document.getElementById('admin-tickets-list');
    if (!listEl) return;
    try {
      const res = await fetch(window.API_BASE_URL + '/api/admin/service-tickets', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success && data.tickets.length > 0) {
        listEl.innerHTML = data.tickets.map(t => {
          const dt = new Date(t.created_at).toLocaleString('en-IN');
          const statusColors = { 'Open': 'hsl(0,75%,50%)', 'In Progress': 'hsl(40,90%,45%)', 'Resolved': 'hsl(120,60%,35%)', 'Closed': 'var(--theme-text-muted)' };
          const statusColor = statusColors[t.status] || 'var(--theme-text-muted)';
          return `<div class="service-card" style="padding:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:start; flex-wrap:wrap; gap:1rem; margin-bottom:1rem;">
              <div>
                <h4 style="font-size:1rem;"><i class="fa-solid fa-user"></i> ${t.customer_name} ${t.company ? '(' + t.company + ')' : ''}</h4>
                <p style="font-size:0.85rem; color:var(--theme-text-muted); margin-top:0.25rem;"><i class="fa-solid fa-phone"></i> ${t.phone} ${t.email ? '| <i class="fa-solid fa-envelope"></i> ' + t.email : ''}</p>
              </div>
              <span style="padding:0.35rem 1rem; border-radius:999px; font-size:0.75rem; font-weight:700; color:white; background:${statusColor};">${t.status}</span>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.5rem; font-size:0.85rem; margin-bottom:1rem;">
              <span><strong>Type:</strong> ${t.equipment_type}</span>
              <span><strong>Brand:</strong> ${t.brand || 'N/A'}</span>
              <span><strong>Model:</strong> ${t.model_number || 'N/A'}</span>
              <span><strong>Issue:</strong> ${t.issue_category}</span>
              <span><strong>Priority:</strong> ${t.priority}</span>
              <span><strong>Date:</strong> ${t.preferred_date || 'Flexible'}</span>
            </div>
            <p style="font-size:0.85rem; padding:1rem; background:var(--theme-input-bg); border-radius:var(--border-radius-md); margin-bottom:1rem;"><strong>Description:</strong> ${t.description}</p>
            <div style="display:flex; gap:0.5rem; flex-wrap:wrap; align-items:center;">
              <span style="font-size:0.75rem; color:var(--theme-text-muted);"><i class="fa-solid fa-clock"></i> ${dt} | Ref: #VPT-${String(t.id).padStart(4, '0')}</span>
              <div style="margin-left:auto; display:flex; gap:0.5rem;">
                ${t.status !== 'In Progress' ? `<button onclick="updateTicketStatus(${t.id}, 'In Progress')" class="cta-btn" style="padding:0.35rem 0.75rem; font-size:0.7rem; background:hsl(40,90%,45%);"><i class="fa-solid fa-wrench"></i> In Progress</button>` : ''}
                ${t.status !== 'Resolved' ? `<button onclick="updateTicketStatus(${t.id}, 'Resolved')" class="cta-btn" style="padding:0.35rem 0.75rem; font-size:0.7rem; background:hsl(120,60%,35%);"><i class="fa-solid fa-check"></i> Resolve</button>` : ''}
                ${t.status !== 'Closed' ? `<button onclick="updateTicketStatus(${t.id}, 'Closed')" class="cta-btn" style="padding:0.35rem 0.75rem; font-size:0.7rem; background:var(--theme-text-muted);"><i class="fa-solid fa-xmark"></i> Close</button>` : ''}
              </div>
            </div>
          </div>`;
        }).join('');
      } else {
        listEl.innerHTML = '<p style="color:var(--theme-text-muted); text-align:center;">No service tickets yet.</p>';
      }
    } catch (e) {
      listEl.innerHTML = '<p style="color:hsl(0,75%,50%);">Failed to load tickets.</p>';
    }
  }

  // Make updateTicketStatus global
  window.updateTicketStatus = async function(id, status) {
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/service-tickets/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        loadAdminServiceTickets();
        loadDashboardStats();
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert('Failed to update ticket status.');
    }
  };

  // ============================================================
  // BLOG POSTS ADMIN
  // ============================================================
  async function loadAdminBlogPosts() {
    const listEl = document.getElementById('admin-blog-list');
    if (!listEl) return;
    try {
      const res = await fetch(window.API_BASE_URL + '/api/blog');
      const data = await res.json();
      if (data.success && data.posts.length > 0) {
        listEl.innerHTML = data.posts.map(p => {
          const dt = new Date(p.created_at).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' });
          return `<div class="service-card" style="padding:1rem 1.5rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;">
            <div style="flex:1;">
              <strong style="font-size:0.95rem;">${p.title}</strong>
              <p style="font-size:0.75rem; color:var(--theme-text-muted); margin-top:0.25rem;"><span style="background:var(--color-primary); color:white; padding:0.15rem 0.5rem; border-radius:999px; font-size:0.65rem; font-weight:700;">${p.category}</span> &nbsp; ${dt} &nbsp; by ${p.author}</p>
            </div>
            <div style="display:flex; gap:0.5rem;">
              <a href="/blog/${p.slug}" target="_blank" class="cta-btn cta-btn-outline" style="padding:0.35rem 0.75rem; font-size:0.7rem;"><i class="fa-solid fa-eye"></i> View</a>
              <button onclick="deleteBlogPost(${p.id})" class="cta-btn" style="padding:0.35rem 0.75rem; font-size:0.7rem; background:hsl(0,75%,50%);"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`;
        }).join('');
      } else {
        listEl.innerHTML = '<p style="color:var(--theme-text-muted); text-align:center;">No blog posts yet.</p>';
      }
    } catch (e) {
      listEl.innerHTML = '<p style="color:hsl(0,75%,50%);">Failed to load blog posts.</p>';
    }
  }

  // Blog form submission
  const blogForm = document.getElementById('blogForm');
  if (blogForm) {
    blogForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(blogForm);
      const btn = blogForm.querySelector('button[type="submit"]');
      const oldHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing...';
      btn.disabled = true;

      try {
        const res = await fetch(window.API_BASE_URL + '/api/admin/blog', {
          method: 'POST',
          credentials: 'include',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          blogForm.reset();
          loadAdminBlogPosts();
          loadDashboardStats();
          alert('Blog post published successfully!');
        } else {
          alert(data.message || 'Failed to create blog post.');
        }
      } catch (err) {
        alert('Network error.');
      } finally {
        btn.innerHTML = oldHtml;
        btn.disabled = false;
      }
    });

    // Auto-generate slug from title
    const blogTitle = document.getElementById('blogTitle');
    const blogSlug = document.getElementById('blogSlug');
    if (blogTitle && blogSlug) {
      blogTitle.addEventListener('input', () => {
        blogSlug.value = blogTitle.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      });
    }
  }

  // Make deleteBlogPost global
  window.deleteBlogPost = async function(id) {
    if (!confirm('Delete this blog post?')) return;
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/blog/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        loadAdminBlogPosts();
        loadDashboardStats();
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert('Failed to delete blog post.');
    }
  };
  // ============================================================
  // TESTIMONIALS ADMIN
  // ============================================================
  async function loadAdminTestimonials() {
    const listEl = document.getElementById('admin-testimonials-list');
    if (!listEl) return;
    try {
      const res = await fetch(window.API_BASE_URL + '/api/testimonials');
      const data = await res.json();
      if (data.success && data.testimonials.length > 0) {
        listEl.innerHTML = data.testimonials.map(t => {
          return `
          <div style="background:var(--theme-card); border:1px solid var(--theme-border); padding:1rem; border-radius:4px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <h4 style="margin:0; font-size:1rem; color:var(--theme-text);">${t.name} <span style="font-size:0.8rem; color:var(--theme-text-muted); font-weight:normal;">- ${t.company}</span></h4>
              <p style="margin:0.25rem 0 0 0; font-size:0.85rem; color:var(--theme-text-muted);">${t.rating} Stars | ${new Date(t.created_at).toLocaleDateString()}</p>
              <p style="margin:0.5rem 0 0 0; font-size:0.9rem; max-width:500px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">"${t.content}"</p>
            </div>
            <div>
              <button onclick="deleteTestimonial(${t.id})" class="cta-btn" style="padding:0.35rem 0.75rem; font-size:0.7rem; background:hsl(0,75%,50%);"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>`;
        }).join('');
      } else {
        listEl.innerHTML = '<p style="color:var(--theme-text-muted); text-align:center;">No testimonials added yet.</p>';
      }
    } catch (e) {
      listEl.innerHTML = '<p style="color:hsl(0,75%,50%);">Failed to load testimonials.</p>';
    }
  }

  const testimonialForm = document.getElementById('testimonialForm');
  if (testimonialForm) {
    testimonialForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = testimonialForm.querySelector('button[type="submit"]');
      const oldHtml = btn.innerHTML;
      btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Adding...';
      btn.disabled = true;

      const body = {
        name: document.getElementById('testiName').value,
        company: document.getElementById('testiCompany').value,
        rating: document.getElementById('testiRating').value,
        content: document.getElementById('testiContent').value
      };

      try {
        const res = await fetch(window.API_BASE_URL + '/api/admin/testimonials', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        const data = await res.json();
        if (data.success) {
          testimonialForm.reset();
          loadAdminTestimonials();
        } else {
          alert(data.message || 'Failed to add testimonial.');
        }
      } catch (err) {
        alert('Network error.');
      } finally {
        btn.innerHTML = oldHtml;
        btn.disabled = false;
      }
    });
  }

  window.deleteTestimonial = async function(id) {
    if (!confirm('Delete this testimonial?')) return;
    try {
      const res = await fetch(`${window.API_BASE_URL}/api/admin/testimonials/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await res.json();
      if (data.success) {
        loadAdminTestimonials();
      } else {
        alert(data.message);
      }
    } catch (e) {
      alert('Failed to delete testimonial.');
    }
  };

  // Add loadAdminTestimonials to showDashboard initialization
  const originalShowDashboard = showDashboard;
  showDashboard = function() {
    originalShowDashboard();
    loadAdminTestimonials();
  };

});
