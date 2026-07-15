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
    // Build dynamic title with part number
    let dynamicTitle = product.meta_title || `${product.name} | Vell Print Technology India`;
    if (!product.meta_title && product.part_number) {
      dynamicTitle = `${product.name} (${product.part_number}) - Buy Online in India | Vell Print Technology`;
    }

    // Build dynamic description with part numbers
    let dynamicDesc = product.meta_description || product.short_description;
    if (!product.meta_description) {
      const parts = [];
      if (product.part_number) parts.push(`Part Number: ${product.part_number}`);
      if (product.oem_part_number) parts.push(`OEM: ${product.oem_part_number}`);
      if (product.alternate_part_number) parts.push(`Alt: ${product.alternate_part_number}`);
      if (parts.length > 0) {
         dynamicDesc += ` ${parts.join(', ')}.`;
      }
      dynamicDesc += ` Shipping across India. Buy official IT spare parts online from Vell Print Technology.`;
    }

    // Replace Placeholders
    html = html.replace(/{{META_TITLE}}/g, dynamicTitle);
    html = html.replace(/{{META_DESCRIPTION}}/g, dynamicDesc);
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
