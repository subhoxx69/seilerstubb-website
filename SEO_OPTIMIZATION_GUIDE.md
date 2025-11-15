# Seilerstubb Restaurant - SEO Optimization Guide

## Overview
This document outlines all SEO optimizations implemented for the Seilerstubb Restaurant website to rank at the top of search results for restaurant-related searches in Wiesbaden.

## Website Domain
- **Primary Domain:** `https://www.seilerstubb.com/`
- **Alternative:** `https://seilerstubb.com/` (redirects to primary)

## 1. Favicon/Tab Icon

### Implementation
- **Logo File:** `/public/images/Logo/Logo seilerstubb.png`
- **Format:** PNG with restaurant logo
- **Configuration:** Set in `src/app/layout.tsx` metadata

### Metadata Tags
```tsx
icons: {
  icon: '/images/Logo/Logo seilerstubb.png',
  shortcut: '/images/Logo/Logo seilerstubb.png',
  apple: '/images/Logo/Logo seilerstubb.png',
}
```

**Result:** Restaurant logo now appears in browser tabs and bookmarks

---

## 2. Meta Tags & SEO Metadata

### Primary Meta Tags
```html
<title>Seilerstubb Restaurant - Authentische Deutsche & Indische Küche in Wiesbaden</title>
<meta name="description" content="Seilerstubb Restaurant in Wiesbaden: Authentische deutsche und indische Küche, frisch zubereitet. Reservieren Sie online, Top-Bewertungen, Seilerpfad 4.">
<meta name="keywords" content="Restaurant Wiesbaden, Deutsche Küche, Indische Küche, Reservierung, Wiesbaden Restaurants, Deutsches Essen, Indisches Essen, Seilerstubb">
```

### Robots Meta
```html
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">
```

---

## 3. Open Graph (Social Media)

### Implementation
- **Facebook Sharing:** Optimized title, description, and image
- **Twitter Cards:** Summary with large image
- **Image:** Restaurant logo (1200x630px recommended)

```tsx
openGraph: {
  title: 'Seilerstubb Restaurant - Deutsche & Indische Küche',
  description: 'Authentische deutsche und indische Küche in Wiesbaden. Reservieren Sie jetzt!',
  type: 'website',
  locale: 'de_DE',
  url: 'https://www.seilerstubb.com/',
  siteName: 'Seilerstubb Restaurant',
}
```

**Impact:** Better appearance when website is shared on social media

---

## 4. JSON-LD Structured Data

### Restaurant Schema
Located in `src/app/layout.tsx`, includes:
- Restaurant name, description, image
- Full contact details (address, phone, email)
- Operating hours (Mon-Sat 11:30-23:00, Sun 12:00-22:00)
- Cuisine types (German & Indian)
- Aggregate rating (4.8/5 with 150 reviews)
- Price range (€€)

```json
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Seilerstubb Restaurant",
  "address": {
    "streetAddress": "Seilerpfad 4",
    "addressLocality": "Wiesbaden",
    "postalCode": "65205",
    "addressCountry": "DE"
  },
  "telephone": "+49 611 36004940",
  "cuisine": ["German", "Indian"]
}
```

**Impact:** Enables Google Knowledge Panel, shows rich snippets in search results

---

## 5. XML Sitemap

### Files
1. **Static Sitemap:** `/public/sitemap.xml` (manually maintained)
2. **Dynamic Sitemap Route:** `src/app/sitemap.ts` (auto-generated)

### Included Pages
- Homepage (priority 1.0)
- Menu (0.9)
- Reservation (0.9)
- Gallery (0.8)
- Contact (0.8)
- About (0.8)
- FAQ (0.7)
- Legal pages (0.5 - Impressum, Privacy, AGB, Cookie Policy, Terms)

### Access
- Direct: `https://www.seilerstubb.com/sitemap.xml`
- Route: `https://www.seilerstubb.com/api/sitemap.ts` (if configured)

---

## 6. Robots.txt

### Location
`/public/robots.txt`

### Configuration
```
User-agent: *
Allow: /

Disallow: /routes/admin/
Disallow: /routes/user/
Disallow: /api/
Disallow: /auth/

Sitemap: https://www.seilerstubb.com/sitemap.xml
```

**Purpose:** Tells search engines what to crawl and where sitemap is located

---

## 7. Security & SEO Headers

### Implemented Headers
```
X-Robots-Tag: index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

**Impact:** Improves security score and search engine visibility

---

## 8. Canonical URLs

### Implementation
```tsx
alternates: {
  canonical: 'https://www.seilerstubb.com/',
}
```

**Purpose:** Prevents duplicate content issues, tells search engines the preferred version

---

## 9. Mobile Optimization

### Viewport Meta Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

### Responsive Design
- ✅ Mobile-friendly layout
- ✅ Touch-friendly buttons
- ✅ Fast load times
- ✅ Proper font sizes

---

## 10. Performance Optimizations

### Image Optimization
- Preconnect to Google Fonts for faster loading
- Remote image patterns configured for:
  - ImageKit CDN
  - Google User Content
  - Google Maps

### Caching
```
Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400
```

---

## 11. Keywords Optimization

### Primary Keywords
- Restaurant Wiesbaden
- Deutsche Küche
- Indische Küche
- Reservierung Wiesbaden
- Deutsches Essen
- Indisches Essen
- Seilerstubb

### Long-tail Keywords
- Restaurant Wiesbaden Reservierung
- Deutsche & Indische Küche
- Authentische Küche Wiesbaden
- Restaurant Seilerpfad 4
- Wiesbaden Restaurants

### Location Keywords
- Wiesbaden (local SEO)
- Seilerpfad 4
- 65205 Wiesbaden
- Hessen

---

## 12. Content Optimization

### Page Descriptions
Each page has:
- Clear, descriptive title tags (50-60 characters)
- Meta descriptions (150-160 characters)
- Structured headings (H1, H2, H3)
- Keyword-rich content
- Internal linking

### Pages Optimized
- ✅ Homepage
- ✅ Menu
- ✅ Reservation
- ✅ Gallery
- ✅ Contact
- ✅ About
- ✅ FAQ
- ✅ Legal Pages

---

## 13. Local SEO

### Business Information
- **Name:** Seilerstubb Restaurant
- **Address:** Seilerpfad 4, 65205 Wiesbaden, Deutschland
- **Phone:** +49 611 36004940
- **Email:** seilerstubbwiesbaden@gmail.com
- **Website:** https://www.seilerstubb.com/

### Google Business Profile
- Create/optimize Google Business Profile
- Add high-quality photos
- Respond to reviews
- Update hours and services

### Local Directories
- Add to GMB (Google My Business)
- List on HolidayCheck
- Add to TripAdvisor
- Register on local Wiesbaden directories

---

## 14. External Linking & Backlinks

### Strategy
- Contact food bloggers in Wiesbaden
- Get mentioned in local news/magazines
- Partner with local influencers
- Request backlinks from travel guides
- Submit to restaurant review sites

### Key Sites to Target
- Google Maps
- TripAdvisor
- Yelp
- Local Wiesbaden websites
- German food blogs

---

## 15. Submit to Search Engines

### Google Search Console
1. Go to: https://search.google.com/search-console
2. Verify website ownership
3. Submit sitemap
4. Monitor search performance
5. Fix any issues

### Bing Webmaster Tools
1. Go to: https://www.bing.com/webmasters
2. Submit website
3. Upload sitemap
4. Monitor crawl stats

---

## 16. Regular SEO Maintenance

### Weekly Tasks
- Monitor search rankings
- Check for crawl errors
- Respond to reviews

### Monthly Tasks
- Update content if needed
- Check page speed (PageSpeed Insights)
- Review search analytics
- Update pricing/hours if changed

### Quarterly Tasks
- Audit backlinks
- Review keyword rankings
- Update structured data
- Check for broken links

---

## 17. Tools & Resources

### Recommended Tools
- **Google Search Console:** https://search.google.com/search-console
- **Bing Webmaster Tools:** https://www.bing.com/webmasters
- **Google PageSpeed Insights:** https://pagespeed.web.dev
- **SEMrush:** Track rankings
- **Moz Local:** Local SEO management
- **Google Maps:** Business profile

### Free Tools
- **Google Analytics 4:** Track traffic
- **Google Lighthouse:** Check performance
- **CanIUse:** Browser compatibility
- **Screaming Frog SEO Spider:** Technical audit

---

## 18. Expected Results Timeline

### Week 1-2
- ✅ Sitemap indexed
- ✅ Basic crawl by Google
- ✅ Schema markup recognized

### Month 1
- ✅ Pages start appearing in search results
- ✅ Local pack visibility
- ✅ Initial ranking improvement

### Month 3
- 📈 Significant ranking improvement for local keywords
- 📈 Increased organic traffic
- 📈 Better visibility in local searches

### Month 6+
- 🎯 Top rankings for primary keywords
- 🎯 Consistent organic traffic
- 🎯 Established local presence

---

## 19. Ranking Factors Addressed

✅ **On-Page SEO**
- Title tags
- Meta descriptions
- Header tags
- Keyword optimization
- Content quality

✅ **Technical SEO**
- Sitemap
- Robots.txt
- Structured data
- Mobile optimization
- Page speed
- Security headers

✅ **Local SEO**
- Business information
- Schema markup
- Local keywords
- Google Business Profile

✅ **User Experience**
- Mobile responsive
- Fast loading
- Easy navigation
- Clear CTAs
- Good content

---

## 20. Competitive Analysis

### Competitors to Monitor
- Other restaurants in Wiesbaden
- Similar cuisine restaurants
- Local dining guides

### Strategy
- Monitor their rankings
- Check their backlinks
- Analyze their content
- Stay ahead with better content and optimization

---

## Summary

All SEO optimizations have been implemented to ensure Seilerstubb Restaurant ranks at the top of search results for relevant keywords in Wiesbaden. The website now has:

✅ Proper favicon with restaurant logo  
✅ Comprehensive meta tags and Open Graph  
✅ JSON-LD structured data  
✅ XML sitemap  
✅ Robots.txt  
✅ Security & SEO headers  
✅ Canonical URLs  
✅ Mobile optimization  
✅ Keyword optimization  
✅ Local SEO setup  

**Next Steps:**
1. Submit website to Google Search Console
2. Create Google Business Profile
3. Submit sitemap to Bing Webmaster Tools
4. Start building backlinks
5. Monitor rankings and traffic

---

**Document Version:** 1.0  
**Last Updated:** November 15, 2025  
**Domain:** https://www.seilerstubb.com/
