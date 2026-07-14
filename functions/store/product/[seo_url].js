export async function onRequestGet(context) {
  const { request, env, params } = context;
  const seoUrl = params.seo_url;
  
  // API base URL for fetching product data (Ubuntu Server)
  // In Cloudflare, env.API_BASE_URL can be set, fallback to hardcoded
  const apiBaseUrl = env.API_BASE_URL || 'https://api.vellprint.in';
  
  try {
    // 1. Fetch product data from Ubuntu backend
    const productRes = await fetch(`${apiBaseUrl}/api/products/${seoUrl}`);
    if (!productRes.ok) {
      return new Response('Product Not Found', { status: 404 });
    }
    const data = await productRes.json();
    if (!data.success) {
      return new Response('Product Not Found', { status: 404 });
    }
    const product = data.product;

    // 2. Fetch the base product.html template from the static assets
    const url = new URL(request.url);
    const templateRes = await env.ASSETS.fetch(new Request(`${url.origin}/product.html`));
    let html = await templateRes.text();

    // 3. Inject SEO Schema and Metadata
    const breadcrumbSchema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": `${url.origin}/` },
        { "@type": "ListItem", "position": 2, "name": "Store", "item": `${url.origin}/store` },
        { "@type": "ListItem", "position": 3, "name": product.name, "item": `${url.origin}/store/product/${product.seo_url}` }
      ]
    };

    const productSchema = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "image": `${apiBaseUrl}${product.image_path}`,
      "description": product.short_description,
      "sku": product.sku || product.part_number,
      "mpn": product.part_number,
      "brand": {
        "@type": "Brand",
        "name": product.brand_name || "Vell Print"
      },
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "INR",
        "lowPrice": "0",
        "highPrice": "0",
        "offerCount": "1",
        "price": "0.00",
        "priceValidUntil": "2030-12-31",
        "availability": product.availability === 'In Stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "url": `${url.origin}/store/product/${product.seo_url}`
      }
    };

    // Replace Placeholders
    html = html.replace(/{{META_TITLE}}/g, product.meta_title || `${product.name} | Vell Print Technology`);
    html = html.replace(/{{META_DESCRIPTION}}/g, product.meta_description || product.short_description);
    html = html.replace(/{{PRODUCT_NAME}}/g, product.name);
    html = html.replace(/{{PRODUCT_IMAGE}}/g, `${apiBaseUrl}${product.image_path}`);
    html = html.replace(/{{BREADCRUMB_SCHEMA}}/g, JSON.stringify(breadcrumbSchema, null, 2));
    html = html.replace(/{{PRODUCT_SCHEMA}}/g, JSON.stringify(productSchema, null, 2));

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    });

  } catch (err) {
    return new Response('Internal Server Error', { status: 500 });
  }
}
