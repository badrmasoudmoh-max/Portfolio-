document.addEventListener('DOMContentLoaded', () => {
    
    /* =========================================================================
       LOADING SCREEN
       ========================================================================= */
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        if (sessionStorage.getItem('loading_shown')) {
            loadingScreen.classList.add('hidden');
        } else {
            sessionStorage.setItem('loading_shown', 'true');
            setTimeout(() => {
                loadingScreen.classList.add('hidden');
            }, 2400);
        }
    }

    /* =========================================================================
       CUSTOM CURSOR
       ========================================================================= */
    const cursorDot = document.getElementById('cursor-dot');
    const cursorOutline = document.getElementById('cursor-outline');
    const cursorLabel = document.getElementById('cursor-label');
    
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    
    if (!isTouchDevice && cursorDot && cursorOutline) {
        let mouseX = 0, mouseY = 0;
        let outlineX = 0, outlineY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            cursorDot.style.left = mouseX + 'px';
            cursorDot.style.top = mouseY + 'px';
        });

        function animateCursor() {
            outlineX += (mouseX - outlineX) * 0.15;
            outlineY += (mouseY - outlineY) * 0.15;
            cursorOutline.style.left = outlineX + 'px';
            cursorOutline.style.top = outlineY + 'px';
            requestAnimationFrame(animateCursor);
        }
        animateCursor();

        const interactiveElements = document.querySelectorAll('a, button, .open-modal-btn, .btn, .social-btn, .gallery-img, .bento-item');
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.classList.add('expanded');
                if (cursorLabel) {
                    if (el.classList.contains('open-modal-btn') || el.classList.contains('gallery-img') || el.classList.contains('bento-item')) {
                        cursorLabel.textContent = 'View';
                    } else if (el.classList.contains('btn') || el.tagName === 'BUTTON') {
                        cursorLabel.textContent = 'Click';
                    } else {
                        cursorLabel.textContent = 'Open';
                    }
                }
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.classList.remove('expanded');
                if (cursorLabel) cursorLabel.textContent = '';
            });
        });

        document.body.style.cursor = 'none';
        interactiveElements.forEach(el => el.style.cursor = 'none');
    }

    /* =========================================================================
       THEME TOGGLE
       ========================================================================= */
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    if (themeToggleBtn) {
        const themeIcon = themeToggleBtn.querySelector('i');
        const savedTheme = localStorage.getItem('portfolio_theme') || 'dark';
        htmlElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            htmlElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('portfolio_theme', newTheme);
            updateThemeIcon(newTheme);
        });

        function updateThemeIcon(theme) {
            if (theme === 'dark') {
                themeIcon.className = 'fas fa-sun';
                themeToggleBtn.setAttribute('aria-label', 'Switch to light mode');
            } else {
                themeIcon.className = 'fas fa-moon';
                themeToggleBtn.setAttribute('aria-label', 'Switch to dark mode');
            }
        }
    }

    /* =========================================================================
       MOBILE MENU TOGGLE
       ========================================================================= */
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    if (mobileToggle && navMenu) {
        const mobileToggleIcon = mobileToggle.querySelector('i');
        mobileToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            if (navMenu.classList.contains('active')) {
                mobileToggleIcon.className = 'fas fa-xmark';
            } else {
                mobileToggleIcon.className = 'fas fa-bars';
            }
        });

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                mobileToggleIcon.className = 'fas fa-bars';
            });
        });
    }

    /* =========================================================================
       HEADER SCROLL EFFECT & ACTIVE LINK HIGHLIGHT
       ========================================================================= */
    const header = document.querySelector('.header');
    const sections = document.querySelectorAll('section');
    
    if (header) {
        window.addEventListener('scroll', () => {
            if (!header.classList.contains('gallery-header')) { // Only for main page
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }

            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (window.pageYOffset >= (sectionTop - sectionHeight / 3)) {
                    current = section.getAttribute('id');
                }
            });
            
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') && link.getAttribute('href').substring(1) === current) {
                    link.classList.add('active');
                }
            });
        });
    }

    /* =========================================================================
       SCROLL PROGRESS BAR
       ========================================================================= */
    const scrollProgress = document.getElementById('scroll-progress');
    if (scrollProgress) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.scrollY;
            const docHeight = document.documentElement.scrollHeight - window.innerHeight;
            const scrollPercent = (scrollTop / docHeight) * 100;
            scrollProgress.style.width = scrollPercent + '%';
        });
    }

    /* =========================================================================
       SCROLL INDICATOR AUTO-FADE
       ========================================================================= */
    const scrollIndicator = document.getElementById('scroll-indicator');
    if (scrollIndicator) {
        setTimeout(() => {
            scrollIndicator.classList.add('fade-out');
        }, 4000);
        
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                scrollIndicator.classList.add('fade-out');
            }
        }, { once: true });
    }

    /* =========================================================================
       HERO TEXT STAGGER ANIMATION
       ========================================================================= */
    const heroWords = document.querySelectorAll('.hero-word');
    if (heroWords.length > 0) {
        const delay = loadingScreen && !sessionStorage.getItem('loading_already_animated') ? 2600 : 300;
        sessionStorage.setItem('loading_already_animated', 'true');
        
        heroWords.forEach((word, index) => {
            setTimeout(() => {
                word.classList.add('animate');
            }, delay + (index * 120));
        });
    }

    /* =========================================================================
       SCROLL REVEAL ANIMATIONS
       ========================================================================= */
    const revealElements = document.querySelectorAll('.reveal');
    const revealOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const revealOnScroll = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, revealOptions);

    revealElements.forEach(el => {
        revealOnScroll.observe(el);
    });

    /* =========================================================================
       MAGNETIC BUTTONS
       ========================================================================= */
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    if (!isTouchDevice) {
        magneticBtns.forEach(btn => {
            btn.addEventListener('mousemove', (e) => {
                const rect = btn.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                btn.style.transform = `translate(${x * 0.25}px, ${y * 0.25}px) scale(1.03)`;
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translate(0, 0) scale(1)';
            });
        });
    }

    /* =========================================================================
       CLICK-TO-COPY EMAIL + TOAST
       ========================================================================= */
    const emailLink = document.getElementById('email-copy-link');
    const toast = document.getElementById('toast');
    
    if (emailLink && toast) {
        emailLink.addEventListener('click', (e) => {
            e.preventDefault();
            const email = emailLink.getAttribute('data-email');
            navigator.clipboard.writeText(email).then(() => {
                showToast('Copied. Now use it.');
            }).catch(() => {
                window.location.href = 'mailto:' + email;
            });
        });
    }

    function showToast(message) {
        if (!toast) return;
        const toastMsg = document.getElementById('toast-message');
        if (toastMsg) toastMsg.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2500);
    }

    /* =========================================================================
       FORM SUBMISSION
       ========================================================================= */
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            const btn = contactForm.querySelector('button[type="submit"]');
            btn.innerHTML = 'Connecting... <i class="fas fa-spinner fa-spin ms-2"></i>';
            btn.style.opacity = '0.8';
        });
    }

});
