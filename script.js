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

    let pullStartY = 0;
    let pullStartX = 0;

    document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            pullStartY = e.touches[0].clientY;
            pullStartX = e.touches[0].clientX;
        }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
            const pullEndY = e.changedTouches[0].clientY;
            const pullEndX = e.changedTouches[0].clientX;
            const yDiff = pullEndY - pullStartY;
            const xDiff = Math.abs(pullEndX - pullStartX);
            
            if (yDiff > 130 && xDiff < 40 && !isZoomed()) {
                window.location.hash = `view=book&book=${currentBook}&lang=${currentLang}&page=0`;
                setTimeout(() => { window.location.reload(); }, 30);
            }
        }
    }, { passive: true });


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
    
    // FIX: Alle störenden Bindestriche wurden entfernt
    const translations = {
        'de': { titles: ["es ist ein buch", "blätter herum", "architekturdesign", "daniroesch.de"], allBooks: "alle bücher", backToStart: "zurück zum anfang", close: "x schließen", home: "X", loading: "[ buch wird geladen... ]" },
        'en': { titles: ["it´s a book", "flip around", "architectural design", "daniroesch.de"], allBooks: "all books", backToStart: "back to start", close: "x close", home: "X", loading: "[ loading book... ]" },
        'es': { titles: ["es un libro", "hojea las páginas", "diseño arquitectónico", "daniroesch.de"], allBooks: "todos los libros", backToStart: "volver al inicio", close: "x cerrar", home: "X", loading: "[ cargando libro... ]" },
        'pt': { titles: ["é um livro", "folheie as páginas", "desenho arquitectónico", "daniroesch.de"], allBooks: "todos os livros", backToStart: "voltar ao início", close: "x fechar", home: "X", loading: "[ carregando livro... ]" }
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
            params.page = 0;
            if (params.view === 'book' || !params.view) {
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

    // FIX: Steuert die CSS-Klassen fit-width und fit-height für die intelligenten Icon-Positionen
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
            document.body.classList.add('fit-width');
            document.body.classList.remove('fit-height');
        } else {
            finalHeight = h;
            finalWidth = h * bookAspectRatio;
            document.body.classList.add('fit-height');
            document.body.classList.remove('fit-width');
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

    window.addEventListener('resize', () => {
        const currentW = window.innerWidth;
        if (currentW !== lastWinW) {
            lastWinW = currentW;
            updateBookSize();
            if (pageFlip) pageFlip.update();
        }
    });

    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            lastWinW = window.innerWidth;
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

    async function loadCoverImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ exists: true, width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ exists: false });
            img.src = url;
        });
    }

    async function checkPageExists(url) {
        try {
            const res = await fetch(url, { method: 'HEAD' });
            return res.ok;
        } catch (e) {
            return false;
        }
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
                checkPageExists(`${folder}0${extension}`).then(exists => ({
                    index: b,
                    name: bookName,
                    folder: folder,
                    exists: exists
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
        
        if (menuPositioner) menuPositioner.style.visibility = 'hidden'; 
        updateHeading();
        
        loadingScreen.innerText = translations[lang].loading;
        
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
        
        const cover = await loadCoverImage(`${folder}0${extension}`);
        if (cover.exists) { 
            imageUrls.push(`0${extension}`); 
            currentImgW = cover.width; 
            currentImgH = cover.height; 
        } else {
            currentImgW = 1123;
            currentImgH = 794;
        }

        const batchSize = 6;
        let pageCounter = 1;
        let checking = true;

        while (checking && pageCounter <= 200) { 
            const promises = [];
            for (let i = 0; i < batchSize; i++) {
                const pageId = pageCounter + i;
                promises.push(checkPageExists(`${folder}${pageId}${extension}`).then(exists => ({ id: pageId, exists: exists })));
            }
            
            const results = await Promise.all(promises);
            results.sort((a, b) => a.id - b.id);
            
            for (const res of results) {
                if (res.exists) {
                    imageUrls.push(`${res.id}${extension}`);
                } else {
                    checking = false;
                    break;
                }
            }
            if (checking) pageCounter += batchSize;
        }

        const back = await checkPageExists(`${folder}-1${extension}`);
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
        
        endOfBookMenu.style.display = 'flex'; 
        endOfBookMenu.style.pointerEvents = 'none';
        endOfBookMenu.style.opacity = '0'; 
        endOfBookMenu.querySelector('.menu-wrapper').style.transform = 'translateX(-40px)';

        const startPage = pageFlip.getCurrentPageIndex();
        const totalPages = pageFlip.getPageCount();
        
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
                    menuPositioner.style.visibility = 'visible';
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
        if (e.target.id === 'back-to-start-btn' || e.target.id === 'home-btn') {
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
});
