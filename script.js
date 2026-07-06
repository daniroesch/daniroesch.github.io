// ==========================================================================================
// 🛑 1. DEIN KONTROLLZENTRUM (HIER KANNST DU ALLES ANPASSEN) 🛑
// ==========================================================================================

const CONFIG = {
    // 📁 ÖFFENTLICHE PROJEKTE (Erscheinen im Grid-Menü) -> ⚠️ ECHTE NAMEN EINTRAGEN ⚠️
    books: [
        'book_1', 
        'book_2',
        'book_3',
        'book_4'
    ],

    // 🕵️ UNSICHTBARE PROJEKTE (Nur per Direktlink erreichbar)
    hiddenBooks: [
        'geheim_haus' 
    ],

    // 🧊 DEINE 3D MODELLE
    threedee: {
        'book_1': { 
            5: '5.glb'
        },
        'geheim_haus': {
            3: 'geheimes_modell.glb'
        }
    },

    // 🎬 DEINE VIDEOS (Unterstützt 'youtube', 'vimeo' und 'local')
    videos: {
        'book_1': {
            // Teste es! Der Müll (&t) wird jetzt vollautomatisch herausgefiltert.
            2: { type: 'youtube', id: 'fcPWJ-4ziXY&t' }, 
            4: { type: 'vimeo', id: '525692078' },      
            6: { type: 'local', id: 'hero/diagramm.mp4' } 
        }
    },

    // ✉️ DEINE KONTAKTDATEN
    email: 'arch.daniroesch@gmail.com',

    // 🌍 DEINE TEXTE & SEO-DATEN
    translations: {
        'de': { 
            titles: ["meine projekte", "schau dich um", "architektur portfolio", "daniroesch.de"], 
            allBooks: "alle projekte", 
            backToStart: "zurück zum anfang", 
            nextProject: "nächstes projekt", 
            close: "x", 
            home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', 
            loading: "wird geladen . . .",
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
            nextProject: "next project", 
            close: "x", 
            home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', 
            loading: "loading . . .", 
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
            nextProject: "siguiente proyecto", 
            close: "x", 
            home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', 
            loading: "cargando . . .", 
            notAvailable: "proyecto aún no disponible en este idioma",
            
            seoDesc: "Proyectos de arquitectura digital y portafolio de diseño de Daniel Rösch. Explora mi trabalho y concepts.", 
            seoH1: "Portafolio de Arquitectura de Daniel Rösch", 
            seoIntro: "Bienvenido al portafolio digital of Daniel Rösch. Aquí puedes encontrar mis proyectos:", 
            seoContact: "Contáctame en arch.daniroesch@gmail.com para consultas."
        },
        'pt': { 
            titles: ["meus projetos", "dê uma olhada", "portfólio de arquitetura", "daniroesch.de"], 
            allBooks: "todos os projetos", 
            backToStart: "voltar ao início", 
            nextProject: "próximo projeto", 
            close: "x", 
            home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', 
            loading: "carregando . . .", 
            notAvailable: "projeto ainda não disponible neste idioma",
            
            seoDesc: "Projetos de arquitetura digital e portfólio de design de Daniel Rösch. Explore meu trabalho e conceitos.", 
            seoH1: "Portfólio de Arquitetura de Daniel Rösch", 
            seoIntro: "Bem-vindo ao portfólio digital de Daniel Rösch. Aqui você pode encontrar meus projetos:", 
            seoContact: "Contate-me em arch.daniroesch@gmail.com para dúvidas."
        }
    }
};

// ==========================================================================================
// ⚙️ 2. SYSTEM-LOGIK (MASCHINENRAUM) - V2.2 PLATFORM
// ==========================================================================================

document.addEventListener('DOMContentLoaded', () => {

    document.documentElement.style.webkitTextSizeAdjust = '100%';
    document.body.style.webkitTextSizeAdjust = '100%';
    document.documentElement.style.textSizeAdjust = '100%';
    document.body.style.textSizeAdjust = '100%';

    let is3DModelActive = false;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    const emailLinkElem = document.getElementById('link-email');
    if (emailLinkElem) {
        emailLinkElem.href = `mailto:${CONFIG.email}`;
        emailLinkElem.innerText = CONFIG.email;
    }

    function isZoomed() {
        return window.visualViewport && window.visualViewport.scale > 1.1;
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const bookWrapper = document.getElementById('flip-book-container');
            if (bookWrapper) {
                if (isZoomed() && !bookWrapper.classList.contains('zoomed-state')) {
                    bookWrapper.classList.add('zoomed-state');
                } else if (!isZoomed() && bookWrapper.classList.contains('zoomed-state')) {
                    bookWrapper.classList.remove('zoomed-state');
                }
            }
        });
    }

    let pullStartY = 0; let pullStartX = 0;
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) { pullStartY = e.touches[0].clientY; pullStartX = e.touches[0].clientX; }
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
            const yDiff = e.changedTouches[0].clientY - pullStartY;
            const xDiff = Math.abs(e.changedTouches[0].clientX - pullStartX);
            if (yDiff > 130 && xDiff < 40 && !isZoomed()) {
                window.location.hash = `/${currentBook}/${currentLang}/1`;
                setTimeout(() => { window.location.reload(); }, 30);
            }
        }
    }, { passive: true });

    let zoomCooldown = false; let zoomTimeout;
    function protectZoom(e) {
        if (e.composedPath && e.composedPath().some(el => el.tagName && el.tagName.toUpperCase() === 'MODEL-VIEWER')) {
            return; 
        }
        if (e.composedPath && e.composedPath().some(el => el.tagName && (el.tagName.toUpperCase() === 'VIDEO' || el.tagName.toUpperCase() === 'IFRAME'))) {
            return;
        }

        const isMultiTouch = e.touches && e.touches.length > 1;
        if (isMultiTouch || isZoomed()) {
            zoomCooldown = true; clearTimeout(zoomTimeout); e.stopPropagation(); 
        } else if (zoomCooldown) {
            e.stopPropagation();
            if (!e.touches || e.touches.length === 0) {
                clearTimeout(zoomTimeout); zoomTimeout = setTimeout(() => { zoomCooldown = false; }, 300);
            }
        }
    }

    window.addEventListener('touchstart', protectZoom, { capture: true, passive: true });
    window.addEventListener('touchmove', protectZoom, { capture: true, passive: true });
    window.addEventListener('touchend', protectZoom, { capture: true, passive: true });
    window.addEventListener('pointerdown', protectZoom, { capture: true, passive: true });
    window.addEventListener('pointerup', protectZoom, { capture: true, passive: true });

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

    function updateSEO(lang) {
        const t = CONFIG.translations[lang] || CONFIG.translations['de'];
        document.title = "Daniel Rösch | " + t.titles[2]; 
        let metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) metaDesc.content = t.seoDesc;
    }

    function getHashParams() {
        const hash = window.location.hash.replace(/^#\/?/, ''); 
        const parts = hash.split('/');

        if (parts[0] === 'grid') return { view: 'grid' };
        if (parts[0] === 'legal') return { view: 'legal' };

        const book = parts[0] || CONFIG.books[0];
        const lang = parts[1] || 'de';
        let pageNum = parts[2] ? parseInt(parts[2]) - 1 : 0;
        
        return { view: 'book', book, lang, page: Math.max(0, pageNum) };
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
            bookView.style.display = 'none'; legalView.style.display = 'none'; gridView.style.display = 'block';
            initGrid(); return;
        }

        if (params.view === 'legal') {
            bookView.style.display = 'none'; 
            gridView.style.display = 'none'; 
            legalView.style.display = 'block';
            
            if (!legalView.querySelector('img')) {
                const img = document.createElement('img');
                img.src = 'hero/imp.webp';
                img.alt = 'Impressum & Datenschutz';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                legalView.appendChild(img);
            }
            return;
        }

        gridView.style.display = 'none'; legalView.style.display = 'none'; bookView.style.display = 'block';

        if (currentBook !== params.book || currentLang !== params.lang || !pageFlip) {
            await loadBook(params.book, params.lang, params.page);
        } else {
            if (pageFlip && pageFlip.getCurrentPageIndex() !== params.page) pageFlip.flip(params.page);
        }
    }

    let lockedW = window.innerWidth;
    let lockedH = window.innerHeight;

    function clampButtonsToScreen() {
        const buttons = document.querySelectorAll('#home-btn, #fullscreen-btn, #close-legal, #back-to-book-btn, #back-to-start-btn, #next-project-btn, .close-3d-btn, .fs-3d-btn');
        const padding = 3; 

        buttons.forEach(btn => {
            const oldTransition = btn.style.transition;
            btn.style.setProperty('transition', 'none', 'important');
            btn.style.removeProperty('translate');
            
            void btn.offsetHeight;

            const rect = btn.getBoundingClientRect();
            if (rect.width === 0 && rect.height === 0) return; 

            let shiftX = 0;
            let shiftY = 0;

            if (rect.left < padding) {
                shiftX = padding - rect.left;
            } 
            else if (rect.right > window.innerWidth - padding) {
                shiftX = (window.innerWidth - padding) - rect.right;
            }

            if (rect.top < padding) {
                shiftY = padding - rect.top;
            } 
            else if (rect.bottom > window.innerHeight - padding) {
                shiftY = (window.innerHeight - padding) - rect.bottom;
            }

            if (shiftX !== 0 || shiftY !== 0) {
                btn.style.setProperty('translate', `${shiftX}px ${shiftY}px`, 'important');
            }

            void btn.offsetHeight;
            btn.style.transition = oldTransition;
        });
    }

    function updateBookSize() {
        document.documentElement.style.overflow = 'hidden';
        document.body.style.overflow = 'hidden';
        
        document.body.style.width = lockedW + 'px';
        document.body.style.height = lockedH + 'px';

        if (bookView) {
            bookView.style.width = lockedW + 'px';
            bookView.style.height = lockedH + 'px';
            bookView.style.overflow = 'hidden';
        }

        const bookAspectRatio = (currentImgW * 2) / currentImgH;
        const windowRatio = lockedW / lockedH;
        
        let finalWidth, finalHeight;
        if (bookAspectRatio > windowRatio) {
            finalWidth = lockedW; finalHeight = lockedW / bookAspectRatio;
            document.body.classList.add('fit-width'); document.body.classList.remove('fit-height');
        } else {
            finalHeight = lockedH; finalWidth = lockedH * bookAspectRatio;
            document.body.classList.add('fit-height'); document.body.classList.remove('fit-width');
        }
        
        document.body.style.setProperty('--real-book-width', finalWidth + 'px');
        document.body.style.setProperty('--real-book-height', finalHeight + 'px');
        
        const bookContainer = document.getElementById('book');
        if (bookContainer) {
            bookContainer.style.width = finalWidth + 'px';
            bookContainer.style.height = finalHeight + 'px';
        }
    }

    function performLayoutRecalculation() {
        const viewport = document.querySelector('meta[name="viewport"]');

        document.body.style.width = '';
        document.body.style.height = '';
        if (bookView) {
            bookView.style.width = '';
            bookView.style.height = '';
        }

        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }

        if (bookWrapper) bookWrapper.style.opacity = '0';

        setTimeout(() => {
            lockedW = window.innerWidth;
            lockedH = window.innerHeight;
            window.scrollTo(0, 0);

            updateBookSize();
            if (pageFlip) pageFlip.update();

            setTimeout(() => {
                if (bookWrapper) bookWrapper.style.opacity = '1';
                if (viewport) {
                    viewport.content = 'width=device-width, initial-scale=1.0';
                }
                clampButtonsToScreen();
            }, 50);
        }, 200); 
    }

    let resizeTimer;

    window.addEventListener('resize', () => {
        if (is3DModelActive) return;

        const currentW = window.innerWidth;
        const currentH = window.innerHeight;
        
        if (isTouchDevice) {
            if (Math.abs(currentW - lockedW) < 10) return; 
        } else {
            if (currentW === lockedW && Math.abs(currentH - lockedH) < 10) return;
        }

        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            performLayoutRecalculation();
        }, 200);
    });

    function handleFullscreenTransition() {
        if (is3DModelActive) return;
        clearTimeout(resizeTimer);
        setTimeout(() => {
            performLayoutRecalculation();
        }, 300); 
    }
    document.addEventListener('fullscreenchange', handleFullscreenTransition);
    document.addEventListener('webkitfullscreenchange', handleFullscreenTransition);

    window.addEventListener('orientationchange', () => {
        if (is3DModelActive) return;

        clearTimeout(resizeTimer);
        setTimeout(() => {
            performLayoutRecalculation();
        }, 300);
    });

    function updateHeading() {
        const t = CONFIG.translations[currentLang] || CONFIG.translations['de'];
        mainHeading.innerText = t.titles[currentTitleIndex];
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
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(url, { method: 'HEAD', signal: controller.signal, cache: 'no-store' });
            clearTimeout(timeoutId);
            return res.ok;
        } catch (e) { return false; }
    }

    async function initGrid() {
        const myGridId = ++activeGridId; 
        const gridContainer = document.querySelector('.grid-container');
        gridContainer.innerHTML = ''; 
        
        const gridPromises = CONFIG.books.map((bookName, index) => {
            const folder = `${bookName}/pages_${currentLang}/`;
            return checkPageExists(`${folder}0${extension}`).then(exists => ({
                index: index, name: bookName, folder: folder, exists: exists
            }));
        });

        const gridResults = await Promise.all(gridPromises);
        if (myGridId !== activeGridId) return;

        for (const book of gridResults) {
            if (book.exists) {
                const tile = document.createElement('div');
                tile.className = 'book-tile';
                const niceName = book.name.replace(/[-_]/g, ' '); 
                tile.innerHTML = `<img src="${book.folder}0${extension}" alt="${niceName}">`;
                tile.onclick = () => { window.location.hash = `/${book.name}/${currentLang}/1`; };
                gridContainer.appendChild(tile);
            }
        }
    }

    async function loadBook(bookName, lang, initialPage = 0) {
        const myLoadId = ++activeLoadId;
        currentBook = bookName; currentLang = lang;
        const t = CONFIG.translations[lang] || CONFIG.translations['de'];
        
        const homeBtn = document.getElementById('home-btn');
        const fsBtn = document.getElementById('fullscreen-btn');
        if (homeBtn) { homeBtn.style.opacity = '0'; homeBtn.style.pointerEvents = 'none'; }
        if (fsBtn) { fsBtn.style.opacity = '0'; fsBtn.style.pointerEvents = 'none'; }

        if (menuPositioner) menuPositioner.style.visibility = 'hidden'; 
        updateHeading();
        
        loadingScreen.innerHTML = `<div class="menu-wrapper"><div class="menu-row"><span class="bracket">[</span><span class="menu-links">${t.loading}</span><span class="bracket">]</span></div></div>`;
        document.querySelectorAll('.all-books-trigger').forEach(el => el.innerText = t.allBooks);
        document.getElementById('grid-heading').innerText = t.allBooks;
        
        const closeLegalBtn = document.getElementById('close-legal');
        if(closeLegalBtn) closeLegalBtn.innerText = t.close;
        const backToBookBtn = document.getElementById('back-to-book-btn');
        if(backToBookBtn) backToBookBtn.innerText = t.close;
        const backToStartBtn = document.getElementById('back-to-start-btn');
        if(backToStartBtn) backToStartBtn.innerText = t.backToStart;
        
        if (homeBtn) homeBtn.innerHTML = t.home;

        const nextProjectBtn = document.getElementById('next-project-btn');
        if (nextProjectBtn) nextProjectBtn.innerText = t.nextProject;

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
            currentImgW = cover.width > 0 ? cover.width : 1123; 
            currentImgH = cover.height > 0 ? cover.height : 794; 
        } else {
            loadingScreen.innerHTML = `
                <div class="menu-wrapper">
                    <div class="menu-row" style="margin-bottom: 0.8rem;">
                        <span class="bracket">[</span><span class="menu-links">${t.notAvailable}</span><span class="bracket">]</span>
                    </div>
                    <div class="menu-row">
                        <span class="bracket">[</span><span class="menu-links"><a href="#/grid" class="all-books-trigger">${t.allBooks}</a></span><span class="bracket">]</span>
                    </div>
                </div>`;
            return; 
        }

        const batchSize = 3; let pageCounter = 1; let checking = true;
        while (checking) {
            if (myLoadId !== activeLoadId) return;
            const promises = [];
            for (let i = 0; i < batchSize; i++) promises.push(checkPageExists(`${folder}${pageCounter + i}${extension}`));
            
            const results = await Promise.all(promises);
            if (myLoadId !== activeLoadId) return;

            for (let i = 0; i < batchSize; i++) {
                if (results[i]) imageUrls.push(`${pageCounter + i}${extension}`);
                else { checking = false; break; }
            }
            if (checking) pageCounter += batchSize;
        }

        const back = await checkPageExists(`${folder}-1${extension}`);
        if (myLoadId !== activeLoadId) return;
        if (back) imageUrls.push(`-1${extension}`);

        buildBook(imageUrls, folder, currentImgW, currentImgH, initialPage);
    }

    function buildBook(imageUrls, folder, width, height, initialPage = 0) {
        const bookContainer = document.getElementById('book');
        const niceBookName = currentBook.replace(/[-_]/g, ' ');

        imageUrls.forEach((file) => {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            
            const pageNum = parseInt(file);
            
            const has3D = CONFIG.threedee && CONFIG.threedee[currentBook] && CONFIG.threedee[currentBook][pageNum];
            const hasVideo = CONFIG.videos && CONFIG.videos[currentBook] && CONFIG.videos[currentBook][pageNum];
            
            if (has3D || hasVideo) {
                const isLeftPage = (pageNum % 2 !== 0);
                const horizPos = isLeftPage ? 'right: 5% !important; left: auto !important;' : 'left: 5% !important; right: auto !important;';
                
                const triggerDiv = document.createElement('div');
                triggerDiv.className = 'threedee-trigger';
                
                triggerDiv.style.cssText = 'width: 100%; height: 100%; display: block; position: relative; background-color: #ffffff !important; color-scheme: light !important;';
                
                const originalHtml = `
                    <img src="${folder}${file}" alt="Daniel Rösch Medien Vorschau" style="width: 100%; height: 100%; object-fit: cover;">
                    <div class="activation-hitbox" style="position: absolute; top: 30%; left: 30%; width: 40%; height: 40%; z-index: 10; cursor: pointer;"></div>
                `;
                triggerDiv.innerHTML = originalHtml;
                triggerDiv.dataset.originalHtml = originalHtml; 

                const blockFlip = (e) => {
                    if (!triggerDiv.classList.contains('model-active')) {
                        if (e.target.classList.contains('activation-hitbox')) {
                            e.stopPropagation();
                        }
                    }
                };
                triggerDiv.addEventListener('mousedown', blockFlip);
                triggerDiv.addEventListener('touchstart', blockFlip, { passive: true });

                triggerDiv.addEventListener('click', (e) => {
                    if (!triggerDiv.classList.contains('model-active')) {
                        if (e.target.classList.contains('activation-hitbox')) {
                            triggerDiv.classList.add('model-active');
                            
                            is3DModelActive = true; 

                            let uiButtonsHtml = `
                                <a href="#" class="close-3d-btn ui-btn" style="position: absolute !important; top: 4% !important; bottom: auto !important; ${horizPos} z-index: 100 !important; min-width: 50px !important; height: 50px !important; display: flex !important; justify-content: center !important; align-items: center !important; text-decoration: none !important; opacity: 1 !important; pointer-events: auto !important; margin: 0 !important; padding: 0 !important; transform: none !important; background: none !important; border: none !important;">
                                    <span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>
                                </a>
                                <a href="#" class="fs-3d-btn ui-btn" style="position: absolute !important; bottom: 4% !important; top: auto !important; ${horizPos} z-index: 100 !important; min-width: 50px !important; height: 50px !important; display: flex !important; justify-content: center !important; align-items: center !important; text-decoration: none !important; opacity: 1 !important; pointer-events: auto !important; margin: 0 !important; padding: 0 !important; transform: none !important; background: none !important; border: none !important;">
                                    [&nbsp;&nbsp;&nbsp;]
                                </a>
                            `;

                            if (has3D) {
                                const modelFile = CONFIG.threedee[currentBook][pageNum];
                                triggerDiv.innerHTML = uiButtonsHtml + `
                                    <model-viewer src="${currentBook}/${modelFile}" camera-controls style="width: 100%; height: 100%; background-color: #ffffff !important; color-scheme: light !important; outline: none;"></model-viewer>
                                `;
                            } else if (hasVideo) {
                                const videoData = CONFIG.videos[currentBook][pageNum];
                                let playerHtml = '';

                                // 🔥 DIE NEUE "LINK-WASCHANLAGE" FÜR PERFEKTES VIDEO-LADEN
                                if (videoData.type === 'youtube') {
                                    let ytId = videoData.id.trim();
                                    const ytMatch = ytId.match(/[a-zA-Z0-9_-]{11}/);
                                    if (ytMatch) ytId = ytMatch[0]; // Extrahiert exakt die echten 11 Zeichen!
                                    
                                    playerHtml = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen"></iframe>`;
                                } else if (videoData.type === 'vimeo') {
                                    let vimId = videoData.id.trim();
                                    const vimMatch = vimId.match(/\d+/);
                                    if (vimMatch) vimId = vimMatch[0]; // Extrahiert nur die reinen Nummern!
                                    
                                    playerHtml = `<iframe src="https://player.vimeo.com/video/${vimId}?autoplay=1" style="width:100%; height:100%; border:none;" allow="autoplay; fullscreen"></iframe>`;
                                } else if (videoData.type === 'local') {
                                    playerHtml = `<video src="${videoData.id}" autoplay controls style="width:100%; height:100%; object-fit:contain; background:#ffffff;"></video>`;
                                }

                                triggerDiv.innerHTML = uiButtonsHtml + playerHtml;
                            }

                            setTimeout(clampButtonsToScreen, 50);

                            const closeBtn = triggerDiv.querySelector('.close-3d-btn');
                            const fsBtn = triggerDiv.querySelector('.fs-3d-btn');

                            const killEvent = (evt) => {
                                evt.preventDefault();
                                evt.stopPropagation();
                            };

                            const attachEventBlockers = (btn) => {
                                ['mousedown', 'touchstart', 'pointerdown', 'mousemove', 'touchmove', 'pointermove', 'mouseup', 'touchend', 'pointerup', 'click'].forEach(evtType => {
                                    btn.addEventListener(evtType, (evt) => {
                                        evt.stopPropagation(); 
                                    }, { passive: false });
                                });
                            };

                            attachEventBlockers(closeBtn);
                            attachEventBlockers(fsBtn);

                            closeBtn.addEventListener('click', (evt) => {
                                killEvent(evt);
                                const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
                                
                                if (isFullscreen) {
                                    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
                                    else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(()=>{});
                                } else {
                                    triggerDiv.innerHTML = triggerDiv.dataset.originalHtml;
                                    triggerDiv.classList.remove('model-active');
                                    is3DModelActive = false;
                                }
                            });

                            fsBtn.addEventListener('click', (evt) => {
                                killEvent(evt);
                                if (!document.fullscreenElement && !document.webkitFullscreenElement) {
                                    if (triggerDiv.requestFullscreen) triggerDiv.requestFullscreen().catch(()=>{});
                                    else if (triggerDiv.webkitRequestFullscreen) triggerDiv.webkitRequestFullscreen().catch(()=>{});
                                } else {
                                    if (document.exitFullscreen) document.exitFullscreen().catch(()=>{});
                                    else if (document.webkitExitFullscreen) document.webkitExitFullscreen().catch(()=>{});
                                }
                            });

                            setTimeout(() => {
                                const mv = triggerDiv.querySelector('model-viewer, iframe, video');
                                if (mv) {
                                    const stopProp = (evt) => evt.stopPropagation();
                                    ['touchstart', 'touchmove', 'mousedown', 'mousemove', 'pointerdown', 'pointerup'].forEach(evt => {
                                        mv.addEventListener(evt, stopProp, { passive: true });
                                    });
                                }
                            }, 100);
                        }
                    }
                });

                pageDiv.appendChild(triggerDiv);

            } else {
                pageDiv.innerHTML = `<img src="${folder}${file}" alt="Daniel Rösch Architektur Portfolio - ${niceBookName}">`;
            }
            
            bookContainer.appendChild(pageDiv);
        });

        updateBookSize();
        bookContainer.offsetHeight;

        pageFlip = new St.PageFlip(bookContainer, {
            width: width, height: height, size: "stretch", 
            showCover: true, mobileScrollSupport: false, usePortrait: false
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

        pageFlip.on('flip', (e) => {
            const targetPage = e.data; 
            const totalPages = pageFlip.getPageCount();
            
            pendingTargetPage = targetPage;
            isInternalHashUpdate = true;
            window.location.hash = `/${currentBook}/${currentLang}/${targetPage + 1}`;

            document.querySelectorAll('.threedee-trigger.model-active').forEach(el => {
                if(el.dataset.originalHtml) {
                    el.innerHTML = el.dataset.originalHtml;
                    el.classList.remove('model-active');
                }
            });
            is3DModelActive = false;

            if (targetPage === 0 || targetPage >= totalPages - 2) {
                if(homeBtn) { homeBtn.style.opacity = '0'; homeBtn.style.pointerEvents = 'none'; }
                if(fsBtn) { fsBtn.style.opacity = '0'; fsBtn.style.pointerEvents = 'none'; }
            } else {
                if(homeBtn) { homeBtn.style.opacity = '1'; homeBtn.style.pointerEvents = 'auto'; }
                if(fsBtn) { fsBtn.style.opacity = '1'; fsBtn.style.pointerEvents = 'auto'; }
            }

            menuPositioner.style.zIndex = '1';
            
            if (targetPage === 0) {
                startMenu.style.transition = 'opacity 0.3s ease';
                startMenu.style.opacity = '1';
                endOfBookMenu.style.transition = 'none'; 
                endOfBookMenu.style.opacity = '0'; 
            } else if (targetPage >= totalPages - 2) {
                startMenu.style.transition = 'none'; 
                startMenu.style.opacity = '0'; 
                endOfBookMenu.style.transition = 'opacity 0.3s ease';
                endOfBookMenu.style.opacity = '1';
            } else {
                startMenu.style.transition = 'none';
                startMenu.style.opacity = '0';
                endOfBookMenu.style.transition = 'none';
                endOfBookMenu.style.opacity = '0';
            }
        });

        pageFlip.on('changeState', (e) => {
            const state = e.data; 
            const currentPage = pageFlip.getCurrentPageIndex();
            const totalPages = pageFlip.getPageCount();

            if (state !== 'read') {
                startMenu.style.pointerEvents = 'none';
                endOfBookMenu.style.pointerEvents = 'none';
                menuPositioner.style.zIndex = '1'; 
                
                if (pendingTargetPage === -1) {
                    if (currentPage <= 2) {
                        startMenu.style.transition = 'opacity 0.3s ease';
                        startMenu.style.opacity = '1'; 
                        endOfBookMenu.style.transition = 'none';
                        endOfBookMenu.style.opacity = '0';
                    } else if (currentPage >= totalPages - 4) {
                        startMenu.style.transition = 'none';
                        startMenu.style.opacity = '0';
                        endOfBookMenu.style.transition = 'opacity 0.3s ease';
                        endOfBookMenu.style.opacity = '1'; 
                    } else {
                        startMenu.style.transition = 'none';
                        startMenu.style.opacity = '0';
                        endOfBookMenu.style.transition = 'none';
                        endOfBookMenu.style.opacity = '0';
                    }
                }
            } else {
                pendingTargetPage = -1; 
                isInternalHashUpdate = false;

                clampButtonsToScreen();

                if (currentPage === 0) {
                    menuPositioner.style.zIndex = '3'; 
                    startMenu.style.pointerEvents = 'auto';
                    startMenu.style.transition = 'opacity 0.3s ease'; 
                    startMenu.style.opacity = '1'; 
                    
                    endOfBookMenu.style.pointerEvents = 'none';
                    endOfBookMenu.style.transition = 'none';
                    endOfBookMenu.style.opacity = '0'; 
                    cycleTitle(); 
                } else if (currentPage >= totalPages - 2) {
                    menuPositioner.style.zIndex = '3';
                    endOfBookMenu.style.pointerEvents = 'auto';
                    endOfBookMenu.style.transition = 'opacity 0.3s ease'; 
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
                clampButtonsToScreen(); 
            }, 100);
        }, 150);
    }

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
                
                if (screen.orientation && screen.orientation.unlock) { screen.orientation.unlock(); }
            }
        } catch (error) {}
    }

    document.addEventListener('click', (e) => {
        if (e.target.closest('#back-to-start-btn') || e.target.closest('#home-btn')) {
            e.preventDefault();
            if (pageFlip && !isZoomed()) pageFlip.flip(0);
            
        } else if (e.target.closest('#next-project-btn')) {
            e.preventDefault();
            const btn = e.target.closest('#next-project-btn');
            const originalText = btn.innerText;
            btn.innerText = ". . ."; 
            btn.style.pointerEvents = 'none';

            (async () => {
                let currentIndex = CONFIG.books.indexOf(currentBook);
                let foundNext = false;
                let nextBook = currentBook;

                for (let i = 1; i <= CONFIG.books.length; i++) {
                    let checkIndex = (currentIndex === -1) ? (i - 1) : (currentIndex + i) % CONFIG.books.length;
                    
                    let checkBook = CONFIG.books[checkIndex];
                    let folder = `${checkBook}/pages_${currentLang}/`;
                    
                    let exists = await checkPageExists(`${folder}0${extension}`);
                    if (exists) {
                        nextBook = checkBook;
                        foundNext = true;
                        break; 
                    }
                }

                btn.innerText = originalText;
                btn.style.pointerEvents = ''; 

                if (foundNext) {
                    window.location.hash = `/${nextBook}/${currentLang}/1`;
                } else {
                    if (pageFlip && !isZoomed()) pageFlip.flip(0);
                }
            })();

        } else if (e.target.closest('.all-books-trigger')) {
            e.preventDefault();
            window.location.hash = `/grid`;
            
        } else if (e.target.id === 'link-email' || e.target.closest('#link-email')) {
            e.preventDefault();
            window.location.href = `mailto:${CONFIG.email}`;

        } else if (e.target.closest('#fullscreen-btn')) { 
            e.preventDefault(); toggleFullscreen(); 
            
        } else if (e.target.closest('#link-legal')) {
            e.preventDefault();
            window.location.hash = `/legal`;
        } else if (e.target.closest('#close-legal')) {
            e.preventDefault();
            const page = pageFlip ? pageFlip.getCurrentPageIndex() + 1 : 1;
            window.location.hash = `/${currentBook}/${currentLang}/${page}`;
        } else if (e.target.closest('#back-to-book-btn')) {
            e.preventDefault();
            const page = pageFlip ? pageFlip.getCurrentPageIndex() + 1 : 1;
            window.location.hash = `/${currentBook}/${currentLang}/${page}`;
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

    window.addEventListener('hashchange', handleRouting);
    handleRouting();
});
