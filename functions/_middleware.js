export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Check if the request is for the admin subdomain
  if (url.hostname.startsWith('admin.')) {
    // If accessing the root path "/", serve admin.html instead of index.html
    if (url.pathname === '/' || url.pathname === '') {
      const adminUrl = new URL('/admin.html', context.request.url);
      return context.env.ASSETS.fetch(new Request(adminUrl, context.request));
    }
  }

  // Otherwise, continue to the requested asset (like CSS, JS, images, etc.)
  return context.next();
}
