export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const domain = url.origin;
  
  // API base URL for fetching product data
  const apiBaseUrl = env.API_BASE_URL || 'https://api.vellprint.in';

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Core Static Pages -->
  <url>
    <loc>${domain}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/store</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/service</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/brochure</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${domain}/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
`;

  try {
    // Fetch all products (no pagination assumed for now to keep it simple, or assuming a large limit)
    // We'll add limit=1000 to fetch a large chunk
    const productRes = await fetch(`${apiBaseUrl}/api/products?limit=1000`);
    if (productRes.ok) {
      const data = await productRes.json();
      if (data.success && data.products) {
        data.products.forEach(product => {
          sitemap += `
  <url>
    <loc>${domain}/store/product/${product.seo_url}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });
      }
    }
  } catch (err) {
    // Ignore error, just serve static pages if API is unreachable
    console.error('Sitemap API Error:', err);
  }

  sitemap += `\n</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
