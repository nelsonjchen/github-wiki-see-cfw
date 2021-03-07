import * as cheerio from 'cheerio';

const htmlHeader = { 'content-type': 'text/html' }
const htmlStyle = `
<style>
        body {
            max-width: 38rem;
            padding: 2rem;
            margin: auto;
        }
</style>
`

const frontPageHtml = `
<html lang='en'>
<head>
<title>GitHub Wiki SEE</title>
${htmlStyle}
</head>
<body id='main'>
    <h1>GitHub Wiki SEE</h1>
    <p>
      GitHub Wiki Search Engine Enablement is a tool to allow GitHub Wikis to
      be indexed by search engines. There's no <code>robots.txt</code> on this
      site. Because of this, text content served from this tool should be 
      indexed.
    </p>
    <p>
      Currently, <a href='https://github.com/isaacs/github/issues/1683'>
      GitHub prevents crawling of repository's Wiki pages. This means Wikis are
      invisible to search engines.</a> This can be a very unpleasant surprise 
      if you're looking to share knowledge or put a FAQ on a Wiki!
    </p>
    <p>
      This tool simply mirrors the rendered contents of the pages and has a link
      at the top to visit the page on GitHub for normal usage. The content of 
      the tool is not meant to be read by users. A link is put above on the 
      mirrored and index-able pages to GitHub for actual reading and editing.
    </p>
    <h2>Usage</h2>
    <ol>
        <li>
          Go to this site at 
          <code>/ghw/{username or organization}/{repo}</code>
        </li>
        <li>
          Make sure the page has content.
        </li>
        <li>
          For best results, place the link in a location that can be indexed 
          by search engines such as a README or some other place.
        </li>
    </ol>
    <h2>Project Page</h2>
      <p><a href='https://github.com/nelsonjchen/github-wiki-see'>GitHub</a></p>
    <h2>Examples / My Seeds</h2>
    <ul>
        <li>
          <a href='/ghw/nelsonjchen/github-wiki-test'>
            nelsonjchen/github-wiki-test
          </a>
        </li>
        <li>
          <a href='/ghw/commaai/openpilot'>
            commaai/openpilot
          </a>
        </li>
    </ul>
</body>
</html>
`
const proxyHtmlTemplate = `
<html lang='en'>
<head>
<title>Original Title - GitHub Wiki SEE</title>
${htmlStyle}
</head>
<body>
<h1>Proxy here</h1>
<div>
<ul>
<li>Original URL: </li>
</ul>
</div>
<div id='original_sidebar'>
Original Sidebar Here
</div>
<div id='original_body'>
Original Body Here
</div>
</body>
`

addEventListener('fetch', event => {
  try {
    event.respondWith(handleEvent(event))
  } catch (e) {
    return event.respondWith(
      new Response(e.message || e.toString(), {
        status: 500,
      }),
    )
  }
})

async function handleEvent(event) {
  const url = new URL(event.request.url)

  if (url.pathname === '/') {
    return new Response(
      frontPageHtml,
      {
        headers: htmlHeader,
      },
    )
  }
  return await handleProxyEvent(event)
}

async function handleProxyEvent(event) {
  console.log(`Handling Proxy for event`)
  const url = new URL(event.request.url)

  const regExpUrl = /^\/ghw\/(?<user_or_org>[[a-zA-Z0-9-_.]+?)\/(?<repo>[a-zA-Z0-9-_.]+)(?<rest>\/.*)?/g

  const params = regExpUrl.exec(url.pathname)
  const rest_of_url = params.groups.rest || ''

  const github_fetch_init = {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  }

  const github_wiki_url = `https://github.com/${params.groups.user_or_org}/${params.groups.repo}/wiki${rest_of_url}`
  const github_response = await fetch(
    github_wiki_url,
    github_fetch_init
  )

  const github_html_parsed = await github_response.text()
  const parsed_cheerio_html = cheerio.load(github_html_parsed)
  const container_html = parsed_cheerio_html('#repo-content-pjax-container').html()



  // return new Response(proxyHtmlTemplate, {
  //   headers: { 'content-type': 'text/html' },
  // })
  return new Response(`
  original hehe url: ${url.pathname}\n
  user_or_org: ${params.groups.user_or_org}\n
  repo: ${params.groups.user_or_org}\n
  rest: ${params.groups.rest}\n
  original_url: ${github_wiki_url}\n
  container html: ${container_html}\n
  `, {
    status: 200
  })


}
