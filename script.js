// ==========================================================================================
// 🛑 1. DEIN KONTROLLZENTRUM (HIER KANNST DU ALLES ANPASSEN) 🛑
// ==========================================================================================

const CONFIG = {
    // 📁 DEINE PROJEKTE (BÜCHER)
    books: [
        'book_1', 
        'book_2',
        'book_3',
        'book_4'
    ],

    // ✉️ DEINE KONTAKTDATEN
    email: 'arch.daniroesch@gmail.com',

    // 🌍 DEINE TEXTE & SEO-DATEN
    translations: {
        'de': { 
            titles: ["meine projekte", "schau dich um", "architektur portfolio", "daniroesch.de"], 
            allBooks: "alle projekte", 
            backToStart: "zurück zum anfang", 
            close: "x", 
            home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', 
            loading: "projekt wird geladen...", 
            notAvailable: "projekt noch nicht in dieser sprache verfügbar",
            
            seoDesc: "Digitale Architektur-Projekte und Design-Portfolio von Daniel Rösch. Entdecken Sie meine Arbeiten, Entwürfe und Konzepte.", 
            seoH1: "Architektur Portfolio von Daniel Rösch", 
            seoIntro: "Willkommen auf dem digitalen Portfolio von Daniel Rösch. Hier finden Sie meine Architekturprojekte und Entwürfe:", 
            seoContact: "Kontaktieren Sie mich gerne unter arch.daniroesch@gmail.com für Projektanfragen."
        },
        'en': { 
            titles: ["my projects", "take a look", "architecture portfolio", "daniroesch.de"], 
            allBooks: "all projects", 
            backToStart: "back to start", 
            close: "x", 
            home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', 
            loading: "loading project...", 
            notAvailable: "project not yet available in this language",
            
            seoDesc: "Digital architecture projects and design portfolio of Daniel Rösch. Explore my work and concepts.", 
            seoH1: "Architecture Portfolio by Daniel Rösch", 
            seoIntro: "Welcome to the digital portfolio of Daniel Rösch. Here you can find my architecture projects:", 
            seoContact: "Feel free to contact me at arch.daniroesch@gmail.com for inquiries."
        },
        'es': { 
            titles: ["mis proyectos", "echa un vistazo", "portafolio de arquitectura", "daniroesch.de"], 
            allBooks: "todos los proyectos", 
            backToStart: "volver al inicio", 
            close: "x", 
            home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', 
            loading: "cargando proyecto...", 
            notAvailable: "proyecto aún no disponible en este idioma",
            
            seoDesc: "Proyectos de arquitectura digital y portafolio de diseño de Daniel Rösch. Explora mi trabajo y conceptos.", 
            seoH1: "Portafolio de Arquitectura de Daniel Rösch", 
            seoIntro: "Bienvenido al portafolio digital de Daniel Rösch. Aquí puedes encontrar mis proyectos:", 
            seoContact: "Contáctame en arch.daniroesch@gmail.com para consultas."
        },
        'pt': { 
            titles: ["meus projetos", "dê uma olhada", "portfólio de arquitetura", "daniroesch.de"], 
            allBooks: "todos os projetos", 
            backToStart: "voltar ao início", 
            close: "x", 
            home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', 
            loading: "carregando projeto...", 
            notAvailable: "projeto ainda não disponível neste idioma",
            
            seoDesc: "Projetos de arquitetura digital e portfólio de design de Daniel Rösch. Explore meu trabalho e conceitos.", 
            seoH1: "Portfólio de Arquitetura de Daniel Rösch", 
            seoIntro: "Bem-vindo ao portfólio digital de Daniel Rösch. Aqui você pode encontrar meus projetos:", 
            seoContact: "Contate-me em arch.daniroesch@gmail.com para dúvidas."
        }
    }
};

// ==========================================================================================
// ⚙️ 2. SYSTEM-LOGIK (MASCHINENRAUM) ⚙️
// AB HIER NICHTS MEHR ÄNDERN
// ==========================================================================================

document.addEventListener('DOMContentLoaded', () => {

    // --- A. E-MAIL SETUP ---
    const emailLinkElem = document.getElementById('link-email');
    if (emailLinkElem) {
        emailLinkElem.href = `mailto:${CONFIG.email}`;
        emailLinkElem.innerText = CONFIG.email;
    }

    // --- B. ZOOM & TOUCH WÄCHTER (Mobile Optimierung) ---
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
                window.location.hash = `/${currentBook}/${currentLang}/1`;
                setTimeout(() => { window.location.reload(); }, 30);
            }
        }
    }, { passive: true });

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

    // --- C. GLOBALE SYSTEM-VARIABLEN ---
    const bookView = document.getElementById('book-view');
    const bookWrapper = document.getElementById('flip-book-container');
    const loadingScreen = document.getElementById('loading');
    const mainHeading = document.getElementById('main-heading');
    const startMenu = document.getElementById('start-menu');
    const endOfBookMenu = document.getElementById('end-of-book-menu');
    const menuPositioner = document.getElementById('menu-positioner');
    const langLinks = document.querySelectorAll('[data-lang]');
    const gridView = document.getElementById('grid-view');
    const legalView = document.getElementById('legal-view');
    
    let pageFlip = null; 
    let currentLang = 'de'; 
    let currentBook = CONFIG.books[0]; 
    let currentTitleIndex = 0; 
    let isInternalHashUpdate = false; 
    let isInitialLoad = true; 
    const extension = '.webp'; 
    
    let currentImgW = 1123; 
    let currentImgH = 794;
    
    let activeLoadId = 0; 
    let activeGridId = 0; 
    let pendingTargetPage = -1; 

    // --- D. SEO AUTOMATISIERUNG ---
    function updateSEO(lang) {
        const t = CONFIG.translations[lang] || CONFIG.translations['de'];
        
        document.title = "Daniel Rösch | " + t.titles[2]; 
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = t.seoDesc;

        let jsonLdScript = document.getElementById('seo-json-ld');
        if (!jsonLdScript) {
            jsonLdScript = document.createElement('script');
            jsonLdScript.id = 'seo-json-ld';
            jsonLdScript.type = 'application/ld+json';
            document.head.appendChild(jsonLdScript);
        }
        jsonLdScript.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": "Daniel Rösch",
            "jobTitle": "Architekt",
            "url": "https://daniroesch.github.io",
            "knowsAbout": ["Architektur", "Design", "Portfolio", "3D Visualisierung"]
        });

        let srOnlyDiv = document.getElementById('seo-hidden-text');
        if (!srOnlyDiv) {
            srOnlyDiv = document.createElement('div');
            srOnlyDiv.id = 'seo-hidden-text';
            srOnlyDiv.className = 'sr-only'; 
            document.body.insertBefore(srOnlyDiv, document.body.firstChild);
        }
        
        let projectListHTML = CONFIG.books.map(book => `<li>${book.replace(/[-_]/g, ' ')}</li>`).join('');

        srOnlyDiv.innerHTML = `
            <h1>${t.seoH1}</h1>
            <p>${t.seoIntro}</p>
            <ul>${projectListHTML}</ul>
            <p>${t.seoContact}</p>
        `;
    }

    // --- E. URL & ROUTING ---
    function getHashParams() {
        const hash = window.location.hash.replace(/^#\/?/, ''); 
        const parts = hash.split('/');

        if (parts[0] === 'grid') return { view: 'grid' };
        if (parts[0] === 'legal') return { view: 'legal' };

        const book = parts[0] || CONFIG.books[0];
        const lang = parts[1] || 'de';
        
        let pageNum = parts[2] ? parseInt(parts[2]) - 1 : 0;
        pageNum = Math.max(0, pageNum);

        return { view: 'book', book, lang, page: pageNum };
    }

    async function handleRouting() {
        if (isInternalHashUpdate) return;

        let params = getHashParams();
        updateSEO(params.lang || 'de');

        if (isInitialLoad) {
            isInitialLoad = false;
            if (params.view === 'book' || !params.view) {
                params.page = 0;
                isInternalHashUpdate = true;
                window.location.hash = `/${params.book}/${params.lang}/1`;
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

    // --- F. FENSTER-BERECHNUNG & AUSRICHTUNG ---
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

    function forceRepaintAndCenter() {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;

        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            const originalContent = viewport.content;
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            setTimeout(() => { viewport.content = originalContent; }, 300);
        }
    }

    window.addEventListener('resize', () => {
        const currentW = window.innerWidth;
        if (currentW !== lastWinW) {
            lastWinW = currentW;
            window.scrollTo(0, 0); 
            if(bookWrapper) bookWrapper.style.opacity = '0';
            updateBookSize();
            if (pageFlip) pageFlip.update();
            setTimeout(() => { if(bookWrapper) bookWrapper.style.opacity = '1'; }, 50);
        }
    });

    window.addEventListener('orientationchange', () => {
        if(bookWrapper) bookWrapper.style.opacity = '0';
        forceRepaintAndCenter(); 
        setTimeout(() => {
            lastWinW = window.innerWidth;
            updateBookSize();
            if (pageFlip) pageFlip.update();
            setTimeout(() => { if(bookWrapper) bookWrapper.style.opacity = '1'; }, 50);
        }, 250); 
    });

    function updateHeading() {
        if (CONFIG.translations[currentLang]) {
            mainHeading.innerText = CONFIG.translations[currentLang].titles[currentTitleIndex];
        }
    }

    function cycleTitle() {
        currentTitleIndex = (currentTitleIndex + 1) % 4;
        updateHeading();
    }

    // --- G. BILDER LADEN & GRID AUFBAUEN ---
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
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(url, { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
            clearTimeout(timeoutId);
            return res.ok;
        } catch (e) {
            return false;
        }
    }

    async function initGrid() {
        const myGridId = ++activeGridId; 
        const gridContainer = document.querySelector('.grid-container');
        gridContainer.innerHTML = ''; 
        
        const gridPromises = CONFIG.books.map((bookName, index) => {
            const folder = `${bookName}/pages_${currentLang}/`;
            return checkPageExists(`${folder}0${extension}`).then(exists => ({
                index: index,
                name: bookName,
                folder: folder,
                exists: exists
            }));
        });

        const gridResults = await Promise.all(gridPromises);
        if (myGridId !== activeGridId) return;

        gridContainer.innerHTML = ''; 

        for (const book of gridResults) {
            if (book.exists) {
                const tile = document.createElement('div');
                tile.className = 'book-tile';
                const niceName = book.name.replace(/[-_]/g, ' '); 
                tile.innerHTML = `<img src="${book.folder}0${extension}" alt="${niceName}">`;
                tile.onclick = () => {
                    window.location.hash = `/${book.name}/${currentLang}/1`;
                };
                gridContainer.appendChild(tile);
            }
        }
    }

    // --- H. BUCH AUFBAUEN & BLÄTTER-LOGIK ---
    async function loadBook(bookName, lang, initialPage = 0) {
        const myLoadId = ++activeLoadId;

        currentBook = bookName;
        currentLang = lang;
        const t = CONFIG.translations[lang];
        
        const homeBtn = document.getElementById('home-btn');
        const fsBtn = document.getElementById('fullscreen-btn');
        if (homeBtn) { homeBtn.style.opacity = '0'; homeBtn.style.pointerEvents = 'none'; }
        if (fsBtn) { fsBtn.style.opacity = '0'; fsBtn.style.pointerEvents = 'none'; }

        if (menuPositioner) menuPositioner.style.visibility = 'hidden'; 
        updateHeading();
        
        loadingScreen.innerHTML = `
            <div class="menu-wrapper">
                <div class="menu-row">
                    <span class="bracket">[</span>
                    <span class="menu-links">${t.loading}</span>
                    <span class="bracket">]</span>
                </div>
            </div>
        `;
        
        document.querySelectorAll('.all-books-trigger').forEach(el => el.innerText = t.allBooks);
        document.getElementById('grid-heading').innerText = t.allBooks;
        document.getElementById('back-to-book-btn').innerText = t.close;
        document.getElementById('close-legal').innerText = t.close;
        document.getElementById('back-to-start-btn').innerText = t.backToStart;
        if (homeBtn) homeBtn.innerHTML = t.home;

        langLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-lang="${lang}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        if (pageFlip) { pageFlip.destroy(); pageFlip = null; }
        bookWrapper.innerHTML = '<div id="book"></div>';
        bookWrapper.style.opacity = '0';
        loadingScreen.style.display = 'flex'; 
        
        const folder = `${bookName}/pages_${lang}/`;
        const imageUrls = [];
        
        const cover = await loadCoverImage(`${folder}0${extension}`);
        if (myLoadId !== activeLoadId) return;

        if (cover.exists) { 
            imageUrls.push(`0${extension}`); 
            currentImgW = cover.width; 
            currentImgH = cover.height; 
        } else {
            loadingScreen.innerHTML = `
                <div class="menu-wrapper">
                    <div class="menu-row" style="margin-bottom: 0.8rem;">
                        <span class="bracket">[</span>
                        <span class="menu-links">${t.notAvailable}</span>
                        <span class="bracket">]</span>
                    </div>
                    <div class="menu-row">
                        <span class="bracket">[</span>
                        <span class="menu-links">
                            <a href="#/grid" class="all-books-trigger">${t.allBooks}</a>
                        </span>
                        <span class="bracket">]</span>
                    </div>
                </div>
            `;
            return; 
        }

        const batchSize = 3;
        let pageCounter = 1;
        let checking = true;

        while (checking) {
            if (myLoadId !== activeLoadId) return;
            const promises = [];
            for (let i = 0; i < batchSize; i++) {
                promises.push(checkPageExists(`${folder}${pageCounter + i}${extension}`));
            }
            
            const results = await Promise.all(promises);
            if (myLoadId !== activeLoadId) return;

            for (let i = 0; i < batchSize; i++) {
                if (results[i]) {
                    imageUrls.push(`${pageCounter + i}${extension}`);
                } else {
                    checking = false;
                    break;
                }
            }
            if (checking) pageCounter += batchSize;
        }

        const back = await checkPageExists(`${folder}-1${extension}`);
        if (myLoadId !== activeLoadId) return;
        if (back) { imageUrls.push(`-1${extension}`); }

        buildBook(imageUrls, folder, currentImgW, currentImgH, initialPage);
    }

    function buildBook(imageUrls, folder, width, height, initialPage = 0) {
        const bookContainer = document.getElementById('book');
        const niceBookName = currentBook.replace(/[-_]/g, ' ');

        imageUrls.forEach((file) => {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            pageDiv.innerHTML = `<img src="${folder}${file}" alt="Daniel Rösch Architektur Portfolio - ${niceBookName}">`;
            bookContainer.appendChild(pageDiv);
        });

        updateBookSize();
        bookContainer.offsetHeight;

        pageFlip = new St.PageFlip(bookContainer, {
            width: width, height: height, size: "stretch", 
            showCover: true, 
            mobileScrollSupport: false, 
            usePortrait: false
        });
        
        pageFlip.loadFromHTML(bookContainer.querySelectorAll('.page'));
        loadingScreen.style.display = 'none';
        bookWrapper.style.opacity = '1';
        
        if (initialPage > 0 && initialPage < pageFlip.getPageCount()) {
            pageFlip.flip(initialPage);
        }

        const homeBtn = document.getElementById('home-btn');
        const fsBtn = document.getElementById('fullscreen-btn');
        
        menuPositioner.style.zIndex = '3';
        startMenu.style.pointerEvents = 'auto';
        startMenu.style.transition = 'opacity 0.3s ease';
        startMenu.style.opacity = '1'; 
        
        endOfBookMenu.style.display = 'flex'; 
        endOfBookMenu.style.pointerEvents = 'none';
        endOfBookMenu.style.transition = 'none';
        endOfBookMenu.style.opacity = '0'; 

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
                endOfBookMenu.style.transition = 'opacity 0.3s ease';
                endOfBookMenu.style.opacity = '1';
                endOfBookMenu.querySelector('.menu-wrapper').style.transform = 'translateX(0)';
                
                startMenu.style.transition = 'none'; 
                startMenu.style.opacity = '0';
                startMenu.style.pointerEvents = 'none';
            } else {
                menuPositioner.style.zIndex = '1';
                startMenu.style.transition = 'none';
                startMenu.style.opacity = '0';
                startMenu.style.pointerEvents = 'none';
                endOfBookMenu.style.transition = 'none';
                endOfBookMenu.style.opacity = '0';
            }
        }

        // ===================================================================================
        // 🚀 DIE ZENTRALE BLÄTTER-LOGIK
        // ===================================================================================
        pageFlip.on('flip', (e) => {
            const targetPage = e.data; 
            const totalPages = pageFlip.getPageCount();
            
            pendingTargetPage = targetPage;
            isInternalHashUpdate = true;
            window.location.hash = `/${currentBook}/${currentLang}/${targetPage + 1}`;

            // Buttons anpassen
            if (targetPage === 0 || targetPage >= totalPages - 2) {
                if(homeBtn) { homeBtn.style.opacity = '0'; homeBtn.style.pointerEvents = 'none'; }
                if(fsBtn) { fsBtn.style.opacity = '0'; fsBtn.style.pointerEvents = 'none'; }
            } else {
                if(homeBtn) { homeBtn.style.opacity = '1'; homeBtn.style.pointerEvents = 'auto'; }
                if(fsBtn) { fsBtn.style.opacity = '1'; fsBtn.style.pointerEvents = 'auto'; }
            }

            // NEU ERZWUNGEN: Menüs hart und SOFORT im Hintergrund platzieren!
            // Da das flip-Event beim Klick auslöst, passiert das, noch BEVOR die Buch-Seiten
            // physisch über den Bildschirm rasen. Dadurch legen die weißen Seiten den Text
            // beim Zurückblättern organisch frei.
            menuPositioner.style.zIndex = '1';
            
            // Erst alle CSS-Übergänge abschalten, um Zeitverzögerungen zu killen
            startMenu.style.transition = 'none';
            endOfBookMenu.style.transition = 'none';

            // Ein klitzekleiner Trick (offsetHeight auslesen) zwingt den Browser, das
            // 'transition: none' SOFORT anzuwenden, bevor wir die Opacity auf 1 setzen.
            void startMenu.offsetHeight; 
            void endOfBookMenu.offsetHeight;

            if (targetPage === 0) {
                // Wir schießen zur Startseite: Text SOFORT auf 1
                startMenu.style.opacity = '1';
                endOfBookMenu.style.opacity = '0'; 
            } else if (targetPage >= totalPages - 2) {
                // Wir schießen zur Endseite: Text SOFORT auf 1
                startMenu.style.opacity = '0'; 
                endOfBookMenu.style.opacity = '1';
            } else {
                // Wir blättern irgendwo in der Mitte
                startMenu.style.opacity = '0';
                endOfBookMenu.style.opacity = '0';
            }
        });

        pageFlip.on('changeState', (e) => {
            const state = e.data; 
            const currentPage = pageFlip.getCurrentPageIndex();
            const totalPages = pageFlip.getPageCount();

            if (state !== 'read') {
                // Buch in Bewegung (Corner-Fold ziehen oder langsames Blättern)
                startMenu.style.pointerEvents = 'none';
                endOfBookMenu.style.pointerEvents = 'none';
                menuPositioner.style.zIndex = '1'; 
                
                // Falls man das Blatt nur mit der Maus/dem Finger anhebt (Corner Fold):
                if (pendingTargetPage === -1) {
                    startMenu.style.transition = 'none';
                    endOfBookMenu.style.transition = 'none';
                    void startMenu.offsetHeight; 
                    void endOfBookMenu.offsetHeight;
                    
                    if (currentPage <= 2) {
                        startMenu.style.opacity = '1'; 
                        endOfBookMenu.style.opacity = '0';
                    } else if (currentPage >= totalPages - 4) {
                        startMenu.style.opacity = '0';
                        endOfBookMenu.style.opacity = '1'; 
                    } else {
                        startMenu.style.opacity = '0';
                        endOfBookMenu.style.opacity = '0';
                    }
                }
                
            } else {
                // Buch ist angekommen und liegt ruhig da
                pendingTargetPage = -1; 
                isInternalHashUpdate = false;

                if (currentPage === 0) {
                    menuPositioner.style.zIndex = '3'; 
                    startMenu.style.pointerEvents = 'auto';
                    startMenu.style.transition = 'opacity 0.3s ease'; // Weichen Fade wieder aktivieren
                    startMenu.style.opacity = '1'; 
                    
                    endOfBookMenu.style.pointerEvents = 'none';
                    endOfBookMenu.style.transition = 'none';
                    endOfBookMenu.style.opacity = '0'; 
                    cycleTitle(); 
                } else if (currentPage >= totalPages - 2) {
                    menuPositioner.style.zIndex = '3';
                    endOfBookMenu.style.pointerEvents = 'auto';
                    endOfBookMenu.style.transition = 'opacity 0.3s ease'; // Weichen Fade wieder aktivieren
                    endOfBookMenu.style.opacity = '1'; 
                    
                    startMenu.style.pointerEvents = 'none';
                    startMenu.style.transition = 'none';
                    startMenu.style.opacity = '0'; 
                } else {
                    menuPositioner.style.zIndex = '1'; 
                    startMenu.style.transition = 'none';
                    startMenu.style.opacity = '0'; 
                    startMenu.style.pointerEvents = 'none';
                    
                    endOfBookMenu.style.transition = 'none';
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
                    startMenu.style.transition = 'opacity 0.3s ease';
                    startMenu.style.opacity = '1'; 
                    endOfBookMenu.style.transition = 'none';
                    endOfBookMenu.style.opacity = '0'; 
                    menuPositioner.style.visibility = 'visible';
                }
                isInternalHashUpdate = false;
            }, 100);
        }, 150);
    }

    // --- I. KLICK- UND TASTEN-EVENTS ---
    mainHeading.addEventListener('click', cycleTitle);

    langLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = e.currentTarget.getAttribute('data-lang'); 
            window.location.hash = `/${currentBook}/${lang}/1`;
        });
    });

    async function toggleFullscreen() {
        const elem = document.documentElement;
        try {
            if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                if (elem.requestFullscreen) await elem.requestFullscreen();
                else if (elem.webkitRequestFullscreen) await elem.webkitRequestFullscreen();
                else if (elem.msRequestFullscreen) await elem.msRequestFullscreen();
                
                if (screen.orientation && screen.orientation.lock) {
                    try { await screen.orientation.lock('landscape'); } catch (err) {}
                }
            } else {
                if (document.exitFullscreen) await document.exitFullscreen();
                else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
                else if (document.msExitFullscreen) await document.msExitFullscreen();
                
                if (screen.orientation && screen.orientation.unlock) {
                    screen.orientation.unlock();
                }
            }
        } catch (error) {}
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('#back-to-start-btn') || e.target.closest('#home-btn')) {
            e.preventDefault();
            if (pageFlip && !isZoomed()) pageFlip.flip(0);
        }

        if (e.target.closest('.all-books-trigger')) {
            e.preventDefault();
            window.location.hash = `/grid`;
        }
        
        if (e.target.id === 'link-email') {
            navigator.clipboard.writeText(CONFIG.email).then(() => {
                const originalText = e.target.innerText;
                e.target.innerText = 'kopiert!';
                setTimeout(() => { e.target.innerText = originalText; }, 2000);
            });
        }
        
        if (e.target.closest('#fullscreen-btn')) {
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

    document.getElementById('link-legal').onclick = (e) => { e.preventDefault(); window.location.hash = `/legal`; };
    document.getElementById('close-legal').onclick = (e) => { 
        e.preventDefault(); 
        const page = pageFlip ? pageFlip.getCurrentPageIndex() + 1 : 1;
        window.location.hash = `/${currentBook}/${currentLang}/${page}`; 
    };
    document.getElementById('back-to-book-btn').onclick = (e) => { 
        e.preventDefault(); 
        const page = pageFlip ? pageFlip.getCurrentPageIndex() + 1 : 1;
        window.location.hash = `/${currentBook}/${currentLang}/${page}`; 
    };

    window.addEventListener('hashchange', handleRouting);
    handleRouting();
});
