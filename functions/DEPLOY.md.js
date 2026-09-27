// DEPLOY.md was removed from the site; an old copy lingers in the Pages asset cache.
// Answer this path with the site's 404 page so the cached copy is never served.
export async function onRequest({ request, env }) {
  const page = await env.ASSETS.fetch(new URL('/404.html', request.url))
  return new Response(page.body, {
    status: 404,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  })
}
