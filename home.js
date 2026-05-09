document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide) {
        lucide.createIcons();
    }

    const header = document.querySelector(".site-header");
    const mobileMenuBtn = document.getElementById("mobileMenuBtn");
    const mobileMenu = document.getElementById("mobileMenu");
    const scrollLinks = document.querySelectorAll("[data-scroll]");
    const navLinks = document.querySelectorAll(".nav-link");
    const mobileLinks = document.querySelectorAll(".mobile-link");
    const sections = document.querySelectorAll("section[id]");

    // ── Header scroll state ──────────────────────────────────────
    function updateHeaderState() {
        if (!header) return;
        header.classList.toggle("scrolled", window.scrollY > 10);
    }

    function getHeaderOffset() {
        return header ? header.offsetHeight + 12 : 90;
    }

    // ── Mobile menu toggle ───────────────────────────────────────
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            const isOpen = mobileMenu.classList.toggle("open");
            mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
        });
    }

    // Fecha menu ao clicar fora
    document.addEventListener("click", (e) => {
        if (!mobileMenu || !mobileMenuBtn) return;
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.remove("open");
            mobileMenuBtn.setAttribute("aria-expanded", "false");
        }
    });

    // ── Smooth scroll ────────────────────────────────────────────
    scrollLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");
            if (!href || !href.startsWith("#")) return;

            e.preventDefault();

            const target = document.querySelector(href);
            if (!target) return;

            const targetPosition =
                target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();

            window.scrollTo({ top: targetPosition, behavior: "smooth" });

            if (mobileMenu) mobileMenu.classList.remove("open");
            if (mobileMenuBtn) mobileMenuBtn.setAttribute("aria-expanded", "false");
        });
    });

    // ── Active nav link (underline animado) ──────────────────────
    function updateActiveLink() {
        const scrollY = window.scrollY + getHeaderOffset() + 40;

        let activeSectionId = null;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            if (scrollY >= top && scrollY < top + height) {
                activeSectionId = section.getAttribute("id");
            }
        });

        // Mapeia #problema → #como-funciona (âncora alternativa usada no btn hero)
        const aliasMap = { "problema": "como-funciona" };
        if (activeSectionId && aliasMap[activeSectionId]) {
            activeSectionId = aliasMap[activeSectionId];
        }

        navLinks.forEach(link => {
            const matches = link.getAttribute("href") === `#${activeSectionId}`;
            link.classList.toggle("active", matches);
        });

        mobileLinks.forEach(link => {
            const matches = link.getAttribute("href") === `#${activeSectionId}`;
            link.classList.toggle("active", matches);
        });
    }

    // ── Intersection Observer p/ cards de solução (fade-in) ──────
    const solutionCards = document.querySelectorAll(".solution-card");
    if ("IntersectionObserver" in window && solutionCards.length) {
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = "1";
                    entry.target.style.transform = "translateY(0)";
                    cardObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        solutionCards.forEach((card, i) => {
            card.style.opacity = "0";
            card.style.transform = "translateY(24px)";
            card.style.transition = `opacity 0.45s ease ${i * 0.08}s, transform 0.45s ease ${i * 0.08}s`;
            cardObserver.observe(card);
        });
    }

    // ── Eventos ──────────────────────────────────────────────────
    window.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("scroll", updateActiveLink, { passive: true });
    window.addEventListener("load", updateActiveLink);
    window.addEventListener("resize", updateActiveLink);

    updateHeaderState();
    updateActiveLink();
});