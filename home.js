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

    function updateHeaderState() {
        if (!header) return;
        if (window.scrollY > 10) {
            header.classList.add("scrolled");
        } else {
            header.classList.remove("scrolled");
        }
    }

    function getHeaderOffset() {
        return header ? header.offsetHeight + 12 : 90;
    }

    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener("click", () => {
            const isOpen = mobileMenu.classList.toggle("open");
            mobileMenuBtn.setAttribute("aria-expanded", String(isOpen));
        });
    }

    scrollLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            const href = link.getAttribute("href");

            if (!href || !href.startsWith("#")) return;

            e.preventDefault();

            const target = document.querySelector(href);
            if (!target) return;

            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - getHeaderOffset();

            window.scrollTo({
                top: targetPosition,
                behavior: "smooth"
            });

            if (mobileMenu) {
                mobileMenu.classList.remove("open");
            }

            if (mobileMenuBtn) {
                mobileMenuBtn.setAttribute("aria-expanded", "false");
            }
        });
    });

    function updateActiveLink() {
        const scrollY = window.scrollY + getHeaderOffset() + 40;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute("id");

            if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.toggle("active", link.getAttribute("href") === `#${sectionId}`);
                });

                mobileLinks.forEach(link => {
                    link.classList.toggle("active", link.getAttribute("href") === `#${sectionId}`);
                });
            }
        });
    }

    document.addEventListener("click", (e) => {
        if (!mobileMenu || !mobileMenuBtn) return;

        const clickedInsideMenu = mobileMenu.contains(e.target);
        const clickedButton = mobileMenuBtn.contains(e.target);

        if (!clickedInsideMenu && !clickedButton) {
            mobileMenu.classList.remove("open");
            mobileMenuBtn.setAttribute("aria-expanded", "false");
        }
    });

    window.addEventListener("scroll", updateHeaderState, { passive: true });
    window.addEventListener("scroll", updateActiveLink, { passive: true });
    window.addEventListener("load", updateActiveLink);
    window.addEventListener("resize", updateActiveLink);

    updateHeaderState();
    updateActiveLink();
});
