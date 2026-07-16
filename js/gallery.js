document.addEventListener('DOMContentLoaded', () => {

    /* ==============================================================
       FILTER LOGIC
       ============================================================== */
    const filterBtns = document.querySelectorAll('.filter-btn');
    const bentoItems = document.querySelectorAll('.bento-item');

    function filterGallery(filterValue) {
        // Update active button
        filterBtns.forEach(btn => {
            if (btn.getAttribute('data-filter') === filterValue) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Filter items
        bentoItems.forEach(item => {
            if (filterValue === 'all' || item.getAttribute('data-group') === filterValue) {
                item.classList.remove('hidden');
                // Small animation trick
                item.style.opacity = '0';
                setTimeout(() => item.style.opacity = '1', 50);
            } else {
                item.classList.add('hidden');
            }
        });

        // Update lightbox images array based on visible items
        updateImagesArray();
    }

    // Handle button clicks
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterGallery(btn.getAttribute('data-filter'));
            // Remove hash from URL without scrolling
            history.replaceState(null, null, ' ');
        });
    });

    // Check URL hash on load (e.g., #bstudy)
    const hash = window.location.hash.substring(1);
    if (hash && ['bstudy', 'mawhiba', 'training'].includes(hash)) {
        filterGallery(hash);
    } else {
        updateImagesArray(); // Initialize array for 'all'
    }

    /* ==============================================================
       LIGHTBOX
       ============================================================== */
    const lightbox = document.getElementById('lightbox');
    const lbImg = document.getElementById('lightbox-img');
    const lbClose = document.getElementById('lightbox-close');
    const lbPrev = document.getElementById('lightbox-prev');
    const lbNext = document.getElementById('lightbox-next');
    const lbBackdrop = document.getElementById('lightbox-backdrop');
    const lbCat = document.getElementById('lightbox-cat');
    const lbTitle = document.getElementById('lightbox-title');
    const lbCounter = document.getElementById('lightbox-counter');

    let images = [];
    let currentIdx = 0;
    
    // Update the images array to only include currently visible items
    function updateImagesArray() {
        images = [];
        const visibleItems = Array.from(bentoItems).filter(item => !item.classList.contains('hidden'));
        
        visibleItems.forEach((item, index) => {
            // Update the data-index for the click handler
            item.setAttribute('data-visible-index', index);
            
            images.push({
                src: item.querySelector('img').src,
                cat: item.getAttribute('data-category') || '',
                title: item.getAttribute('data-title') || '',
            });
        });
    }

    let scale = 1;
    let panX = 0, panY = 0;
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let startPanX = 0, startPanY = 0;

    function openLightbox(idx) {
        if (images.length === 0) return;
        currentIdx = parseInt(idx);
        updateLightbox();
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
        resetZoom();
    }

    function closeLightbox() {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
        resetZoom();
    }

    function updateLightbox() {
        const item = images[currentIdx];
        if (!item) return;
        lbImg.src = item.src;
        lbImg.alt = item.title;
        lbCat.textContent = item.cat;
        lbTitle.textContent = item.title;
        lbCounter.textContent = `${currentIdx + 1} / ${images.length}`;
        resetZoom();
    }

    function goNext() {
        currentIdx = (currentIdx + 1) % images.length;
        updateLightbox();
    }

    function goPrev() {
        currentIdx = (currentIdx - 1 + images.length) % images.length;
        updateLightbox();
    }

    function resetZoom() {
        scale = 1; panX = 0; panY = 0;
        applyTransform();
        lbImg.classList.remove('zoomed', 'grabbing');
    }

    function applyTransform() {
        lbImg.style.transform = `scale(${scale}) translate(${panX}px, ${panY}px)`;
    }

    // Click to open
    bentoItems.forEach(item => {
        item.addEventListener('click', () => {
            const visibleIdx = item.getAttribute('data-visible-index');
            if (visibleIdx !== null) {
                openLightbox(visibleIdx);
            }
        });
    });

    // Close
    lbClose.addEventListener('click', closeLightbox);
    lbBackdrop.addEventListener('click', closeLightbox);

    // Nav
    lbNext.addEventListener('click', e => { e.stopPropagation(); goNext(); });
    lbPrev.addEventListener('click', e => { e.stopPropagation(); goPrev(); });

    // Keyboard
    document.addEventListener('keydown', e => {
        if (!lightbox.classList.contains('open')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowRight') goNext();
        if (e.key === 'ArrowLeft') goPrev();
    });

    // Zoom with scroll wheel
    const lbContainer = document.getElementById('lightbox-container');
    lbContainer.addEventListener('wheel', e => {
        if (!lightbox.classList.contains('open')) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.15 : 0.15;
        scale = Math.min(Math.max(scale + delta, 1), 5);
        if (scale === 1) { panX = 0; panY = 0; }
        lbImg.classList.toggle('zoomed', scale > 1);
        applyTransform();
    }, { passive: false });

    // Pan with drag
    lbImg.addEventListener('mousedown', e => {
        if (scale <= 1) return;
        isDragging = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;
        startPanX = panX;
        startPanY = panY;
        lbImg.classList.add('grabbing');
        e.preventDefault();
    });

    document.addEventListener('mousemove', e => {
        if (!isDragging) return;
        const dx = (e.clientX - dragStartX) / scale;
        const dy = (e.clientY - dragStartY) / scale;
        panX = startPanX + dx;
        panY = startPanY + dy;
        applyTransform();
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        lbImg.classList.remove('grabbing');
    });

    // Touch zoom/pan for mobile
    let touchStartDist = 0;
    let touchStartScale = 1;

    lbContainer.addEventListener('touchstart', e => {
        if (e.touches.length === 2) {
            touchStartDist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchStartScale = scale;
        } else if (e.touches.length === 1 && scale > 1) {
            isDragging = true;
            dragStartX = e.touches[0].clientX;
            dragStartY = e.touches[0].clientY;
            startPanX = panX;
            startPanY = panY;
        }
    }, { passive: true });

    lbContainer.addEventListener('touchmove', e => {
        if (e.touches.length === 2) {
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            scale = Math.min(Math.max(touchStartScale * (dist / touchStartDist), 1), 5);
            lbImg.classList.toggle('zoomed', scale > 1);
            if (scale === 1) { panX = 0; panY = 0; }
            applyTransform();
        } else if (isDragging && e.touches.length === 1) {
            const dx = (e.touches[0].clientX - dragStartX) / scale;
            const dy = (e.touches[0].clientY - dragStartY) / scale;
            panX = startPanX + dx;
            panY = startPanY + dy;
            applyTransform();
        }
    }, { passive: true });

    lbContainer.addEventListener('touchend', () => { isDragging = false; });

    // Swipe to navigate on mobile
    let swipeStartX = 0;
    lbContainer.addEventListener('touchstart', e => {
        if (e.touches.length === 1 && scale <= 1) {
            swipeStartX = e.touches[0].clientX;
        }
    }, { passive: true });

    lbContainer.addEventListener('touchend', e => {
        if (scale > 1) return;
        const diff = swipeStartX - (e.changedTouches[0]?.clientX || swipeStartX);
        if (Math.abs(diff) > 60) {
            diff > 0 ? goNext() : goPrev();
        }
    });

});
