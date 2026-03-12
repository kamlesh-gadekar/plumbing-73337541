// Modern Website Interactive Features

// Phone icon SVG for CTA buttons
const PHONE_ICON_SVG = '<span class="phone-icon"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg></span>';

// Back to Top Button
const backToTopButton = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Mobile Menu Toggle
const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
const mainNav = document.querySelector('.main-nav');

if (mobileMenuToggle && mainNav) {
    mobileMenuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        mainNav.classList.toggle('mobile-active');
        mobileMenuToggle.classList.toggle('active');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mainNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
            mainNav.classList.remove('mobile-active');
            mobileMenuToggle.classList.remove('active');
        }
    });

    // Close menu when clicking a link (except dropdowns)
    mainNav.querySelectorAll('a:not(.dropdown-toggle):not(.nav-dropdown-toggle)').forEach(link => {
        link.addEventListener('click', () => {
            mainNav.classList.remove('mobile-active');
            mobileMenuToggle.classList.remove('active');
        });
    });

    // Mobile dropdown toggle (click to expand/collapse)
    mainNav.querySelectorAll('.nav-dropdown-toggle, .dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            // Only handle on mobile (check if mobile menu toggle is visible)
            if (window.innerWidth <= 768) {
                e.preventDefault();
                e.stopPropagation();
                const dropdown = toggle.closest('.nav-dropdown');
                if (dropdown) {
                    // Close other dropdowns
                    mainNav.querySelectorAll('.nav-dropdown.open').forEach(openDropdown => {
                        if (openDropdown !== dropdown) {
                            openDropdown.classList.remove('open');
                        }
                    });
                    // Toggle this dropdown
                    dropdown.classList.toggle('open');
                }
            }
        });
    });
}

// Smooth Scroll for Anchor Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href !== '#' && href.length > 1) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        }
    });
});

// ============================================================================
// DYNAMIC CONTENT LOADING FROM CMS
// ============================================================================
// This section loads content.json and updates the page dynamically
// Allows CMS changes to be reflected without rebuilding the site

// Global image counter for organic layout alternation across all sections
let globalImageIndex = 0;

function loadDynamicContent() {
    // Inner pages are in subdirectories, so use root-relative path
    const isInnerPage = document.body.classList.contains('subpage-service') ||
                        document.body.classList.contains('subpage-location') ||
                        document.body.classList.contains('subpage-blog');
    const contentUrl = isInnerPage ? '/content.json' : 'content.json';

    fetch(contentUrl)
        .then(response => {
            if (!response.ok) {
                console.log('No content.json found, using static content');
                return null;
            }
            return response.json();
        })
        .then(content => {
            if (!content) return;

            console.log('[CMS] Loading dynamic content from content.json');

            if (document.body.classList.contains('subpage-service')) {
                updateSharedElements(content);
                updateServicePageContent(content);
            } else if (document.body.classList.contains('subpage-location')) {
                updateSharedElements(content);
                updateLocationPageContent(content);
            } else if (document.body.classList.contains('subpage-blog')) {
                updateSharedElements(content);
                updateBlogPageContent(content);
            } else {
                // Homepage - existing behavior
                updatePageContent(content);
            }
        })
        .catch(error => {
            console.error('[CMS] Error loading content.json:', error);
            // Fail silently - static content will be shown
        });
}

function updatePageContent(content) {
    // Reset global image index when loading new content
    globalImageIndex = 0;

    const site = content.site || {};
    const hero = content.hero || {};
    const features = content.features || [];
    const mainService = content.mainService || {};
    const stats = content.stats || [];
    const serviceSections = content.serviceSections || [];
    const servicesList = content.servicesList || {};
    const faqs = content.faqs || [];
    const testimonials = content.testimonials || {};
    const areasServed = content.areasServed || {};

    // Update meta tags
    if (site.metaTitle) {
        document.title = site.metaTitle;
        updateMetaTag('og:title', site.metaTitle);
    }
    if (site.metaDescription) {
        updateMetaTag('description', site.metaDescription);
        updateMetaTag('og:description', site.metaDescription);
    }

    // Update favicon
    if (site.favicon) {
        updateFavicon(site.favicon);
    }

    // Update hero section
    updateTextContent('.hero-heading', hero.heading);
    updateHTMLContent('.hero-subheading', newlinesToBr(hero.subheading));
    updateAttribute('.hero .cta-button', 'href', hero.ctaLink);
    // Update hero CTA - preserve phone icon if it's a tel: link
    const heroCta = document.querySelector('.hero .cta-button');
    if (heroCta && hero.ctaText) {
        if (hero.ctaLink && hero.ctaLink.startsWith('tel:')) {
            heroCta.innerHTML = PHONE_ICON_SVG + hero.ctaText;
            heroCta.classList.add('cta-button-phone');
        } else {
            heroCta.textContent = hero.ctaText;
            heroCta.classList.remove('cta-button-phone');
        }
    }

    // Update hero background if specified
    if (hero.backgroundImage) {
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            heroSection.style.backgroundImage = `url('${hero.backgroundImage}')`;
            heroSection.style.backgroundSize = 'cover';
            heroSection.style.backgroundPosition = 'center';
        }
    }

    // Update logo
    if (site.logo) {
        updateLogo(site.logo, site.businessName);
    } else if (site.businessName) {
        updateLogo('', site.businessName);
    }

    // Update features
    updateFeatures(features);

    // Update contact info throughout the page
    updateContactInfo(site);

    // Update main service section
    updateTextContent('.main-service h2', mainService.heading);
    updateHTMLContent('.main-service .service-content', markdownToHTML(mainService.content));

    // Update stats
    updateStats(stats);

    // Update service sections
    updateServiceSections(serviceSections);

    // Update services list
    updateTextContent('.service-showcase-title', servicesList.heading);
    updateHTMLContent('.service-showcase-intro', newlinesToBr(servicesList.intro));
    updateServicesList(servicesList.items || []);

    // Update FAQs
    updateFAQs(faqs);

    // Update testimonials
    updateTestimonials(testimonials);

    // Update areas served
    updateTextContent('.areas-served h2', areasServed.heading);
    updateAreas(areasServed.locations || []);

    // Update footer
    updateFooterServices(servicesList.items || []);
    const footer = site.footer || {};
    updateHTMLContent('.footer-about', newlinesToBr(footer.aboutText));

    // Update contact form
    const contactForm = content.contactForm || {};
    updateHTMLContent('.contact-form-info p', newlinesToBr(contactForm.description));
    updateTextContent('.contact-form-info h2', contactForm.heading);

    console.log('[CMS] Dynamic content loaded successfully');
}

// ============================================================================
// INNER PAGE DYNAMIC CONTENT LOADING (Service, Location, Blog)
// ============================================================================

// Extract slug from current URL path
function getPageSlug() {
    const path = window.location.pathname;
    const segments = path.replace(/\/$/, '').split('/');
    return segments[segments.length - 1] || '';
}

// Update shared elements on all pages (header, footer, contact info)
function updateSharedElements(content) {
    const site = content.site || {};

    if (site.favicon) updateFavicon(site.favicon);

    if (site.logo) {
        updateLogo(site.logo, site.businessName);
    } else if (site.businessName) {
        updateLogo('', site.businessName);
    }

    updateContactInfo(site);

    const servicesList = content.servicesList || {};
    updateFooterServices(servicesList.items || []);

    const footer = (site.footer || {});
    updateHTMLContent('.footer-about', newlinesToBr(footer.aboutText));

    // Update business name in footer
    if (site.businessName) {
        updateTextContent('.footer-logo strong', site.businessName);
        const copyrightEl = document.querySelector('.copyright');
        if (copyrightEl) {
            const copyrightYears = site.copyrightYears || new Date().getFullYear();
            copyrightEl.innerHTML = 'Copyright &copy; ' + copyrightYears + ' ' + site.businessName + ' | <a href="/legal/privacy-policy.html">Privacy Policy</a>';
        }
    }
}

// ---- SERVICE PAGE ----
function updateServicePageContent(content) {
    const slug = getPageSlug();
    const pages = (content.additionalPages || {}).servicePages || [];
    const page = pages.find(function(p) { return p.slug === slug; });
    if (!page) {
        console.log('[CMS] No matching service page for slug:', slug);
        return;
    }

    // Meta
    if (page.title) document.title = page.title;
    if (page.metaDescription) updateMetaTag('description', page.metaDescription);

    // Hero
    updateTextContent('.hero-heading', page.serviceName);
    updateHTMLContent('.hero-subheading', newlinesToBr(page.heroSubtitle));

    // Intro content (first 2 paragraphs of content field)
    if (page.content) {
        var paragraphs = page.content.split('\n\n');
        var introMarkdown = paragraphs.slice(0, 2).join('\n\n');
        updateHTMLContent('.service-intro-content', markdownToHTMLDemoted(introMarkdown));

        // Remaining content goes into main body
        var remaining = paragraphs.slice(2).join('\n\n');
        if (remaining) {
            var sectionContent = document.querySelector('.main-content .section-content');
            if (sectionContent) {
                sectionContent.innerHTML = markdownToHTMLDemoted(remaining);
            }
        }
    }

    // Intro image
    if (page.image) {
        var img = document.querySelector('.service-intro-image img');
        if (img) {
            img.src = page.image;
            if (page.imageAlt) img.alt = page.imageAlt;
        }
    }

    // Features
    if (page.features && page.features.length) {
        var container = document.querySelector('.service-features');
        if (container) {
            var heading = container.querySelector('h2');
            var headingHTML = heading ? heading.outerHTML : '';
            container.innerHTML = headingHTML + page.features.map(function(f) {
                return '<div class="service-feature">' +
                    '<div class="feature-icon">' + (f.icon || '\u2713') + '</div>' +
                    '<h3>' + (f.title || '') + '</h3>' +
                    '<p>' + (f.description || '') + '</p>' +
                '</div>';
            }).join('');
        }
    }

    // FAQs
    if (page.faqs && page.faqs.length) {
        var faqSection = document.querySelector('.service-faq-section');
        if (faqSection) {
            var faqGrid = faqSection.querySelector('.faq-grid');
            if (faqGrid) {
                faqGrid.innerHTML = page.faqs.map(function(faq) {
                    return '<div class="faq-item">' +
                        '<div class="faq-question">' + (faq.question || '') + '</div>' +
                        '<div class="faq-answer">' + (faq.answer || '') + '</div>' +
                    '</div>';
                }).join('');
            }
        }
    }

    console.log('[CMS] Service page updated:', slug);
}

// ---- LOCATION PAGE ----
function updateLocationPageContent(content) {
    var slug = getPageSlug();
    var pages = (content.additionalPages || {}).locationPages || [];
    var page = pages.find(function(p) { return p.slug === slug; });
    if (!page) {
        console.log('[CMS] No matching location page for slug:', slug);
        return;
    }

    // Meta
    if (page.title) document.title = page.title;
    if (page.metaDescription) updateMetaTag('description', page.metaDescription);

    // Hero
    updateTextContent('.hero-heading', page.title || ('Services in ' + (page.area || '')));
    updateHTMLContent('.hero-subheading', newlinesToBr(page.heroSubtitle));

    // Intro content
    if (page.introContent) {
        updateHTMLContent('.location-intro', markdownToHTMLDemoted(page.introContent));
    } else if (page.content && !page.introContent) {
        updateHTMLContent('.location-intro', markdownToHTMLDemoted(page.content));
    }

    // Body content (when introContent exists, content is the extended body)
    if (page.introContent && page.content) {
        var bodyEl = document.querySelector('.location-body-content');
        if (bodyEl) {
            bodyEl.innerHTML = markdownToHTMLDemoted(page.content);
        }
    }

    // Service categories
    if (page.serviceCategories && page.serviceCategories.length) {
        var servicesSection = document.querySelector('.location-services-section');
        if (servicesSection) {
            var heading = servicesSection.querySelector('h2');
            var headingHTML = heading ? heading.outerHTML : '';
            servicesSection.innerHTML = headingHTML + page.serviceCategories.map(function(cat) {
                return '<div class="location-service-category">' +
                    '<h3>' + (cat.name || '') + '</h3>' +
                    '<p>' + (cat.description || '') + '</p>' +
                '</div>';
            }).join('');
        }
    }

    // Trust content
    if (page.trustContent) {
        var trustSection = document.querySelector('.location-trust-section');
        if (trustSection) {
            trustSection.innerHTML = '<h2>You Can Verify Our Work</h2>' + markdownToHTMLDemoted(page.trustContent);
        }
    }

    // FAQs
    if (page.faqs && page.faqs.length) {
        var faqSection = document.querySelector('.location-faq-section');
        if (faqSection) {
            faqSection.innerHTML = '<h2>Frequently Asked Questions</h2><div class="faq-grid">' +
                page.faqs.map(function(faq) {
                    return '<div class="faq-item">' +
                        '<div class="faq-question">' + (faq.question || '') + '</div>' +
                        '<div class="faq-answer">' + (faq.answer || '') + '</div>' +
                    '</div>';
                }).join('') + '</div>';
        }
    }

    // Neighborhoods
    if (page.neighborhoods && page.neighborhoods.length) {
        var neighborhoodsSection = document.querySelector('.location-neighborhoods');
        if (neighborhoodsSection) {
            var nHeading = neighborhoodsSection.querySelector('h2');
            var nHeadingHTML = nHeading ? nHeading.outerHTML : '<h2>Neighborhoods We Serve</h2>';
            neighborhoodsSection.innerHTML = nHeadingHTML + '<div class="neighborhoods-grid">' +
                page.neighborhoods.map(function(n) {
                    return '<span class="neighborhood-item">' + n + '</span>';
                }).join('') + '</div>';
        }
    }

    // Closing content
    if (page.closingContent) {
        updateHTMLContent('.location-closing', markdownToHTMLDemoted(page.closingContent));
    }

    // Local features (info box)
    if (page.localFeatures && page.localFeatures.length) {
        var infoBox = document.querySelector('.location-info-box');
        if (infoBox) {
            var boxHeading = infoBox.querySelector('h3');
            var boxHeadingHTML = boxHeading ? boxHeading.outerHTML : '';
            infoBox.innerHTML = boxHeadingHTML + '<ul>' +
                page.localFeatures.map(function(f) {
                    return '<li>' + f + '</li>';
                }).join('') + '</ul>';
        }
    }

    console.log('[CMS] Location page updated:', slug);
}

// ---- BLOG PAGE ----
function updateBlogPageContent(content) {
    var slug = getPageSlug();
    var pages = (content.additionalPages || {}).blogPages || [];
    var page = pages.find(function(p) { return p.slug === slug; });
    if (!page) {
        console.log('[CMS] No matching blog page for slug:', slug);
        return;
    }

    // Meta
    if (page.title) document.title = page.title;
    if (page.metaDescription) updateMetaTag('description', page.metaDescription);

    // Hero
    updateTextContent('.hero-heading', page.title);
    if (page.excerpt) {
        updateHTMLContent('.hero-subheading', newlinesToBr(page.excerpt));
    }

    // Blog meta (author, category)
    var blogMeta = document.querySelector('.blog-meta');
    if (blogMeta) {
        if (page.author) {
            var authorName = blogMeta.querySelector('.blog-author-name');
            if (authorName) authorName.textContent = page.author;
            var avatar = blogMeta.querySelector('.blog-author-avatar');
            if (avatar) {
                avatar.textContent = page.author.split(' ').map(function(w) { return w[0]; }).join('').toUpperCase().slice(0, 2);
            }
        }
        if (page.category) {
            var cat = blogMeta.querySelector('.blog-category');
            if (cat) cat.textContent = page.category;
        }
    }

    // Main content - preserve blog-meta, replace article text
    if (page.content) {
        var mainContent = document.querySelector('.main-content');
        if (mainContent) {
            var metaEl = mainContent.querySelector('.blog-meta');
            var metaHTML = metaEl ? metaEl.outerHTML : '';
            mainContent.innerHTML = metaHTML + markdownToHTMLDemoted(page.content);
        }
    }

    console.log('[CMS] Blog page updated:', slug);
}

// Helper function to safely update text content
function updateTextContent(selector, content) {
    if (!content) return;
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        if (el) el.textContent = content;
    });
}

// Helper function to safely update HTML content
function newlinesToBr(text) {
    if (!text) return '';
    return text.replace(/\n/g, '<br>');
}

function updateHTMLContent(selector, content) {
    if (!content) return;
    const element = document.querySelector(selector);
    if (element) element.innerHTML = content;
}

// Helper function to safely update attributes
function updateAttribute(selector, attribute, value) {
    if (!value) return;
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
        if (el) el.setAttribute(attribute, value);
    });
}

// Helper function to update meta tags
function updateMetaTag(name, content) {
    if (!content) return;
    let meta = document.querySelector(`meta[name="${name}"]`) ||
               document.querySelector(`meta[property="${name}"]`);

    if (meta) {
        meta.setAttribute('content', content);
    } else {
        meta = document.createElement('meta');
        meta.setAttribute('name', name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
    }
}

// Update logo - always wrapped in clickable link to home
function updateLogo(logoPath, businessName) {
    const logoContainer = document.querySelector('.logo');
    if (!logoContainer) return;

    if (logoPath) {
        logoContainer.innerHTML = `<a href="/" class="logo-link"><img src="${logoPath}" alt="${businessName || 'Logo'}" class="logo-image" /></a>`;
    } else if (businessName) {
        logoContainer.innerHTML = `<a href="/" class="logo-link"><span class="logo-text">${businessName}</span></a>`;
    }
}

// Update favicon
function updateFavicon(faviconPath) {
    if (!faviconPath) return;

    // Remove existing favicon links
    const existingFavicons = document.querySelectorAll('link[rel="icon"]');
    existingFavicons.forEach(link => link.remove());

    // Create new favicon link
    const link = document.createElement('link');
    link.rel = 'icon';

    // Detect file type from extension
    if (faviconPath.endsWith('.ico')) {
        link.type = 'image/x-icon';
    } else if (faviconPath.endsWith('.png')) {
        link.type = 'image/png';
    } else if (faviconPath.endsWith('.svg')) {
        link.type = 'image/svg+xml';
    }

    link.href = faviconPath;
    document.head.appendChild(link);

    console.log('[CMS] Updated favicon to:', faviconPath);
}

// Update features
function updateFeatures(features) {
    const featureGrid = document.querySelector('.feature-grid');
    if (!featureGrid || !features.length) return;

    const html = features.slice(0, 3).map(feature => `
        <div class="feature-box">
            <div class="feature-number">${feature.number || '01'}</div>
            <h3>${feature.title || ''}</h3>
            <p>${newlinesToBr(feature.description || '')}</p>
        </div>
    `).join('');

    featureGrid.innerHTML = html;
}

// Update contact info (phone, email, address, hours)
function updateContactInfo(site) {
    // Update all phone links and text - preserve phone icon if present
    if (site.phone) {
        document.querySelectorAll('a[href^="tel:"]').forEach(el => {
            el.setAttribute('href', `tel:${site.phone}`);
            // Check if this is a CTA button with phone icon
            if (el.classList.contains('cta-button-phone') || el.querySelector('.phone-icon')) {
                // Preserve the phone icon, update only the text
                const phoneIcon = el.querySelector('.phone-icon');
                if (phoneIcon) {
                    el.innerHTML = PHONE_ICON_SVG + site.phone;
                } else {
                    el.innerHTML = PHONE_ICON_SVG + site.phone;
                    el.classList.add('cta-button-phone');
                }
            } else {
                el.textContent = site.phone;
            }
        });
        document.querySelectorAll('.phone-link').forEach(el => {
            // Preserve phone icon if present
            if (el.classList.contains('cta-button-phone') || el.querySelector('.phone-icon')) {
                el.innerHTML = PHONE_ICON_SVG + site.phone;
            } else {
                el.textContent = site.phone;
            }
        });
    }

    // Update email
    if (site.email) {
        document.querySelectorAll('a[href^="mailto:"]').forEach(el => {
            el.setAttribute('href', `mailto:${site.email}`);
            el.textContent = site.email;
        });
    }

    // Update address
    if (site.address) {
        document.querySelectorAll('.contact-info p').forEach(el => {
            if (el.textContent.includes('📍')) {
                el.innerHTML = `<span class="icon">📍</span> ${site.address}`;
            }
        });
        const footerAddress = document.querySelector('.footer-bottom-content');
        if (footerAddress) {
            const addressText = footerAddress.querySelector('.icon + span');
            if (addressText) addressText.textContent = site.address;
        }
    }

    // Update hours
    if (site.hours) {
        document.querySelectorAll('.contact-info p').forEach(el => {
            if (el.textContent.includes('🕐')) {
                el.innerHTML = `<span class="icon">🕐</span> ${site.hours}`;
            }
        });
    }

    // Update business name
    if (site.businessName) {
        updateTextContent('.footer-logo strong', site.businessName);
        // Use innerHTML to preserve the Privacy Policy link
        const copyrightEl = document.querySelector('.copyright');
        if (copyrightEl) {
            const copyrightYears = site.copyrightYears || new Date().getFullYear();
            copyrightEl.innerHTML = `Copyright © ${copyrightYears} ${site.businessName} | <a href="/legal/privacy-policy.html">Privacy Policy</a>`;
        }
    }
}

// Update stats section
function updateStats(stats) {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid || !stats.length) return;

    const html = stats.slice(0, 4).map(stat => `
        <div class="stat-item">
            <span class="stat-number">${stat.number || '0'}</span>
            <span class="stat-label">${stat.label || ''}</span>
        </div>
    `).join('');

    statsGrid.innerHTML = html;
}

// Update service sections
function updateServiceSections(sections) {
    if (!sections.length) return;

    // Find all service-section elements
    const sectionElements = document.querySelectorAll('.service-section');

    sections.forEach((section, index) => {
        if (sectionElements[index]) {
            const heading = sectionElements[index].querySelector('h2');
            const content = sectionElements[index].querySelector('.section-content');

            if (heading) heading.textContent = section.heading || '';
            if (content) content.innerHTML = markdownToHTML(section.content || '');
        }
    });
}

// Update services list
function updateServicesList(services) {
    const servicesGrid = document.querySelector('.services-grid');
    if (!servicesGrid || !services.length) return;

    const html = services.map(service =>
        `<div class="service-item">${service.name || ''}</div>`
    ).join('');

    servicesGrid.innerHTML = html;
}

// Update FAQs
function updateFAQs(faqs) {
    const faqList = document.querySelector('.faq-list');
    if (!faqList || !faqs.length) return;

    const html = faqs.map(faq => `
        <div class="faq-item">
            <div class="faq-question">${faq.question || ''}</div>
            <div class="faq-answer">${newlinesToBr(faq.answer || '')}</div>
        </div>
    `).join('');

    faqList.innerHTML = html;
}

// Update testimonials
function updateTestimonials(testimonials) {
    if (!testimonials.items || !testimonials.items.length) return;

    const testimonialsGrid = document.querySelector('.testimonials-grid');
    if (!testimonialsGrid) return;

    const heading = document.querySelector('.testimonials h2');
    if (heading && testimonials.heading) {
        heading.textContent = testimonials.heading;
    }

    const html = testimonials.items.map(testimonial => {
        const stars = '⭐'.repeat(testimonial.rating || 5);
        return `
            <div class="testimonial-card">
                <div class="testimonial-text">${newlinesToBr(testimonial.text || '')}</div>
                <div class="testimonial-author">${testimonial.name || 'Customer'}</div>
                <div class="testimonial-rating">${stars}</div>
            </div>
        `;
    }).join('');

    testimonialsGrid.innerHTML = html;
}

// Update areas served
function updateAreas(locations) {
    const areasGrid = document.querySelector('.areas-grid');
    if (!areasGrid || !locations.length) return;

    const html = locations.map(location => {
        const name = location.name || '';
        const link = location.link || '';

        if (link) {
            // If location has a link, make it clickable
            return `<a href="${link}" class="area-item area-item-link">${name}</a>`;
        } else {
            // Otherwise just a div
            return `<div class="area-item">${name}</div>`;
        }
    }).join('');

    areasGrid.innerHTML = html;
}

// Update footer services
function updateFooterServices(services) {
    const footerServicesList = document.querySelector('.footer-services');
    if (!footerServicesList || !services.length) return;

    const html = services.slice(0, 6).map(service =>
        `<li>${service.name || ''}</li>`
    ).join('');

    footerServicesList.innerHTML = html;
}

// Markdown to HTML with heading demotion (matches Python builder behavior)
// ## → h3, ### → h4 (one level down for SEO - one H1 per page)
function markdownToHTMLDemoted(markdown) {
    if (!markdown) return '';
    var html = markdownToHTML(markdown);
    // Demote in descending order to avoid double-demotion
    html = html.replace(/<h3>/g, '<h4>').replace(/<\/h3>/g, '</h4>');
    html = html.replace(/<h2>/g, '<h3>').replace(/<\/h2>/g, '</h3>');
    html = html.replace(/<h1>/g, '<h2>').replace(/<\/h1>/g, '</h2>');
    return html;
}

// Simple markdown to HTML converter with organic image layouts
function markdownToHTML(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // Headers
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // Bold and italic
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Images with organic layouts (must be before links since images use similar syntax)
    // Use global image index to maintain alternation across all sections
    html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, (match, alt, src) => {
        const idx = globalImageIndex++;

        // Determine layout class based on global image index
        let layoutClass = '';
        if (idx === 0) {
            // Very first image: featured/centered
            layoutClass = 'content-image-featured';
        } else if (idx % 2 === 1) {
            // Odd images: float right
            layoutClass = 'content-image-right';
        } else {
            // Even images: float left
            layoutClass = 'content-image-left';
        }

        // Wrap image in div with layout class
        return `<div class="${layoutClass}"><img src="${src}" alt="${alt}" loading="lazy" /></div>`;
    });

    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

    // Lists (supports both - and * bullets)
    html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Paragraphs
    const paragraphs = html.split('\n\n');
    html = paragraphs.map(p => {
        p = p.trim();
        if (p && !p.startsWith('<')) {
            return `<p>${p}</p>`;
        }
        return p;
    }).join('\n');

    return html;
}

// Load dynamic content when page is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDynamicContent);
} else {
    loadDynamicContent();
}

// ============================================================================
// TESTIMONIALS SLIDER
// ============================================================================

function initTestimonialsSlider() {
    const slider = document.querySelector('.testimonials-slider');
    if (!slider) return;

    const slides = slider.querySelectorAll('.testimonial-slide');
    const dots = document.querySelectorAll('.slider-dot');
    const prevBtn = document.querySelector('.slider-prev');
    const nextBtn = document.querySelector('.slider-next');

    if (slides.length === 0) return;

    let currentIndex = 0;
    let autoSlideInterval;

    function showSlide(index) {
        // Wrap around
        if (index < 0) index = slides.length - 1;
        if (index >= slides.length) index = 0;

        currentIndex = index;

        // Update slides
        slides.forEach((slide, i) => {
            slide.classList.remove('active');
            if (i === index) {
                slide.classList.add('active');
            }
        });

        // Update dots
        dots.forEach((dot, i) => {
            dot.classList.remove('active');
            if (i === index) {
                dot.classList.add('active');
            }
        });
    }

    function nextSlide() {
        showSlide(currentIndex + 1);
    }

    function prevSlide() {
        showSlide(currentIndex - 1);
    }

    function startAutoSlide() {
        stopAutoSlide();
        autoSlideInterval = setInterval(nextSlide, 5000);
    }

    function stopAutoSlide() {
        if (autoSlideInterval) {
            clearInterval(autoSlideInterval);
        }
    }

    // Event listeners
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            startAutoSlide(); // Reset timer on manual navigation
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            startAutoSlide(); // Reset timer on manual navigation
        });
    }

    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            showSlide(i);
            startAutoSlide(); // Reset timer on manual navigation
        });
    });

    // Pause auto-slide on hover
    slider.addEventListener('mouseenter', stopAutoSlide);
    slider.addEventListener('mouseleave', startAutoSlide);

    // Touch/swipe support for mobile
    let touchStartX = 0;
    let touchEndX = 0;

    slider.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoSlide();
    }, { passive: true });

    slider.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoSlide();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide(); // Swipe left = next
            } else {
                prevSlide(); // Swipe right = prev
            }
        }
    }

    // Start auto-sliding
    startAutoSlide();

    console.log('[SLIDER] Testimonials slider initialized with', slides.length, 'slides');
}

// Initialize slider when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTestimonialsSlider);
} else {
    initTestimonialsSlider();
}

// Contact Form AJAX Submission (all forms: homepage, service pages, contact page)
function initContactForms() {
    const forms = document.querySelectorAll('.contact-form, .inline-contact-form, .contact-form-large');

    forms.forEach(function(form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Honeypot check
            const honeypot = form.querySelector('[name="_gotcha"]');
            if (honeypot && honeypot.value) return;

            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'SENDING...';
            submitBtn.disabled = true;

            try {
                const formData = new FormData(form);
                const object = {};
                formData.forEach((value, key) => object[key] = value);

                const response = await fetch('/api/contact', {
                    method: 'POST',
                    body: JSON.stringify(object),
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    // Check for a sibling success message (homepage pattern)
                    const successMessage = form.parentElement.querySelector('.form-success-message')
                        || document.getElementById('form-success-message');
                    if (successMessage) {
                        form.style.display = 'none';
                        successMessage.style.display = 'block';
                    } else {
                        // Inline form: replace with thank-you text
                        form.innerHTML = '<div class="form-success-message" style="display:block;"><div class="success-icon">✓</div><h3>Thank You!</h3><p>Your message has been sent successfully.</p></div>';
                    }
                    form.reset();
                } else {
                    const data = await response.json();
                    throw new Error(data.error || 'Form submission failed');
                }
            } catch (error) {
                console.error('Form error:', error);
                alert('There was an error sending your message. Please try again or call us directly.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    });
}

// Initialize contact forms when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initContactForms);
} else {
    initContactForms();
}
