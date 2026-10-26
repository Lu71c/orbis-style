/**
 * MAISON BRERA — APP ENGINE (JavaScript ES6+)
 * File: js/app.js
 * 
 * Moduli inclusi:
 * 1. RAM Preloader per asset WebP
 * 2. Gestione Tier Pricing (Senior vs. Artistic Director)
 * 3. Session Engine (Vassoio Fluttuante, calcolo tempi e prezzi)
 * 4. Diagnostic Advisor 2.0 (Quiz a step e prescrizione)
 * 5. Filtri Categorie
 * 6. Off-Canvas Drawer (Schede Tecniche Rituali)
 * 7. Modale Prenotazione & Generatore Deep-Link WhatsApp
 * 8. Navigazione Mobile
 */

document.addEventListener("DOMContentLoaded", () => {
    // Numero WhatsApp ufficiale dell'Atelier (sostituibile con il numero reale del cliente)
    const ATELIER_WHATSAPP_NUMBER = "390212345678";

    /* ==========================================================================
       1. RAM PRELOADER (Precaricamento immediato delle 9 foto WebP)
       ========================================================================== */
    const imageCatalog = [
        "img/hero-atelier.webp",
        "img/head-spa-water.webp",
        "img/balayage-sabbia.webp",
        "img/brunette-gloss.webp",
        "img/taglio-sartoriale.webp",
        "img/trattamento-viso.webp",
        "img/laminazione-sguardo.webp",
        "img/suite-privata.webp",
        "img/prodotti-botanici.webp"
    ];

    const preloadImages = (urls) => {
        urls.forEach((url) => {
            const img = new Image();
            img.src = url;
        });
    };
    preloadImages(imageCatalog);

    /* ==========================================================================
       DATABASE SCHEDE TECNICHE (Drawer Laterale)
       ========================================================================== */
    const ritualDetails = {
        "balayage-signature": {
            title: "Balayage Couture & Gloss Schiarente",
            ingredients: "Proteine della seta idrolizzata, micro-pigmenti freddi vegetali, complessi lipidici biocompatibili. Formula 100% priva di ammoniaca e parabeni.",
            protocol: "Diagnosi preliminare a microcamera (200x), mappatura morfologica delle schiariture a mano libera, posa con controllo termico progressivo e tonalizzazione lucida a specchio.",
            maintenance: "Detergere esclusivamente con bagno micellare a pigmento viola bilanciato. Ripetere il gloss nutriente ogni 6-8 settimane per preservare la tonalità sabbia fredda."
        },
        "taglio-architettonico": {
            title: "Taglio Sartoriale & Piega Memory",
            ingredients: "Infuso di resina di corteccia di larice e fitocheratine termoprotettive a rilascio graduale.",
            protocol: "Studio della volumetria cranica, lavorazione a secco (dry-cut precision) su ciocche calibrate per definire la caduta naturale, asciugatura con tecnica rotativa a temperatura controllata.",
            maintenance: "Mantenimento della linea ogni 8-10 settimane. Applicare due gocce di elisir silicon-free prima di ogni utilizzo di styling a caldo domestico."
        },
        "japanese-head-spa": {
            title: "Scalp Detox & Shiatsu Head Spa",
            ingredients: "Fango vulcanico purificante, argilla bianca caolino, mentolo biologico piemontese ed estratti di tè verde cerimoniale.",
            protocol: "Scansione digitale del follicolo, applicazione gommage esfoliante, vaporizzazione con micro-nebbia ozonata calda, idro-cascata continua a 38°C e 20 minuti di digitopressione shiatsu cranio-cervicale.",
            maintenance: "Ideale una volta al mese per riossigenare la barriera epidermica o come pre-trattamento per servizi colore impegnativi."
        },
        "ricostruzione-k18": {
            title: "Trattamento Molecolare Bond-Repair",
            ingredients: "Catena brevettata di peptidi biomimetici (K18Peptide™), aminoacidi solforati e squalano vegetale purificato.",
            protocol: "Detersione alcalina controllata per l'apertura delle cuticole, posa intensiva non-risciacquo del siero peptidico per 4 minuti, sigillatura a vapore freddo.",
            maintenance: "Non effettuare shampoo aggressivi nelle prime 48 ore dalla seduta. Integrare con maschera di mantenimento domiciliare ogni tre lavaggi."
        },
        "facial-glass-skin": {
            title: "Bespoke Flash Facial 24K",
            ingredients: "Acido ialuronico a triplo peso molecolare, lamine di vero oro 24K colloidale, peptidi rimpolpanti botanici.",
            protocol: "Detersione per affinità con oli dermofili, posa maschera oro con veicolazione sonica, drenaggio linfatico del terzo medio e inferiore con spatole in quarzo rosa refrigerato.",
            maintenance: "Applicare schermo solare minerale SPF 50+ la mattina successiva per proteggere la nuova luminosità cutanea ed evitare esfoliazioni chimiche per 5 giorni."
        },
        "laminazione-sguardo": {
            title: "Laminazione Cheratina Ciglia & Arcata",
            ingredients: "Cheratina idrolizzata, biotina, provitamina B5 e pigmento minerale extra black a elevata tenuta.",
            protocol: "Curvatura anatomica su cuscinetti in silicone medicale, fissaggio cheratinico volumizzante, tinta semi-permanente a riflesso notte e lifting manuale dell'arcata sopracciliare.",
            maintenance: "Evitare vapore diretto, saune e mascara per le prime 24 ore successive. Pettinare quotidianamente con scovolino pulito e una goccia di olio di ricino biologico."
        }
    };

    /* ==========================================================================
       STATO APPLICATIVO GLOBALE
       ========================================================================== */
    const appState = {
        stylistTier: "senior", // "senior" oppure "director"
        sessionItems: new Map(), // key: id, value: { id, name, duration, priceSenior, priceDirector }
        activeDrawerId: null
    };

    /* ==========================================================================
       ELEMENTI DOM PRINCIPALI
       ========================================================================== */
    const stylistToggle = document.getElementById("stylist-level-toggle");
    const labelSenior = document.getElementById("label-senior");
    const labelDirector = document.getElementById("label-director");
    const cards = document.querySelectorAll(".ritual-card");

    const floatingBar = document.getElementById("floating-session-bar");
    const sessionCount = document.getElementById("session-count");
    const sessionTime = document.getElementById("session-time");
    const sessionTotal = document.getElementById("session-total");

    const bookingModal = document.getElementById("booking-modal");
    const modalOverlay = document.getElementById("modal-overlay");
    const btnOpenBooking = document.getElementById("btn-open-booking");
    const btnCloseModal = document.getElementById("close-modal");
    const bookingForm = document.getElementById("booking-form");
    const bookingDateInput = document.getElementById("booking-date");
    const summaryRitualsList = document.getElementById("summary-rituals-list");
    const summaryDuration = document.getElementById("summary-duration");
    const summaryStylist = document.getElementById("summary-stylist");

    const drawer = document.getElementById("ritual-drawer");
    const drawerOverlay = document.getElementById("drawer-overlay");
    const btnCloseDrawer = document.getElementById("close-drawer");
    const drawerTitle = document.getElementById("drawer-title");
    const drawerIngredients = document.getElementById("drawer-ingredients");
    const drawerProtocol = document.getElementById("drawer-protocol");
    const drawerMaintenance = document.getElementById("drawer-maintenance");
    const drawerBtnAdd = document.getElementById("drawer-btn-add");

    /* ==========================================================================
       UTILITY: FORMATTAZIONE TEMPO
       ========================================================================== */
    const formatMinutesToHours = (totalMinutes) => {
        if (totalMinutes === 0) return "0 min";
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        if (hours === 0) return `${minutes} min`;
        if (minutes === 0) return `${hours}h`;
        return `${hours}h ${minutes}m`;
    };

    /* ==========================================================================
       2. GESTIONE TIER PRICING DINAMICO
       ========================================================================== */
    const updatePricesDisplay = () => {
        cards.forEach((card) => {
            const priceElement = card.querySelector("[data-dynamic-price]");
            const price = appState.stylistTier === "director"
                ? card.dataset.priceDirector
                : card.dataset.priceSenior;
            
            if (priceElement) {
                priceElement.textContent = `€ ${price}`;
            }
        });
        updateSessionTrayUI();
    };

    if (stylistToggle) {
        stylistToggle.addEventListener("change", (e) => {
            if (e.target.checked) {
                appState.stylistTier = "director";
                labelSenior.classList.remove("active");
                labelDirector.classList.add("active");
            } else {
                appState.stylistTier = "senior";
                labelDirector.classList.remove("active");
                labelSenior.classList.add("active");
            }
            updatePricesDisplay();
        });
    }

    /* ==========================================================================
       3. SESSION ENGINE (VASSOIO FLUTTUANTE & CALCOLO CUMULATIVO)
       ========================================================================== */
    const updateSessionTrayUI = () => {
        const count = appState.sessionItems.size;
        let cumulativeMinutes = 0;
        let cumulativePrice = 0;

        appState.sessionItems.forEach((item) => {
            cumulativeMinutes += item.duration;
            cumulativePrice += appState.stylistTier === "director" ? item.priceDirector : item.priceSenior;
        });

        // Aggiorna la barra fluttuante
        if (count > 0) {
            floatingBar.classList.remove("hidden");
            sessionCount.textContent = count;
            sessionTime.textContent = formatMinutesToHours(cumulativeMinutes);
            sessionTotal.textContent = `€ ${cumulativePrice}`;
        } else {
            floatingBar.classList.add("hidden");
        }

        // Sincronizza stato pulsanti su tutte le card
        cards.forEach((card) => {
            const id = card.dataset.id;
            const btnAdd = card.querySelector(".btn-add");
            if (appState.sessionItems.has(id)) {
                card.classList.add("selected");
                if (btnAdd) {
                    btnAdd.textContent = "Rimuovi";
                    btnAdd.classList.add("active");
                }
            } else {
                card.classList.remove("selected");
                if (btnAdd) {
                    btnAdd.textContent = "Aggiungi";
                    btnAdd.classList.remove("active");
                }
            }
        });

        // Sincronizza pulsante dentro al drawer se aperto
        if (appState.activeDrawerId) {
            if (appState.sessionItems.has(appState.activeDrawerId)) {
                drawerBtnAdd.textContent = "Rimuovi dalla Seduta";
                drawerBtnAdd.classList.replace("btn-primary", "btn-outline-dark");
            } else {
                drawerBtnAdd.textContent = "Aggiungi alla Seduta";
                drawerBtnAdd.classList.replace("btn-outline-dark", "btn-primary");
            }
        }
    };

    const toggleItemInSession = (itemData) => {
        if (appState.sessionItems.has(itemData.id)) {
            appState.sessionItems.delete(itemData.id);
        } else {
            appState.sessionItems.set(itemData.id, itemData);
        }
        updateSessionTrayUI();
    };

    // Event listener click sui bottoni card "Aggiungi"
    cards.forEach((card) => {
        const btnAdd = card.querySelector(".btn-add");
        if (btnAdd) {
            btnAdd.addEventListener("click", () => {
                const itemData = {
                    id: card.dataset.id,
                    name: card.dataset.name,
                    duration: parseInt(card.dataset.duration, 10),
                    priceSenior: parseInt(card.dataset.priceSenior, 10),
                    priceDirector: parseInt(card.dataset.priceDirector, 10)
                };
                toggleItemInSession(itemData);
            });
        }
    });

    /* ==========================================================================
       4. DIAGNOSTIC ADVISOR 2.0 (Quiz a step)
       ========================================================================== */
    const step1 = document.getElementById("step-1");
    const step2 = document.getElementById("step-2");
    const step3 = document.getElementById("step-3-result");
    const verdictTitle = document.getElementById("verdict-title");
    const verdictDesc = document.getElementById("verdict-desc");
    const btnApplyVerdict = document.getElementById("btn-apply-verdict");
    const btnResetQuiz = document.getElementById("btn-reset-quiz");

    let quizAnswers = { goal: null, state: null };
    let prescribedIds = [];

    const handleGoalSelection = (e) => {
        const goal = e.target.dataset.goal;
        if (!goal) return;
        quizAnswers.goal = goal;

        step1.classList.add("hidden");
        step2.classList.remove("hidden");
    };

    const calculateVerdict = () => {
        const { goal, state } = quizAnswers;

        if (goal === "luce") {
            prescribedIds = ["balayage-signature", "ricostruzione-k18"];
            verdictTitle.textContent = "Schiaritura Couture & Rigenerazione Peptidica";
            verdictDesc.textContent = "Protocollo ad alta precisione per ottenere biondi sabbia puri e freddi proteggendo i ponti cheratinici tramite K18 Bond-Repair.";
        } else if (goal === "detox" || state === "sensibile") {
            prescribedIds = ["japanese-head-spa", "taglio-architettonico"];
            verdictTitle.textContent = "Scalp Detox Ozonato & Taglio Sartoriale";
            verdictDesc.textContent = "Riequilibrio completo del microbioma cutaneo con idro-cascata shiatsu e ridefinizione della linea morfologica a forbice calda.";
        } else if (goal === "rigenerazione") {
            prescribedIds = ["ricostruzione-k18", "taglio-architettonico"];
            verdictTitle.textContent = "Riconnessione Molecolare & Sigillatura Punte";
            verdictDesc.textContent = "Terapia intensiva biomimetica per capelli devitalizzati da precedenti schiariture, abbinata all'eliminazione delle punte sdoppiate.";
        } else {
            prescribedIds = ["facial-glass-skin", "laminazione-sguardo"];
            verdictTitle.textContent = "Glow 24K Glass Skin & Sguardo Haute-Couture";
            verdictDesc.textContent = "Protocollo simultaneo viso-sguardo: luminosità ad assorbimento dermico immediato e definizione permanente dell'arcata sopracciliare.";
        }

        step2.classList.add("hidden");
        step3.classList.remove("hidden");
    };

    const handleStateSelection = (e) => {
        const state = e.target.dataset.state;
        if (!state) return;
        quizAnswers.state = state;
        calculateVerdict();
    };

    if (step1) step1.addEventListener("click", handleGoalSelection);
    if (step2) step2.addEventListener("click", handleStateSelection);

    if (btnApplyVerdict) {
        btnApplyVerdict.addEventListener("click", () => {
            prescribedIds.forEach((id) => {
                const targetCard = document.querySelector(`.ritual-card[data-id="${id}"]`);
                if (targetCard && !appState.sessionItems.has(id)) {
                    const itemData = {
                        id: targetCard.dataset.id,
                        name: targetCard.dataset.name,
                        duration: parseInt(targetCard.dataset.duration, 10),
                        priceSenior: parseInt(targetCard.dataset.priceSenior, 10),
                        priceDirector: parseInt(targetCard.dataset.priceDirector, 10)
                    };
                    appState.sessionItems.set(id, itemData);
                }
            });
            updateSessionTrayUI();

            // Effetto feedback e scroll fluido al vassoio
            btnApplyVerdict.textContent = "✓ Protocollo Aggiunto!";
            setTimeout(() => {
                btnApplyVerdict.textContent = "Aggiungi Protocollo alla Seduta";
                document.getElementById("menu-rituali").scrollIntoView({ behavior: "smooth" });
            }, 800);
        });
    }

    if (btnResetQuiz) {
        btnResetQuiz.addEventListener("click", () => {
            quizAnswers = { goal: null, state: null };
            prescribedIds = [];
            step3.classList.add("hidden");
            step2.classList.add("hidden");
            step1.classList.remove("hidden");
        });
    }

    /* ==========================================================================
       5. FILTRI CATEGORIA
       ========================================================================== */
    const filterButtons = document.querySelectorAll(".filter-btn");

    filterButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            filterButtons.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            const filterValue = btn.dataset.filter;

            cards.forEach((card) => {
                if (filterValue === "all" || card.dataset.category === filterValue) {
                    card.style.display = "flex";
                } else {
                    card.style.display = "none";
                }
            });
        });
    });

    /* ==========================================================================
       6. OFF-CANVAS DRAWER (SCHEDA TECNICA)
       ========================================================================== */
    window.openDrawer = (ritualId) => {
        const data = ritualDetails[ritualId];
        if (!data) return;

        appState.activeDrawerId = ritualId;
        drawerTitle.textContent = data.title;
        drawerIngredients.textContent = data.ingredients;
        drawerProtocol.textContent = data.protocol;
        drawerMaintenance.textContent = data.maintenance;

        drawer.classList.remove("hidden");
        document.body.style.overflow = "hidden"; // Blocca scroll di sfondo
        updateSessionTrayUI();
    };

    const closeDrawer = () => {
        drawer.classList.add("hidden");
        document.body.style.overflow = "";
        appState.activeDrawerId = null;
    };

    if (btnCloseDrawer) btnCloseDrawer.addEventListener("click", closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

    if (drawerBtnAdd) {
        drawerBtnAdd.addEventListener("click", () => {
            if (!appState.activeDrawerId) return;
            const targetCard = document.querySelector(`.ritual-card[data-id="${appState.activeDrawerId}"]`);
            if (targetCard) {
                const itemData = {
                    id: targetCard.dataset.id,
                    name: targetCard.dataset.name,
                    duration: parseInt(targetCard.dataset.duration, 10),
                    priceSenior: parseInt(targetCard.dataset.priceSenior, 10),
                    priceDirector: parseInt(targetCard.dataset.priceDirector, 10)
                };
                toggleItemInSession(itemData);
            }
        });
    }

    /* ==========================================================================
       7. MODALE PRENOTAZIONE & DEEP-LINK WHATSAPP
       ========================================================================== */
    const openBookingModal = () => {
        if (appState.sessionItems.size === 0) return;

        // Imposta la data minima del datepicker su "oggi"
        const todayStr = new Date().toISOString().split("T")[0];
        if (bookingDateInput) {
            bookingDateInput.min = todayStr;
            if (!bookingDateInput.value) bookingDateInput.value = todayStr;
        }

        // Popola la lista riepilogativa interna
        summaryRitualsList.innerHTML = "";
        let totalMinutes = 0;

        appState.sessionItems.forEach((item) => {
            totalMinutes += item.duration;
            const li = document.createElement("li");
            li.textContent = `• ${item.name} (${item.duration} min)`;
            summaryRitualsList.appendChild(li);
        });

        summaryDuration.textContent = formatMinutesToHours(totalMinutes);
        summaryStylist.textContent = appState.stylistTier === "director" ? "Artistic Director" : "Senior Stylist";

        bookingModal.classList.remove("hidden");
        document.body.style.overflow = "hidden";
    };

    const closeModal = () => {
        bookingModal.classList.add("hidden");
        document.body.style.overflow = "";
    };

    if (btnOpenBooking) btnOpenBooking.addEventListener("click", openBookingModal);
    if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);
    if (modalOverlay) modalOverlay.addEventListener("click", closeModal);

    // Gestione Invio Form WhatsApp
    if (bookingForm) {
        bookingForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const guestName = document.getElementById("guest-name").value.trim();
            const bookingDate = document.getElementById("booking-date").value;
            const bookingTime = document.getElementById("booking-time").value;
            const welcomeDrink = document.getElementById("welcome-drink").value;

            let totalMinutes = 0;
            let totalPrice = 0;
            let ritualsText = "";

            appState.sessionItems.forEach((item) => {
                totalMinutes += item.duration;
                totalPrice += appState.stylistTier === "director" ? item.priceDirector : item.priceSenior;
                ritualsText += `• ${item.name} (${item.duration} min)\n`;
            });

            const stylistTitle = appState.stylistTier === "director" ? "Artistic Director" : "Senior Stylist";
            const formattedDuration = formatMinutesToHours(totalMinutes);

            // Generazione del messaggio tecnico formattato ad alta conversione
            const message = 
`RICHIESTA APPUNTAMENTO PRIVATO — MAISON BRERA
───────────────────────────
Ospite: ${guestName}

RITUALI SELEZIONATI:
${ritualsText}
DETTAGLI SEDUTA:
• Livello Stylist: ${stylistTitle}
• Durata Stimata: ${formattedDuration} (+ 15 min buffer accoglienza)
• Valore Stimato: € ${totalPrice}
• Data Desiderata: ${bookingDate}
• Fascia Oraria: ${bookingTime}
• Carta dei Benvenuti: ${welcomeDrink}

Desidero verificare la disponibilità della postazione e confermare lo slot riservato con analisi tricotest 200x inclusa.`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${ATELIER_WHATSAPP_NUMBER}?text=${encodedMessage}`;

            // Apertura chat WhatsApp in nuova scheda
            window.open(whatsappUrl, "_blank");
            closeModal();
        });
    }

    /* ==========================================================================
       8. GESTIONE MENU MOBILE (TOGGLE)
       ========================================================================== */
    const mobileMenuBtn = document.getElementById("mobile-menu-btn");
    const mainNav = document.querySelector(".main-nav");

    if (mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener("click", () => {
            const isVisible = mainNav.style.display === "block";
            mainNav.style.display = isVisible ? "none" : "block";

            if (!isVisible) {
                mainNav.style.position = "absolute";
                mainNav.style.top = "100%";
                mainNav.style.left = "0";
                mainNav.style.width = "100%";
                mainNav.style.backgroundColor = "var(--bg-canvas)";
                mainNav.style.padding = "2rem 1.5rem";
                mainNav.style.borderBottom = "1px solid var(--border-soft)";
                mainNav.style.boxShadow = "var(--shadow-lift)";
                
                const ul = mainNav.querySelector("ul");
                if (ul) {
                    ul.style.flexDirection = "column";
                    ul.style.gap = "1.25rem";
                }
            }
        });

        // Chiudi menu al tocco su un'ancora
        mainNav.querySelectorAll("a").forEach((link) => {
            link.addEventListener("click", () => {
                if (window.innerWidth <= 768) {
                    mainNav.style.display = "none";
                }
            });
        });
    }

    // Inizializzazione display iniziale prezzi
    updatePricesDisplay();
});
