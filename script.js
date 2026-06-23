// Wartet, bis die Webseite vollständig im Browser geladen ist
document.addEventListener('DOMContentLoaded', () => {

    // ==========================================================================
    // 1. ZOOM-WÄCHTER (Schützt das Buch vor Fehlbedienungen im Zoom)
    // ==========================================================================
    function isZoomed() {
        // Prüft, ob der Nutzer mit zwei Fingern in die Seite hineingezoomt hat
        return window.visualViewport && window.visualViewport.scale > 1.01;
    }

    if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => {
            const bookWrapper = document.getElementById('flip-book-container');
            if (bookWrapper) {
                if (isZoomed()) {
                    // Schaltet Blättern ab (pointer-events: none), wenn hineingezoomt wurde
                    bookWrapper.classList.add('zoomed-state');
                } else {
                    // Aktiviert Blättern wieder, wenn die Seite im Normalzustand ist
                    bookWrapper.classList.remove('zoomed-state');
                }
            }
        });
    }

    // ==========================================================================
    // 2. PULL-TO-REFRESH (Wisch-Geste zum sicheren Neuladen auf Seite 1)
    // ==========================================================================
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
            
            // Wenn der Nutzer auf dem Handy > 130px nach unten wischt und NICHT gezoomt ist
            if (yDiff > 130 && xDiff < 40 && !isZoomed()) {
                // Erzwingt, dass die URL vor dem Reload sicher auf das Startcover (Seite 1) springt
                window.location.hash = `/${currentBook}/${currentLang}/1`;
                setTimeout(() => { window.location.reload(); }, 30);
            }
        }
    }, { passive: true });

    // Blockiert Multi-Touch-Konflikte, damit das System ruhig bleibt, wenn man unkontrolliert wischt
    let zoomCooldown = false;
    let zoomTimeout;

    function protectZoom(e) {
        const isMultiTouch = e.touches && e.touches.length > 1;
        if (isMultiTouch || isZoomed()) {
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

    // ==========================================================================
    // 3. CODE-VARIABLEN & DEINE BÜCHER-LISTE
    // ==========================================================================
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
    
    // WICHTIG: Hier trägst du deine Ordnernamen ein, sobald du sie auf GitHub umbenennst!
    // Nutze Kebab-Case (z.B. 'museum-madrid', 'villa-am-see')
    const portfolioBooks = [
        'book_1', 
        'book_2',
        'book_3',
        'book_4'
    ]; 
    
    let pageFlip = null; 
    let currentLang = 'de'; 
    let currentBook = portfolioBooks[0]; // Startet initial immer mit dem ersten Buch der Liste
    let currentTitleIndex = 0; 
    
    // FIX: Smarter Animations-Wächter. Blockiert nur identische Blätter-Befehle, hält Klicks frei!
    let targetPageWhileFlipping = -1; 
    
    let isInitialLoad = true; 
    const extension = '.webp'; // Deine Dateiendung für die Renderings
    
    let currentImgW = 1123; 
    let currentImgH = 794;
    
    let activeLoadId = 0; // Bricht Ladevorgänge ab, wenn man im Menü wild herumklickt
    let activeGridId = 0; // Schützt das Bibliotheks-Grid vor asynchronen Dopplungen
    
    // DIE INTERFACE-DATENBANK (Perfekt korrigiert: libro für Spanisch, livro für Portugiesisch)
    const translations = {
        'de': { titles: ["es ist ein buch", "blätter herum", "architektur portfolio", "daniroesch.de"], allBooks: "alle bücher", backToStart: "zurück zum anfang", close: "x", home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', loading: "buch wird geladen...", notAvailable: "buch noch nicht in dieser sprache verfügbar" },
        'en': { titles: ["it´s a book", "flip around", "architecture portfolio", "daniroesch.de"], allBooks: "all books", backToStart: "back to start", close: "x", home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', loading: "loading book...", notAvailable: "book not yet available in this language" },
        'es': { titles: ["es un libro", "hojea las páginas", "portafolio de arquitectura", "daniroesch.de"], allBooks: "todos los libros", backToStart: "volver al inicio", close: "x", home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', loading: "cargando libro...", notAvailable: "libro aún no disponible en este idioma" },
        'pt': { titles: ["é um livro", "folheie as páginas", "portfólio de arquitetura", "daniroesch.de"], allBooks: "todos os livros", backToStart: "voltar ao início", close: "x", home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', loading: "carregando livro...", notAvailable: "livro ainda não disponível neste idioma" }
    };

    // ==========================================================================
    // 4. PATH-ROUTING (Übersetzt verständliche URLs für das Skript)
    // ==========================================================================
    function getHashParams() {
        const hash = window.location.hash.replace(/^#\/?/, ''); // Entfernt das # und eventuelle Schrägstriche
        const parts = hash.split('/');

        // Prüft, ob der Nutzer im Raster oder im Impressum steht
        if (parts[0] === 'grid') return { view: 'grid' };
        if (parts[0] === 'legal') return { view: 'legal' };

        const book = parts[0] || portfolioBooks[0];
        const lang = parts[1] || 'de';
        
        // Kosmetik-Trick: Nutzer sieht Seite 1 in der URL, JS rechnet intern heimlich mit Seite 0
        let pageNum = parts[2] ? parseInt(parts[2]) - 1 : 0;
        pageNum = Math.max(0, pageNum); // Verhindert Abstürze durch negative Zahlen

        return { view: 'book', book, lang, page: pageNum };
    }

    // Der Weichensteller: Schaltet die Ansichten je nach URL-Adresse um
    async function handleRouting() {
        let params = getHashParams();

        // Beim allerersten Aufruf der Seite
        if (isInitialLoad) {
            isInitialLoad = false;
            params.page = 0; // Internes Cover-Startsignal
            if (params.view === 'book' || !params.view) {
                // Formatiert den Link oben sofort wunderschön und verständlich (/#/book_1/de/1)
                window.location.hash = `/${params.book}/${params.lang}/1`;
            }
        }

        // Steuerung der Sichtbarkeiten von Grid, Impressum und Buch
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

        // Läd das Buch nur neu, wenn sich Sprache oder Buch geändert haben. Ansonsten wird nur geblättert.
        if (currentBook !== params.book || currentLang !== params.lang || !pageFlip) {
            await loadBook(params.book, params.lang, params.page);
        } else {
            if (pageFlip && pageFlip.getCurrentPageIndex() !== params.page) {
                // FIX: Verhindert Endlosschleifen beim automatischen Blättern, hält aber Klicks im Menü frei!
                if (params.page !== targetPageWhileFlipping) {
                    pageFlip.flip(params.page);
                }
            }
        }
    }

    // ==========================================================================
    // 5. MATHEMATISCHE GRÖSSEN-BERECHNUNG DES BUCHES
    // ==========================================================================
    function updateBookSize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        const bookSpreadW = currentImgW * 2;
        const bookSpreadH = currentImgH;
        
        const bookAspectRatio = bookSpreadW / bookSpreadH;
        const windowRatio = w / h;
        
        let finalWidth, finalHeight;
        
        // Berechnet das perfekte Seitenverhältnis, damit kein Bild gestaucht oder abgeschnitten wird
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
        
        // Reicht die exakten Pixelmaße an die CSS-Variablen weiter
        document.body.style.setProperty('--real-book-width', finalWidth + 'px');
        document.body.style.setProperty('--real-book-height', finalHeight + 'px');
        
        const bookContainer = document.getElementById('book');
        if (bookContainer) {
            bookContainer.style.width = finalWidth + 'px';
            bookContainer.style.height = finalHeight + 'px';
        }
    }

    // Wächter für Größenänderungen am Laptop-Fenster
    let lastWinW = window.innerWidth;
    window.addEventListener('resize', () => {
        const currentW = window.innerWidth;
        if (currentW !== lastWinW) {
            lastWinW = currentW;
            if(bookWrapper) bookWrapper.style.opacity = '0'; // Kurzer Blackout verhindert sichtbares Flackern
            updateBookSize();
            if (pageFlip) pageFlip.update();
            setTimeout(() => { if(bookWrapper) bookWrapper.style.opacity = '1'; }, 50);
        }
    });

    // Wächter für das Drehen des Smartphones (Querformat / Hochformat)
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            lastWinW = window.innerWidth;
            if(bookWrapper) bookWrapper.style.opacity = '0';
            updateBookSize();
            if (pageFlip) pageFlip.update();
            setTimeout(() => { if(bookWrapper) bookWrapper.style.opacity = '1'; }, 50);
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

    // ==========================================================================
    // 6. ULTRA-LEICHTER SEITEN-PROBER (0-Byte Datenverbrauch)
    // ==========================================================================
    
    // Lädt das allererste Cover ein einziges Mal voll, um die Maße des Papiers zu erfassen
    async function loadCoverImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ exists: true, width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ exists: false });
            img.src = url;
        });
    }

    // FIX: Die reparierte, pfeilschnelle Methode via HEAD-Request!
    // Lädt kein einziges Bildpixel herunter, verstopft die Leitung nicht und läuft unendlich stabil auf GitHub!
    async function checkPageExists(url) {
        try {
            // Sendet nur ein Klopfen (HEAD) an den Server und fragt: "Da?" -> Antwortet mit true oder false
            const res = await fetch(url, { method: 'HEAD' });
            return res.ok;
        } catch (e) {
            return false;
        }
    }

    // Baut das Bibliotheks-Grid auf
    async function initGrid() {
        const myGridId = ++activeGridId; 
        const gridContainer = document.querySelector('.grid-container');
        gridContainer.innerHTML = ''; 
        
        // Durchläuft deine Projekt-Liste und guckt parallel, welche Bücher online existieren
        const gridPromises = portfolioBooks.map((bookName, index) => {
            const folder = `${bookName}/pages_${currentLang}/`;
            return checkPageExists(`${folder}0${extension}`).then(exists => ({
                index: index,
                name: bookName,
                folder: folder,
                exists: exists
            }));
        });

        const gridResults = await Promise.all(gridPromises);
        if (myGridId !== activeGridId) return; // Stoppt, falls der User schon weitergeklickt hat

        gridContainer.innerHTML = ''; 

        for (const book of gridResults) {
            if (book.exists) {
                const tile = document.createElement('div');
                tile.className = 'book-tile';
                const niceName = book.name.replace(/-/g, ' '); 
                tile.innerHTML = `<img src="${book.folder}0${extension}" alt="${niceName}">`;
                tile.onclick = () => {
                    // Klick führt sauber zur Path-URL auf Seite 1
                    window.location.hash = `/${book.name}/${currentLang}/1`;
                };
                gridContainer.appendChild(tile);
            }
        }
    }

    // ==========================================================================
    // 7. BUCH-VALIDIERUNG UND AUFBAU
    // ==========================================================================
    async function loadBook(bookName, lang, initialPage = 0) {
        const myLoadId = ++activeLoadId;

        currentBook = bookName;
        currentLang = lang;
        
        // Icons beim Laden sofort unsichtbar schalten, damit nichts falsch schwebt
        const homeBtn = document.getElementById('home-btn');
        const fsBtn = document.getElementById('fullscreen-btn');
        if (homeBtn) { homeBtn.style.opacity = '0'; homeBtn.style.pointerEvents = 'none'; }
        if (fsBtn) { fsBtn.style.opacity = '0'; fsBtn.style.pointerEvents = 'none'; }

        if (menuPositioner) menuPositioner.style.visibility = 'hidden'; 
        updateHeading();
        
        // Baut das normale Lade-Skelett identisch zum CSS auf
        loadingScreen.innerHTML = `
            <div class="menu-row" style="justify-content: center;">
                <span class="bracket">[</span>
                <span class="menu-links" style="flex-grow: 0; padding: 0 0.6em;">${translations[lang].loading}</span>
                <span class="bracket">]</span>
            </div>
        `;
        
        // Setzt alle Übersetzungen live um
        document.querySelectorAll('.all-books-trigger').forEach(el => el.innerText = translations[lang].allBooks);
        document.getElementById('grid-heading').innerText = translations[lang].allBooks;
        document.getElementById('back-to-book-btn').innerText = translations[lang].close;
        document.getElementById('close-legal').innerText = translations[lang].close;
        document.getElementById('back-to-start-btn').innerText = translations[lang].backToStart;

        if (homeBtn) homeBtn.innerHTML = translations[lang].home;

        langLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-lang="${lang}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        if (pageFlip) { pageFlip.destroy(); pageFlip = null; }
        bookWrapper.innerHTML = '<div id="book"></div>';
        bookWrapper.style.opacity = '0';
        loadingScreen.style.display = 'flex'; 
        
        const folder = `${bookName}/pages_${lang}/`;
        const imageUrls = [];
        
        // Checkt das Cover voll ab für Breite und Höhe des Renderings
        const cover = await loadCoverImage(`${folder}0${extension}`);
        if (myLoadId !== activeLoadId) return; // Falls der Nutzer schon weitergesprungen ist: Abbruch!

        if (cover.exists) { 
            imageUrls.push(`0${extension}`); 
            currentImgW = cover.width; 
            currentImgH = cover.height; 
        } else {
            // FIX: Der smarte Fallback-Screen für nicht vorhandene Sprachen! Absolut passend gestaltet.
            loadingScreen.innerHTML = `
                <div class="menu-row" style="justify-content: center; margin-bottom: 0.8rem;">
                    <span class="bracket">[</span>
                    <span class="menu-links" style="flex-grow: 0; padding: 0 0.6em;">${translations[lang].notAvailable}</span>
                    <span class="bracket">]</span>
                </div>
                <div class="menu-row" style="justify-content: center;">
                    <span class="bracket">[</span>
                    <span class="menu-links" style="flex-grow: 0; padding: 0 0.6em;">
                        <a href="#/grid" class="all-books-trigger">${translations[lang].allBooks}</a>
                    </span>
                    <span class="bracket">]</span>
                </div>
            `;
            return; // Bricht das Laden hier endgültig und sicher ab!
        }

        // FIX: Kontrollierte, sequenzielle Schleife. Sucht unschlagbar stabil eine Seite nach der anderen.
        // GitHub blockiert hier niemals, weil der Datenverkehr mikroskopisch klein ist!
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

        // Gucken, ob es das End-Cover (-1.webp) gibt
        const back = await checkPageExists(`${folder}-1${extension}`);
        if (myLoadId !== activeLoadId) return;

        if (back) { imageUrls.push(`-1${extension}`); }

        buildBook(imageUrls, folder, currentImgW, currentImgH, initialPage);
    }

    function buildBook(imageUrls, folder, width, height, initialPage = 0) {
        const bookContainer = document.getElementById('book');
        const niceBookName = currentBook.replace(/-/g, ' ');

        imageUrls.forEach((file) => {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            // Injeziert SEO-optimierte Alt-Texte für Google Suchanfragen
            pageDiv.innerHTML = `<img src="${folder}${file}" alt="Daniel Rösch Architektur Portfolio - ${niceBookName}">`;
            bookContainer.appendChild(pageDiv);
        });

        updateBookSize();
        bookContainer.offsetHeight; // Render-Zwang für den Browser

        // Initialisiert das 3D-Buch
        pageFlip = new St.PageFlip(bookContainer, {
            width: width, height: height, size: "stretch", 
            showCover: true, 
            mobileScrollSupport: false, // Verhindert, dass das Handy beim Blättern unschön hoch/runter rutscht
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
        
        endOfBookMenu.style.display = 'flex'; 
        endOfBookMenu.style.pointerEvents = 'none';
        endOfBookMenu.style.opacity = '0'; 

        const startPage = pageFlip.getCurrentPageIndex();
        const totalPages = pageFlip.getPageCount();
        
        // Icons auf Cover- und Endseite unsichtbar machen
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
                startMenu.style.opacity = '0';
                startMenu.style.pointerEvents = 'none';
            } else {
                menuPositioner.style.zIndex = '1';
                startMenu.style.opacity = '0';
                startMenu.style.pointerEvents = 'none';
                endOfBookMenu.style.opacity = '0';
            }
        }

        // Event: Fired, wenn das Blättern ANFÄNGT
        pageFlip.on('flip', (e) => {
            const targetPage = e.data; 
            const totalPages = pageFlip.getPageCount();
            
            targetPageWhileFlipping = targetPage; // Riegel für den Wächter vorschieben!
            window.location.hash = `/${currentBook}/${currentLang}/${targetPage + 1}`;

            // FIX: Blendet das Menü in der ERSTEN Millisekunden aus. Verhindert die spiegelverkehrten Geistertexte!
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
        });

        // Event: Fired, wenn das Blättern BEENDET ist
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
                targetPageWhileFlipping = -1; // Riegel wieder öffnen für freie Fahrt im Menü!

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
                    menuPositioner.style.visibility = 'visible'; // Blendet das Menü nach Größenrechnung ein
                }
            }, 100);
        }, 150);
    }

    // ==========================================================================
    // 8. INTERAKTIONS EVENTS (Klicks & Tastatur)
    // ==========================================================================

    mainHeading.addEventListener('click', cycleTitle);

    langLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = e.currentTarget.getAttribute('data-lang'); 
            window.location.hash = `/${currentBook}/${lang}/1`;
        });
    });

    // Bringt das Gerät in den echten Vollbildmodus
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
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
            }
        } catch (error) {
            console.warn("Vollbild Fehler:", error);
        }
    }

    // Ein zentraler Klick-Verteiler schont die Prozessorleistung des Handys massiv
    document.addEventListener('click', (e) => {
        if (e.target.closest('#back-to-start-btn') || e.target.closest('#home-btn')) {
            e.preventDefault();
            if (pageFlip && !isZoomed()) { pageFlip.flip(0); }
        }

        if (e.target.closest('.all-books-trigger')) {
            e.preventDefault();
            window.location.hash = `/grid`;
        }
        
        if (e.target.id === 'link-email') {
            // Kopiert deine E-Mail-Adresse automatisch in die Zwischenablage des Nutzers
            navigator.clipboard.writeText('arch.daniroesch@gmail.com').then(() => {
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

    // Erlaubt das komfortable Blättern via Pfeiltasten und Leertaste am PC
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
    
    // Die Schließen-Kreuze werfen den Nutzer immer exakt auf die Inhaltsseite zurück, auf der er vorher stand
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

    // Horcht ununterbrochen auf Änderungen des Adress-Hashes
    window.addEventListener('hashchange', handleRouting);

    // Der finale Zündschlüssel, der das System beim ersten Laden startet
    handleRouting();
});
