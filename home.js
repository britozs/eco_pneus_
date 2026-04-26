// ============================================================
// ECO PNEUS - Landing Page (Home)
// ============================================================

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const nav = document.querySelector('.landing-nav');
    if (window.scrollY > 60) {
        nav.classList.add('scrolled');
    } else {
        nav.classList.remove('scrolled');
    }
});

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// Animate on scroll (simple observer)
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-up');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        observer.observe(el);
    });
});

// Counter animation
function animateCounter(el, target, duration = 1800) {
    let start = 0;
    const step = target / (duration / 16);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';

    function update() {
        start += step;
        if (start >= target) {
            el.textContent = prefix + target.toLocaleString('pt-BR') + suffix;
            return;
        }
        el.textContent = prefix + Math.floor(start).toLocaleString('pt-BR') + suffix;
        requestAnimationFrame(update);
    }
    update();
}

const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const el = entry.target;
            const target = parseInt(el.dataset.target);
            animateCounter(el, target);
            counterObserver.unobserve(el);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-target]').forEach(el => {
        counterObserver.observe(el);
    });
});
