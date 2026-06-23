// Wartet, bis die Webseite vollständig geladen ist, bevor das Skript startet
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. ZOOM WÄCHTER ---
    // Erkennt, ob der Nutzer mit den Fingern ins Bild gezoomt hat
    function isZoomed() {
        return window.visualViewport && window.visualViewport.scale > 1.01;
    }

    // Wenn gezoomt wurde, bekommt das Buch die Klasse "zoomed-state", wodurch Blättern deaktiviert wird
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

    // --- 2. PULL-TO-REFRESH WÄCHTER ---
    // Erkennt, ob jemand auf dem Handy stark nach unten zieht, um die Seite neu zu laden
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
            
            // Wenn massiv nach unten gezogen wurde (yDiff > 130) und man nicht gezoomt ist
            if (yDiff > 130 && xDiff < 40 && !isZoomed()) {
                // Setzt die Adresse sofort auf Seite 1 zurück und lädt neu
                window.location.hash = `/${currentBook}/${currentLang}/1`;
                setTimeout(() => { window.location.reload(); }, 30);
            }
        }
    }, { passive: true });

    // Blockiert Multi-Touch Gesten, damit das Buch nicht durchdreht, wenn man wischt UND zoomt
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

    // --- 3. BASIS-VARIABLEN ---
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
    
    // WICHTIG: Hier trägst du deine zukünftigen GitHub Ordner-Namen ein!
    // z.B. 'villa-am-see', 'museum-madrid'
    const portfolioBooks = [
        'book_1', 
        'book_2',
        'book_3',
        'book_4'
    ]; 
    
    let pageFlip = null; 
    let currentLang = 'de'; 
    let currentBook = portfolioBooks[0]; // Das erste Buch der Liste wird beim Start geladen
    let currentTitleIndex = 0; 
    
    // FIX: Smarter Wächter statt hartem Blocker für ein flüssiges Menü
    let targetPageWhileFlipping = -1; 
    
    let isInitialLoad = true; 
    const extension = '.webp'; 
    
    let currentImgW = 1123; 
    let currentImgH = 794;
    
    let activeLoadId = 0; // Stoppt Ladevorgänge, wenn man zu schnell klickt
    let activeGridId = 0; // Stoppt Grid-Ladung, wenn man zu schnell klickt
    
    // Die Übersetzungs-Datenbank für das Interface
    const translations = {
        'de': { titles: ["es ist ein buch", "blätter herum", "architektur portfolio", "daniroesch.de"], allBooks: "alle bücher", backToStart: "zurück zum anfang", close: "x", home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', loading: "buch wird geladen...", notAvailable: "buch noch nicht in dieser sprache verfügbar" },
        'en': { titles: ["it´s a book", "flip around", "architecture portfolio", "daniroesch.de"], allBooks: "all books", backToStart: "back to start", close: "x", home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', loading: "loading book...", notAvailable: "book not yet available in this language" },
        'es': { titles: ["es un libro", "hojea las páginas", "portafolio de arquitectura", "daniroesch.de"], allBooks: "todos los libros", backToStart: "volver al inicio", close: "x", home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', loading: "cargando libro...", notAvailable: "libro aún no disponible en este idioma" },
        'pt': { titles: ["é um livro", "folheie as páginas", "portfólio de arquitetura", "daniroesch.de"], allBooks: "todos os livros", backToStart: "voltar ao início", close: "x", home: '<span style="display:inline-block; transform: scale(1.35); line-height: 1;">x</span>', loading: "carregando livro...", notAvailable: "livro ainda não disponível neste idioma" }
    };

    // --- 4. URL & ROUTING ---
    // Liest die obere Internetadresse aus und versteht sie (z.B. daniroesch.de/#/book_1/de/1)
    function getHashParams() {
        const hash = window.location.hash.replace(/^#\/?/, ''); // Schneidet das # weg
        const parts = hash.split('/');

        if (parts[0] === 'grid') return { view: 'grid' };
        if (parts[0] === 'legal') return { view: 'legal' };

        const book = parts[0] || portfolioBooks[0];
        const lang = parts[1] || 'de';
        
        // Mathematik-Trick: Mensch sieht Seite 1, Computer rechnet intern mit Seite 0
        let pageNum = parts[2] ? parseInt(parts[2]) - 1 : 0;
        pageNum = Math.max(0, pageNum);

        return { view: 'book', book, lang, page: pageNum };
    }

    // Leitet den Nutzer auf die entsprechende Ansicht um (Buch, Raster oder Impressum)
    async function handleRouting() {
        // FIX: Der harte Blocker (isInternalHashUpdate) wurde entfernt, Menüs reagieren sofort!
        let params = getHashParams();

        // Beim ersten Laden der Webseite:
        if (isInitialLoad) {
            isInitialLoad = false;
            params.page = 0;
            if (params.view === 'book' || !params.view) {
                // Formatiert die URL wunderschön (Path-based Routing)
                window.location.hash = `/${params.book}/${params.lang}/1`;
            }
        }

        // Steuerung der Bildschirme (Ein- und Ausblenden)
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

        // Läd das Buch nur neu, wenn es sich wirklich geändert hat. Ansonsten wird nur geblättert.
        if (currentBook !== params.book || currentLang !== params.lang || !pageFlip) {
            await loadBook(params.book, params.lang, params.page);
        } else {
            if (pageFlip && pageFlip.getCurrentPageIndex() !== params.page) {
                // FIX: Verhindert Endlosschleifen, ohne Klicks zu blockieren
                if (params.page !== targetPageWhileFlipping) {
                    pageFlip.flip(params.page);
                }
            }
        }
    }

    // --- 5. BERECHNUNG DER BUCHGRÖSSE & ICON-POSITION ---
    function updateBookSize() {
        const w = window.innerWidth;
        const h = window.innerHeight;
        
        const bookSpreadW = currentImgW * 2;
        const bookSpreadH = currentImgH;
        
        const bookAspectRatio = bookSpreadW / bookSpreadH;
        const windowRatio = w / h;
        
        let finalWidth, finalHeight;
        
        // Mathematik: Bestimmt, ob auf dem Bildschirm schwarze Balken an den Seiten oder oben/unten sind
        if (bookAspectRatio > windowRatio) {
            // Bildschirm ist hochkant (Smartphone)
            finalWidth = w;
            finalHeight = w / bookAspectRatio;
            document.body.classList.add('fit-width');
            document.body.classList.remove('fit-height');
        } else {
            // Bildschirm ist breit (Laptop)
            finalHeight = h;
            finalWidth = h * bookAspectRatio;
            document.body.classList.add('fit-height');
            document.body.classList.remove('fit-width');
        }
        
        // Schickt die finalen Maße ans CSS
        document.body.style.setProperty('--real-book-width', finalWidth + 'px');
        document.body.style.setProperty('--real-book-height', finalHeight + 'px');
        
        const bookContainer = document.getElementById('book');
        if (bookContainer) {
            bookContainer.style.width = finalWidth + 'px';
            bookContainer.style.height = finalHeight + 'px';
        }
    }

    // Achtet darauf, wenn das Fenster verzogen wird (Laptop)
    let lastWinW = window.innerWidth;

    window.addEventListener('resize', () => {
        const currentW = window.innerWidth;
        if (currentW !== lastWinW) {
            lastWinW = currentW;
            if(bookWrapper) bookWrapper.style.opacity = '0'; // Kurzer Blackout für sauberes Rechnen
            updateBookSize();
            if (pageFlip) pageFlip.update();
            setTimeout(() => { if(bookWrapper) bookWrapper.style.opacity = '1'; }, 50);
        }
    });

    // Achtet darauf, wenn das Handy gedreht wird (Hochformat -> Querformat)
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

    // Klick auf den H1-Titel wechselt den Text durch
    function cycleTitle() {
        currentTitleIndex = (currentTitleIndex + 1) % 4;
        updateHeading();
    }

    // --- 6. HIGH-PERFORMANCE BILD-LADER ---
    
    // Holt sich exakt 1x die Bildmaße vom Cover
    async function loadCoverImage(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve({ exists: true, width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => resolve({ exists: false });
            img.src = url;
        });
    }

    // OPTIMIERT: Der sicherste Weg, um zu gucken, ob ein Bild existiert, ohne dass der Server (GitHub) blockiert.
    // Nutzt das native Image-Objekt und räumt danach den Speicher (`img.src = ''`) wieder auf.
    async function checkPageExists(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                img.src = ''; // Speicher-Aufräumarbeit (Memory Leak Schutz)
                resolve(true);
            };
            img.onerror = () => {
                img.src = ''; // Speicher-Aufräumarbeit
                resolve(false);
            };
            img.src = url;
        });
    }

    // Baut das Grid (Die Bibliothek)
    async function initGrid() {
        const myGridId = ++activeGridId; 
        const gridContainer = document.querySelector('.grid-container');
        gridContainer.innerHTML = ''; 
        
        // Prüft parallel für jedes Projekt in der Liste, ob es ein deutsches/englisches etc. Cover gibt
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
        if (myGridId !== activeGridId) return; // Stoppt, falls der User schon wieder weitergeklickt hat

        gridContainer.innerHTML = ''; 

        for (const book of gridResults) {
            if (book.exists) {
                const tile = document.createElement('div');
                tile.className = 'book-tile';
                // Tauscht eventuelle Bindestriche im Ordnernamen gegen Leerzeichen für eine schönere Ansicht
                const niceName = book.name.replace(/-/g, ' '); 
                tile.innerHTML = `<img src="${book.folder}0${extension}" alt="${niceName}">`;
                tile.onclick = () => {
                    window.location.hash = `/${book.name}/${currentLang}/1`;
                };
                gridContainer.appendChild(tile);
            }
        }
    }

    // --- 7. BUCH SUCHEN UND AUFBAUEN ---
    async function loadBook(bookName, lang, initialPage = 0) {
        const myLoadId = ++activeLoadId;

        currentBook = bookName;
        currentLang = lang;
        
        // UI-Icons beim Laden verstecken
        const homeBtn = document.getElementById('home-btn');
        const fsBtn = document.getElementById('fullscreen-btn');
        if (homeBtn) { homeBtn.style.opacity = '0'; homeBtn.style.pointerEvents = 'none'; }
        if (fsBtn) { fsBtn.style.opacity = '0'; fsBtn.style.pointerEvents = 'none'; }

        if (menuPositioner) menuPositioner.style.visibility = 'hidden'; 
        updateHeading();
        
        // Ladescreen vorbereiten
        loadingScreen.innerHTML = `
            <div class="menu-row" style="justify-content: center;">
                <span class="bracket">[</span>
                <span class="menu-links" style="flex-grow: 0; padding: 0 0.6em;">${translations[lang].loading}</span>
                <span class="bracket">]</span>
            </div>
        `;
        
        // Texte übersetzen
        document.querySelectorAll('.all-books-trigger').forEach(el => el.innerText = translations[lang].allBooks);
        document.getElementById('grid-heading').innerText = translations[lang].allBooks;
        document.getElementById('back-to-book-btn').innerText = translations[lang].close;
        document.getElementById('close-legal').innerText = translations[lang].close;
        document.getElementById('back-to-start-btn').innerText = translations[lang].backToStart;

        if (homeBtn) homeBtn.innerHTML = translations[lang].home;

        // Sprach-Schalter markieren
        langLinks.forEach(link => link.classList.remove('active'));
        const activeLink = document.querySelector(`[data-lang="${lang}"]`);
        if (activeLink) activeLink.classList.add('active');
        
        // Altes Buch zerstören, falls vorhanden
        if (pageFlip) { pageFlip.destroy(); pageFlip = null; }
        bookWrapper.innerHTML = '<div id="book"></div>';
        bookWrapper.style.opacity = '0';
        loadingScreen.style.display = 'flex'; 
        
        const folder = `${bookName}/pages_${lang}/`;
        const imageUrls = [];
        
        // Gucken, ob es überhaupt ein Buchcover gibt
        const cover = await loadCoverImage(`${folder}0${extension}`);
        if (myLoadId !== activeLoadId) return; // Stoppt bei schnellem Geklicke

        if (cover.exists) { 
            imageUrls.push(`0${extension}`); 
            currentImgW = cover.width; 
            currentImgH = cover.height; 
        } else {
            // BUCH EXISTIERT NICHT: Zeigt den Fehlerbildschirm und bietet den Rückzug zur Bibliothek an
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
            return; // Ladevorgang wird hier komplett abgebrochen
        }

        // Such-Schleife: Sucht so lange nach Seiten (1, 2, 3...), bis es keine mehr gibt
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

        // Prüft, ob es ein Back-Cover gibt (-1)
        const back = await checkPageExists(`${folder}-1${extension}`);
        if (myLoadId !== activeLoadId) return;

        if (back) { imageUrls.push(`-1${extension}`); }

        buildBook(imageUrls, folder, currentImgW, currentImgH, initialPage);
    }

    // Nimmt die gesammelten Bilder und baut das echte 3D Buch daraus
    function buildBook(imageUrls, folder, width, height, initialPage = 0) {
        const bookContainer = document.getElementById('book');
        
        // Erschafft den HTML-Code für Google für SEO (Ersetzt die Striche im Namen durch Leerzeichen)
        const niceBookName = currentBook.replace(/-/g, ' ');

        imageUrls.forEach((file) => {
            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            // Das alt-Attribut hilft Google, das Bild zu verstehen
            pageDiv.innerHTML = `<img src="${folder}${file}" alt="Daniel Rösch Architektur Portfolio - ${niceBookName}">`;
            bookContainer.appendChild(pageDiv);
        });

        updateBookSize();
        bookContainer.offsetHeight; // Zwingt den Browser, das Layout einmal zu rechnen

        // Die magische 3D-Bibliothek wird gestartet
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
        
        endOfBookMenu.style.display = 'flex'; 
        endOfBookMenu.style.pointerEvents = 'none';
        endOfBookMenu.style.opacity = '0'; 

        const startPage = pageFlip.getCurrentPageIndex();
        const totalPages = pageFlip.getPageCount();
        
        // Logik: Auf der allerersten und allerletzten Seite werden die UI-Icons unsichtbar
        if (startPage > 0 && startPage < totalPages - 2) {
            if(homeBtn) { homeBtn.style.opacity = '1'; homeBtn.style.pointerEvents = 'auto'; }
            if(fsBtn) { fsBtn.style.opacity = '1'; fsBtn.style.pointerEvents = 'auto'; }
        } else {
            if(homeBtn) { homeBtn.style.opacity = '0'; homeBtn.style.pointerEvents = 'none'; }
            if(fsBtn) { fsBtn.style.opacity = '0'; fsBtn.style.pointerEvents = 'none'; }
        }

        // Steuert, welches Text-Menü am Start aktiv sein soll
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

        // Event: Wird ausgelöst, WÄHREND die Seite blättert
        pageFlip.on('flip', (e) => {
            const targetPage = e.data; 
            const totalPages = pageFlip.getPageCount();
            
            targetPageWhileFlipping = targetPage; // FIX: Präziser Blocker gesetzt
            window.location.hash = `/${currentBook}/${currentLang}/${targetPage + 1}`;

            // FIX: SOFORTIGES Ausblenden verhindert spiegelverkehrte Geistertexte!
            startMenu.style.opacity = '0';
            startMenu.style.pointerEvents = 'none';
            endOfBookMenu.style.opacity = '0';
            endOfBookMenu.style.pointerEvents = 'none';
            menuPositioner.style.zIndex = '1';

            // Icons dynamisch während dem Flug aus/einblenden
            if (targetPage === 0 || targetPage >= totalPages - 2) {
                if(homeBtn) { homeBtn.style.opacity = '0'; homeBtn.style.pointerEvents = 'none'; }
                if(fsBtn) { fsBtn.style.opacity = '0'; fsBtn.style.pointerEvents = 'none'; }
            } else {
                if(homeBtn) { homeBtn.style.opacity = '1'; homeBtn.style.pointerEvents = 'auto'; }
                if(fsBtn) { fsBtn.style.opacity = '1'; fsBtn.style.pointerEvents = 'auto'; }
            }
        });

        // Event: Wird ausgelöst, wenn die Seite GESTOPPT hat (Blättern beendet)
        pageFlip.on('changeState', (e) => {
            const state = e.data; 
            const currentPage = pageFlip.getCurrentPageIndex();
            const totalPages = pageFlip.getPageCount();

            if (state !== 'read') {
                // Wenn Buch in der Luft ist -> Schriften unsichtbar
                startMenu.style.opacity = '0';
                startMenu.style.pointerEvents = 'none';
                endOfBookMenu.style.opacity = '0';
                endOfBookMenu.style.pointerEvents = 'none';
                menuPositioner.style.zIndex = '1';
            } else {
                targetPageWhileFlipping = -1; // FIX: Riegel aufheben, Klicks wieder frei!

                // Schriften je nach Position (Start, Mitte, Ende) einblenden
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
                    menuPositioner.style.visibility = 'visible'; // Beendet das anfängliche Versteckspiel
                }
            }, 100);
        }, 150);
    }

    // --- 8. EVENTS (KLICKS & TASTATUR) ---

    mainHeading.addEventListener('click', cycleTitle);

    langLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const lang = e.currentTarget.getAttribute('data-lang'); 
            window.location.hash = `/${currentBook}/${lang}/1`;
        });
    });

    // Fordert den Browser auf, in den echten Kino-Vollbildmodus zu wechseln
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

    // Ein globaler Klick-Wächter (Delegation) ist performanter als auf jedes Element einen EventListener zu legen
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

    // Erlaubt das Blättern mit den Pfeiltasten und der Leertaste am Laptop
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
    
    // Schließen der Untermenüs schickt den User wieder ins Buch
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

    // Horcht auf Änderungen der URL oben im Browser
    window.addEventListener('hashchange', handleRouting);

    // Initialer Start-Befehl
    handleRouting();
});
