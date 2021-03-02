import { getAssetFromKV, mapRequestToAsset } from '@cloudflare/kv-asset-handler'

/**
 * The DEBUG flag will do two things that help during development:
 * 1. we will skip caching on the edge, which makes it easier to
 *    debug.
 * 2. we will return an error message on exception in your Response rather
 *    than the default 404.html page.
 */
const DEBUG = true

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    if (DEBUG) {
      return event.respondWith(
        new Response(e.message || e.toString(), {
          status: 500,
        }),
      )
    }
    event.respondWith(new Response('Internal Error', { status: 500 }))
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url)
  let options = {}


  try {
    if (DEBUG) {
      // customize caching
      options.cacheControl = {
        bypassCache: true,
      }
    }

    if (event.request.url.includes('/ghw')) {
      return await handleProxy(event)
    }

    return await getAssetFromKV(event, options)
  } catch (e) {
    // if an error is thrown try to serve the asset at 404.html
    if (!DEBUG) {
      try {
        let notFoundResponse = await getAssetFromKV(event, {
          mapRequestToAsset: req => new Request(`${new URL(req.url).origin}/404.html`, req),
        })

        return new Response(notFoundResponse.body, { ...notFoundResponse, status: 404 })
      } catch (e) {}
    }

    return new Response(e.message || e.toString(), { status: 500 })
  }
}

async function handleProxy(event) {
  console.log(`Handling Proxy for event`)
  const url = new URL(event.request.url)

  const params = Array.from(url.pathname.matchAll(/^\/ghw\/([[a-zA-Z0-9-_.]+)\/([a-zA-Z0-9-_.]+)(\/(.*?))?/g))
  for (const m of params) {
    console.log(m);
  }

  const init = {
    headers: {
      "content-type": "text/html;charset=UTF-8",
    },
  }

  const res = await fetch("https://github.com/nelsonjchen/github-wiki-test/wiki", init);

  return new Response(`
  original url: ${url.pathname}\n
  original url: ${params[0]}\n
  original url: ${params[1]}\n
  original url: ${params[2]}\n
  res.text(): ${await res.text()}
  `, { status: 200 })
}
