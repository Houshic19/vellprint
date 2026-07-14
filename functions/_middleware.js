export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Check if the request is for the admin subdomain
  if (url.hostname.includes('admin.')) {
    // If accessing the root path "/", redirect to admin.html
    if (url.pathname === '/' || url.pathname === '') {
      return Response.redirect(new URL('/admin.html', context.request.url).toString(), 302);
    }
  }

  // Otherwise, continue to the requested asset
  return context.next();
}
