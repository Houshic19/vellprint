addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  // Rewrite root "/" to "/admin.html" on the Pages site
  if (url.pathname === '/' || url.pathname === '') {
    const adminUrl = `https://vellprint.pages.dev/admin.html`;
    const response = await fetch(adminUrl, {
      headers: request.headers,
    });
    // Return admin.html content but keep the admin subdomain URL
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  }

  // For all other paths (CSS, JS, images), proxy from the main Pages site
  const passthroughUrl = `https://vellprint.pages.dev${url.pathname}${url.search}`;
  return fetch(passthroughUrl, {
    headers: request.headers,
  });
}
