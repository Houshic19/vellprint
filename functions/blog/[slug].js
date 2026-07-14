export async function onRequestGet(context) {
  const { request, env, params } = context;
  const slug = params.slug;
  
  const apiBaseUrl = env.API_BASE_URL || 'https://api.vellprint.in';
  
  try {
    // 1. Fetch post data from Ubuntu backend
    const postRes = await fetch(`${apiBaseUrl}/api/blog/${slug}`);
    if (!postRes.ok) {
      // Fallback to normal blog page or 404
      const url = new URL(request.url);
      return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
    }
    const data = await postRes.json();
    if (!data.success || !data.post) {
      const url = new URL(request.url);
      return env.ASSETS.fetch(new Request(`${url.origin}/index.html`));
    }
    const post = data.post;

    // 2. Fetch the base blog.html template
    const url = new URL(request.url);
    const templateRes = await env.ASSETS.fetch(new Request(`${url.origin}/blog.html`));
    let html = await templateRes.text();

    // 3. Inject SEO Schema and Metadata
    html = html.replace(
      /<title>.*?<\/title>/,
      `<title>${post.title} | Vell Print Technology Blog</title>`
    );
    html = html.replace(
      /<meta name="description" content=".*?">/,
      `<meta name="description" content="${(post.excerpt || '').replace(/"/g, '&quot;')}">`
    );
    
    // Inject a script with the post data for client-side rendering
    const postDataScript = `<script>window.__BLOG_POST__ = ${JSON.stringify(post)};</script>`;
    html = html.replace('</head>', postDataScript + '</head>');

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8'
      }
    });

  } catch (err) {
    return new Response('Internal Server Error', { status: 500 });
  }
}
