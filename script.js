document.addEventListener('DOMContentLoaded', () => {

    function isZoomed() {
        return window.visualViewport && window.visualViewport.scale > 1.01;
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const bookWrapper = document.getElementById('flip-book-container');
            if (bookWrapper) {
                if (isZoomed()) {
                    bookWrapper.classList.add('zoomed-state');
                } else {
                    bookWrapper.classList.remove('zoomed-state');
                }
            }
        });
    }

    let activePointers = new Set();
    let zoomCooldown = false;
    let zoomTimeout;

    function protectZoom(e) {
        const isMultiTouch = e.touches && e.touches.length > 1;
        const isCurrentlyZoomed = isZoomed();

        if (isMultiTouch || isCurrentlyZoomed) {
            zoomCooldown = true;
            clearTimeout(zoomTimeout);
            e.stopPropagation(); 
        } else if (zoomCooldown) {
            e.stopPropagation();
            if (!e.touches || e.touches.length === 0) {
                clearTimeout(zoomTimeout);
                zoomTimeout = setTimeout(() => { zoomCooldown = false; }, 300);
            }
        }
    }

    window.addEventListener('touchstart', protectZoom, { capture: true, passive: true });
    window.addEventListener('touchmove', protectZoom, { capture: true, passive: true });
    window.addEventListener('touchend', protectZoom, { capture: true, passive: true });
    window.addEventListener('pointerdown', protectZoom, { capture: true, passive: true });
    window.addEventListener('pointerup', protectZoom, { capture: true, passive: true });

    const bookWrapper = document.getElementById('flip-book-container');
    const loadingScreen = document.getElementById('loading');
    const mainHeading = document.getElementById('main-heading');
    const startMenu = document.getElementById('start-menu');
    const endOfBookMenu = document.getElementById('end-of-book-menu');
    const menuPositioner = document.getElementById('menu-positioner');
    const langLinks = document.querySelectorAll('[data-lang]');
    const bookView = document.getElementById('book-view');
    const gridView = document.getElementById('grid-view');
    const legalView = document.getElementById('legal-view');
    
    let pageFlip = null; 
    let currentLang = 'de'; 
    let currentBook = 'book_1'; 
    let currentTitleIndex = 0; 
    let isGridLoading = false; 
    let isInternalHashUpdate = false; 
    let isInitialLoad = true; 
    const extension = '.webp'; 
    
    let currentImgW = 1123; 
    let currentImgH = 794;
    
    // Großes X in den Übersetzungen für den Home-Button
    const translations = {
        'de': { titles: ["es ist ein buch", "blätter herum", "architekturdesign", "daniroesch.de"], allBooks: "- alle bücher -", backToStart: "- zurück zum anfang -", close: "x schließen", home: "X" },
        'en': { titles: ["it´s a book", "flip around", "architectural design", "daniroesch.de"], allBooks: "- all books -", backToStart: "- back to start -", close: "x close", home: "X" },
        'es': { titles: ["es un libro", "hojea las páginas", "diseño arquitectónico", "daniroesch.de"], allBooks: "- todos los livros -", backToStart: "- volver al inicio -", close: "x cerrar", home: "X" },
        'pt': { titles: ["é um libro", "folheie as páginas", "desenho arquitectónico", "daniroesch.de"], allBooks: "- todos os livros -", backToStart: "- voltar ao início -", close: "x fechar", home: "X" }
    };

    function getHashParams() {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        return {
            view: params.get('view') || 'book',
            book: params.get('book') || 'book_1',
            lang: params.get('lang') || 'de',
            page: parseInt(params.get('page')) || 0
        };
    }

    async function handleRouting() {
        if (isInternalHashUpdate) return;

        let params = getHashParams();

        if (isInitialLoad) {
            isInitialLoad = false;
            if (params.view === 'book' || !params.view) {
                params.page = 0;
                isInternalHashUpdate = true;
                window.location.hash = `view=book&book=${params.book}&lang=${params.lang}&page=0`;
                setTimeout(() => { isInternalHashUpdate = false; }, 50);
            }
        }

        if (params.view === 'grid') {
            bookView.style.display = 'none';
            legalView.style.display = 'none';
            gridView.style.display = 'block';
            initGrid();
            return;
        }

        if (params.view === 'legal') {
            bookView.style.display = 'none';
            gridView.style.display = 'none';
            legalView.style.display = 'block';
            return;
        }

        gridView.style.display = 'none';
        legalView.style.display = 'none';
        bookView.style.display = 'block';

        if (currentBook !== params.book || currentLang !== params.lang || !pageFlip) {
            await loadBook(params.book, params.lang, params.page);
        } else {
            if (pageFlip && pageFlip.getCurrentPageIndex() !== params.page) {
                pageFlip.flip(params.page);
            }
        }
    }

    function updateBookSize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        const bookSpreadW = currentImgW * 2;
        const bookSpreadH = currentImgH;
        
        const bookAspectRatio = bookSpreadW / bookSpreadH;
        const windowRatio = w / h;
        
        let finalWidth, finalHeight;
        
        if (bookAspectRatio > windowRatio) {
            finalWidth = w;
            finalHeight = w / bookAspectRatio;
        } else {
            finalHeight = h;
            finalWidth = h * bookAspectRatio;
        }
        
        document.body.style.setProperty('--real-book-width', finalWidth + 'px');
        document.body.style.setProperty('--real-book-height', finalHeight + 'px');
        
        const bookContainer = document.getElementById('book');
        if (bookContainer) {
            bookContainer.style.width = finalWidth + 'px';
            bookContainer.style.height = finalHeight + 'px';
        }
    }

    let lastWinW = window.innerWidth;
    let lastWinH = window.innerHeight;

    function handleResize() {
        const currentW = window.innerWidth;
        const currentH = window.innerHeight;
        
        const diffW = Math.abs(currentW - lastWinW);
        const diffH = Math.abs(currentH - lastWinH);

        if (diffW > 10 || diffH > 120) {
            lastWinW = currentW;
            lastWinH = currentH;
            updateBookSize();
            if (pageFlip) pageFlip.update();
        }
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            lastWinW = window.innerWidth;
            lastWinH = window.innerHeight;
            updateBookSize();
            if (pageFlip) pageFlip.update();
        }, 200);
    });

    function updateHeading() {
        if (translations[currentLang]) {
            mainHeading.innerText = translations[currentLang].titles[currentTitleIndex];
        }
    }

    function cycleTitle() {
        currentTitleIndex = (currentTitleIndex + 1) % 4;
        updateHeading();
    }

    async function checkImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ exists: true, width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ exists: false });
            img.src = url;
        });
    }

    async function initGrid() {
        if (isGridLoading) return; 
        isGridLoading = true;

        const gridContainer = document.querySelector('.grid-container');
        gridContainer.innerHTML = ''; 
        
        const gridPromises = [];
        for (let b = 1; b <= 20; b++) {
            const bookName = `book_${b}`;
            const folder = `${bookName}/pages_${currentLang}/`;
            gridPromises.push(
                checkImage(`${folder}0${extension}`).then(res => ({
                    index: b,
                    name: bookName,
                    folder: folder,
                    exists: res.exists
                }))
            );
        }

        const gridResults = await Promise.all(gridPromises);
        
        for (const book of gridResults) {
            if (book.exists) {
                const tile = document.createElement('div');
                tile.className = 'book-tile';
                tile.innerHTML = `<img src="${book.folder}0${extension}" alt="${book.name}">`;
                tile.onclick = () => {
                    window.location.hash = `view=book&book=${book.name}&lang=${currentLang}&page=0`;
                };
                gridContainer.appendChild(tile);
            } else {
                break; 
            }
        }
        isGridLoading = false;
    }

    async function loadBook(bookName, lang, initialPage = 0) {
        currentBook = bookName;
        currentLang = lang;
        
        updateHeading();
        document.querySelectorAll('.all-books-trigger').forEach(el => el.innerText = translations[lang].allBooks);
        document.getElementById('grid-heading').innerText = translations[lang].allBooks;
        document.getElementById('back-to-book-btn').innerText = translations[lang].close;
        document.getElementById('close-legal').innerText = translations[lang].close;
        document.getElementById('back-to-start-btn').innerText = translations[lang].backToStart;

        const homeBtn = document.getElementById('home-btn');
        if (homeBtn) homeBtn.innerText = translations[lang].home;

        langLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-lang="${lang}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        if (pageFlip) { pageFlip.destroy(); pageFlip = null; }
        bookWrapper.innerHTML = '<div id="book"></div>';
        bookWrapper.style.opacity = '0';
        loadingScreen.style.display = 'block';
        
        const folder = `${bookName}/pages_${lang}/`;
        const imageUrls = [];
        
        const cover = await checkImage(`${folder}0${extension}`);
        if (cover.exists) { 
            imageUrls.push(`0${extension}`); 
            currentImgW = cover.width; 
            currentImgH = cover.height; 
        } else {
            currentImgW = 1123;
            currentImgH = 794;
        }

        const batchSize = 10;
        let pageCounter = 1;
        let checking = true;

        while (checking && pageCounter < 150) {
            const promises = [];
            for (let i = 0; i < batchSize; i++) {
                const pageId = pageCounter + i;
                promises.push(checkImage(`${folder}${pageId}${extension}`).then(res => ({ id: pageId, exists: res.exists })));
            }
            
            const results = await Promise.all(promises);
            results.sort((a, b) => a.id - b.id);
            
            for (const res of results) {
                if (res.exists) {
                    imageUrls.push(`${res.id}${extension}`);
                    pageCounter++;
                } else {
                    checking = false;
                    break;
                }
            }
        }

        const back = await checkImage(`${folder}-1${extension}`);
        if (back.exists) { imageUrls.push(`-1${extension}`); }

        buildBook(imageUrls, folder, currentImgW, currentImgH, initialPage);
    }

    function buildBook(imageUrls, folder, width, height, initialPage = 0) {
        const bookContainer = document.getElementById('book');
        
        imageUrls.forEach((file) => {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            pageDiv.innerHTML = `<img src="${folder}${file}" alt="portfolio seite">`;
            bookContainer.appendChild(pageDiv);
        });

        updateBookSize();
        bookContainer.offsetHeight;

        pageFlip = new St.PageFlip(bookContainer, {
            width: width, height: height, size: "stretch", 
            showCover: true, mobileScrollSupport: true, usePortrait: false
        });
        
        pageFlip.loadFromHTML(document.querySelectorAll('.page'));
        loadingScreen.style.display = 'none';
        bookWrapper.style.opacity = '1';
        
        if (initialPage > 0 && initialPage < pageFlip.getPageCount()) {
            pageFlip.flip(initialPage);
        }

        const homeBtn = document.getElementById('home-btn');
        const fsBtn = document.getElementById('fullscreen-btn');
        
        menuPositioner.style.zIndex = '3';
        startMenu.style.pointerEvents = 'auto';
        startMenu.style.opacity = '1';
        startMenu.querySelector('.menu-wrapper').style.transform = 'translateX(0)';

        endOfBookMenu.style.display = 'flex'; 
        endOfBookMenu.style.pointerEvents = 'none';
        endOfBookMenu.style.opacity = '0'; 
        endOfBookMenu.querySelector('.menu-wrapper').style.transform = 'translateX(-40px)';

        const startPage = pageFlip.getCurrentPageIndex();
        const totalPages = pageFlip.getPageCount();
        
        // Beide UI-Buttons auf der ersten und letzten Seite unsichtbar machen
        if (startPage > 0 && startPage < totalPages - 2) {
            if(homeBtn) { homeBtn.style.opacity = '1'; homeBtn.style.pointerEvents = 'auto'; }
            if(fsBtn) { fsBtn.style.opacity = '1'; fsBtn.style.pointerEvents = 'auto'; }
        } else {
            if(homeBtn) { homeBtn.style.opacity = '0'; homeBtn.style.pointerEvents = 'none'; }
            if(fsBtn) { fsBtn.style.opacity = '0'; fsBtn.style.pointerEvents = 'none'; }
        }

        if (startPage > 0) {
            if (startPage >= totalPages - 2) {
                menuPositioner.style.zIndex = '3';
                endOfBookMenu.style.pointerEvents = 'auto';
                endOfBookMenu.style.opacity = '1';
                endOfBookMenu.querySelector('.menu-wrapper').style.transform = 'translateX(0)';
                startMenu.style.opacity = '0';
                startMenu.style.pointerEvents = 'none';
            } else {
                menuPositioner.style.zIndex = '1';
                startMenu.style.opacity = '0';
                startMenu.style.pointerEvents = 'none';
                endOfBookMenu.style.opacity = '0';
            }
        }

        pageFlip.on('flip', (e) => {
            const targetPage = e.data; 
            const currentPage = pageFlip.getCurrentPageIndex();
            const totalPages = pageFlip.getPageCount();
            
            const startWrapper = startMenu.querySelector('.menu-wrapper');
            const endWrapper = endOfBookMenu.querySelector('.menu-wrapper');
            
            startMenu.style.opacity = '0';
            startMenu.style.pointerEvents = 'none';
            endOfBookMenu.style.opacity = '0';
            endOfBookMenu.style.pointerEvents = 'none';
            menuPositioner.style.zIndex = '1';

            // FIX: Beide Buttons synchron steuern (Ausblenden auf Start- UND Endseite)
            if (targetPage === 0 || targetPage >= totalPages - 2) {
                if(homeBtn) { homeBtn.style.opacity = '0'; homeBtn.style.pointerEvents = 'none'; }
                if(fsBtn) { fsBtn.style.opacity = '0'; fsBtn.style.pointerEvents = 'none'; }
            } else {
                if(homeBtn) { homeBtn.style.opacity = '1'; homeBtn.style.pointerEvents = 'auto'; }
                if(fsBtn) { fsBtn.style.opacity = '1'; fsBtn.style.pointerEvents = 'auto'; }
            }
            
            if (targetPage === 0) {
                startMenu.style.opacity = '1'; 
                startMenu.style.pointerEvents = 'auto';
                startWrapper.style.transition = 'none';
                startWrapper.style.transform = 'translateX(40px)'; 
                startWrapper.offsetHeight; 
                startWrapper.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                startWrapper.style.transform = 'translateX(0)';
            } else if (currentPage === 0) {
                startWrapper.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                startWrapper.style.transform = 'translateX(40px)'; 
            }

            if (targetPage >= totalPages - 2) {
                endOfBookMenu.style.opacity = '1'; 
                endOfBookMenu.style.pointerEvents = 'auto';
                endWrapper.style.transition = 'none';
                endWrapper.style.transform = 'translateX(-40px)';
                endWrapper.offsetHeight; 
                endWrapper.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                endWrapper.style.transform = 'translateX(0)';
            } else if (currentPage >= totalPages - 2) {
                endWrapper.style.transition = 'transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';
                endWrapper.style.transform = 'translateX(-40px)';
            }

            isInternalHashUpdate = true;
            window.location.hash = `view=book&book=${currentBook}&lang=${currentLang}&page=${targetPage}`;
            setTimeout(() => { isInternalHashUpdate = false; }, 50);
        });

        pageFlip.on('changeState', (e) => {
            const state = e.data; 
            const currentPage = pageFlip.getCurrentPageIndex();
            const totalPages = pageFlip.getPageCount();

            if (state !== 'read') {
                startMenu.style.opacity = '0';
                startMenu.style.pointerEvents = 'none';
                endOfBookMenu.style.opacity = '0';
                endOfBookMenu.style.pointerEvents = 'none';
                menuPositioner.style.zIndex = '1';
            } else {
                if (currentPage === 0) {
                    menuPositioner.style.zIndex = '3'; 
                    startMenu.style.pointerEvents = 'auto';
                    startMenu.style.opacity = '1'; 
                    endOfBookMenu.style.pointerEvents = 'none';
                    endOfBookMenu.style.opacity = '0'; 
                    cycleTitle(); 
                } else if (currentPage >= totalPages - 2) {
                    menuPositioner.style.zIndex = '3';
                    endOfBookMenu.style.pointerEvents = 'auto';
                    endOfBookMenu.style.opacity = '1'; 
                    startMenu.style.pointerEvents = 'none';
                    startMenu.style.opacity = '0'; 
                } else {
                    menuPositioner.style.zIndex = '1'; 
                    startMenu.style.opacity = '0'; 
                    startMenu.style.pointerEvents = 'none';
                    endOfBookMenu.style.opacity = '0'; 
                    endOfBookMenu.style.pointerEvents = 'none';
                }
            }
        });

        setTimeout(() => {
            updateBookSize();
            if (pageFlip) pageFlip.update();
            
            setTimeout(() => {
                if (pageFlip && pageFlip.getCurrentPageIndex() === 0) {
                    menuPositioner.style.zIndex = '3';
                    startMenu.style.pointerEvents = 'auto';
                }
            }, 100);
        }, 150);
    }

    // --- GLOBALE EVENTS ---

    mainHeading.addEventListener('click', cycleTitle);

    langLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = e.currentTarget.getAttribute('data-lang'); 
            window.location.hash = `view=book&book=${currentBook}&lang=${lang}&page=0`;
        });
    });

    async function toggleFullscreen() {
        const elem = document.documentElement;
        try {
            if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                if (elem.requestFullscreen) {
                    await elem.requestFullscreen();
                } else if (elem.webkitRequestFullscreen) {
                    await elem.webkitRequestFullscreen();
                } else if (elem.msRequestFullscreen) {
                    await elem.msRequestFullscreen();
                }
                
                if (screen.orientation && screen.orientation.lock) {
                    try {
                        await screen.orientation.lock('landscape');
                    } catch (err) {
                        console.log("Auto-Querformat blockiert.");
                    }
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
                
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
            }
        } catch (error) {
            console.warn("Vollbild Fehler:", error);
        }
    }

    document.addEventListener('click', (e) => {
        if (e.target.id === 'back-to-start-btn') {
            e.preventDefault();
            if (pageFlip && !isZoomed()) { pageFlip.flip(0); }
        }
        
        if (e.target.id === 'home-btn') {
            e.preventDefault();
            if (pageFlip && !isZoomed()) { pageFlip.flip(0); }
        }

        if (e.target.classList.contains('all-books-trigger')) {
            e.preventDefault();
            window.location.hash = `view=grid`;
        }
        
        if (e.target.id === 'link-email') {
            navigator.clipboard.writeText('arch.daniroesch@gmail.com').then(() => {
                const originalText = e.target.innerText;
                e.target.innerText = 'kopiert!';
                setTimeout(() => { e.target.innerText = originalText; }, 2000);
            });
        }
        
        if (e.target.id === 'fullscreen-btn') {
            e.preventDefault();
            toggleFullscreen();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (bookView.style.display !== 'none' && pageFlip) {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                if (e.key === ' ') e.preventDefault(); 
                if (!isZoomed()) pageFlip.flipNext();
            } else if (e.key === 'ArrowLeft') {
                if (!isZoomed()) pageFlip.flipPrev();
            }
        }
    });

    document.getElementById('link-legal').onclick = (e) => { e.preventDefault(); window.location.hash = `view=legal`; };
    document.getElementById('close-legal').onclick = (e) => { 
        e.preventDefault(); 
        const page = pageFlip ? pageFlip.getCurrentPageIndex() : 0;
        window.location.hash = `view=book&book=${currentBook}&lang=${currentLang}&page=${page}`; 
    };
    document.getElementById('back-to-book-btn').onclick = (e) => { 
        e.preventDefault(); 
        const page = pageFlip ? pageFlip.getCurrentPageIndex() : 0;
        window.location.hash = `view=book&book=${currentBook}&lang=${currentLang}&page=${page}`; 
    };

    window.addEventListener('hashchange', handleRouting);

    handleRouting();
});@font-face {
    font-family: 'Montserrat';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('fonts/montserrat-400.woff2') format('woff2');
}

@font-face {
    font-family: 'Montserrat';
    font-style: normal;
    font-weight: 500;
    font-display: swap;
    src: url('fonts/montserrat-500.woff2') format('woff2');
}

@font-face {
    font-family: 'Montserrat';
    font-style: normal;
    font-weight: 700;
    font-display: swap;
    src: url('fonts/montserrat-700.woff2') format('woff2');
}

@font-face {
    font-family: 'Montserrat';
    font-style: normal;
    font-weight: 800;
    font-display: swap;
    src: url('fonts/montserrat-800.woff2') format('woff2');
}

*, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Montserrat', sans-serif; 
}

html, body {
    touch-action: pan-x pan-y pinch-zoom !important;
}

body {
    background-color: #ffffff;
    overflow: hidden; 
    color: #000;
    width: 100vw;
    height: 100vh;
    height: 100dvh; 
}

#book-view {
    position: relative;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
}

#menu-positioner, #ui-layer {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: var(--real-book-width, 100vw);
    height: var(--real-book-height, 100vh);
    pointer-events: none; 
}

#menu-positioner { z-index: 3; }
#ui-layer { z-index: 100; } 

/* Symmetrisches Styling & Zentrierung für beide Eck-Buttons */
.ui-btn {
    position: absolute;
    right: clamp(8px, calc(var(--real-book-height) * 0.035), 20px);
    width: 4.5em; /* FIX: Gleiche Breite für beide Buttons zwingt sie in eine Linie */
    text-align: center; /* FIX: Zentriert das X und die Klammer exakt übereinander */
    white-space: nowrap;
    color: #888;
    text-decoration: none;
    font-weight: 400;
    font-size: clamp(10px, calc(var(--real-book-height) * 0.045), 20px);
    opacity: 0;
    pointer-events: none; 
    transition: color 0.2s, font-weight 0.2s, opacity 0.3s ease;
}
.ui-btn:hover {
    color: #000;
    font-weight: 800;
}

/* Positionierungen Oben & Unten */
#home-btn {
    top: clamp(8px, calc(var(--real-book-height) * 0.035), 20px);
}
#fullscreen-btn {
    bottom: clamp(8px, calc(var(--real-book-height) * 0.035), 20px);
}

.static-menu {
    position: absolute;
    top: 0;
    left: 0; 
    width: 50%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: auto; 
    opacity: 1;
}

#end-of-book-menu {
    position: absolute;
    top: 0;
    right: 0; 
    width: 50%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    pointer-events: auto;
    opacity: 0; 
}

.menu-wrapper {
    display: flex;
    flex-direction: column;
    align-items: stretch; 
    will-change: transform; 
    padding: 0 10px;
}

h1 {
    font-size: clamp(14px, calc(var(--real-book-height) * 0.055), 26px); 
    font-weight: 800;
    text-align: center;
    white-space: nowrap; 
    margin-bottom: 0.5rem;
    text-transform: lowercase;
    color: #a0a0a0; 
    cursor: pointer;
    transition: color 0.3s ease;
    letter-spacing: normal; 
}

h1:hover { color: #000; }

.menu-row {
    display: flex;
    justify-content: space-between; 
    align-items: center;
    font-size: clamp(11px, calc(var(--real-book-height) * 0.04), 20px); 
    color: #888;
    margin-bottom: 0.3rem; 
    letter-spacing: normal;
}

.bracket { font-weight: 400; }

.menu-links { flex-grow: 1; text-align: center; text-transform: lowercase; }
.menu-links a { color: #888; text-decoration: none; transition: color 0.2s; font-weight: 400; }
.menu-links a:hover, .menu-links a.active { color: #000; font-weight: 800; }

.legal-links {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px; 
    margin-top: clamp(8px, calc(var(--real-book-height) * 0.04), 20px); 
    font-size: clamp(9px, calc(var(--real-book-height) * 0.03), 14px); 
    text-transform: lowercase;
    letter-spacing: normal;
}

.legal-links a { color: #a0a0a0; text-decoration: none; transition: color 0.2s; }
.legal-links a:hover { color: #000; }

.flip-book-container, 
.flip-book-container *, 
.st-page-flip {
    touch-action: pan-x pan-y pinch-zoom !important;
}

.flip-book-container.zoomed-state {
    pointer-events: none !important;
}

.flip-book-container {
    position: absolute;
    top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh;
    display: flex; justify-content: center; align-items: center;
    z-index: 2;
    opacity: 0; transition: opacity 0.5s ease;
}

#loading {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    font-size: 1.2rem; color: #888; z-index: 10; text-transform: lowercase;
}

.page { background-color: #ffffff; position: relative; }
.page img { width: 100%; height: 100%; object-fit: cover; box-shadow: inset 0 0 20px rgba(0,0,0,0.05); }

#grid-view, #legal-view {
    position: absolute; top: 0; left: 0; width: 100vw; height: 100vh; height: 100dvh;
    padding: 5vw; background: #fff; overflow-y: auto; z-index: 20;
}

.grid-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; }
.grid-header h2 { font-weight: 800; font-size: 1.5rem; text-transform: lowercase; }
.grid-header a { color: #000; text-decoration: none; font-weight: 800; text-transform: lowercase; }

.grid-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 30px; }
.book-tile { cursor: pointer; transition: transform 0.2s; }
.book-tile:hover { transform: scale(1.02); }
.book-tile img { height: 300px; width: auto; object-fit: cover; background: #f0f0f0; box-shadow: 0 5px 15px rgba(0,0,0,0.1); display: block; }
.legal-content { max-width: 800px; margin: 0 auto; }
.legal-image { display: block; margin: 0 auto; max-width: 100%; height: auto; box-shadow: 0 5px 25px rgba(0,0,0,0.05); }

@media (max-width: 600px) {
    .book-tile img { height: 200px; }
}
