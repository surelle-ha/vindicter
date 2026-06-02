interface LandingSeoOptions {
  title: string
  description: string
  path?: string
  image?: string
}

const SITE_URL = 'https://vindicter.xyz'
const SITE_NAME = 'Vindicter'

export function useLandingSeo(options: LandingSeoOptions) {
  const path = options.path ?? '/'
  const canonical = new URL(path, SITE_URL).toString()
  const image = new URL(options.image ?? '/icon.png', SITE_URL).toString()

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogSiteName: SITE_NAME,
    ogType: 'website',
    ogUrl: canonical,
    ogImage: image,
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: image,
  })

  useHead({
    link: [
      { rel: 'canonical', href: canonical },
    ],
  })
}
