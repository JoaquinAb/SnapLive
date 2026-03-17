export default function robots() {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/dashboard/', '/admin/', '/payment/', '/reset-password/', '/forgot-password/'],
            },
        ],
        sitemap: 'https://snaplive.com.ar/sitemap.xml',
    };
}
