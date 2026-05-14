/**
 * Eco Pneus — notificações globais (Firestore em tempo real, z-index alto).
 * Chame EcoPneusGlobalNotifs.start(user) após auth.currentUser estar definido.
 * Opcional: EcoPneusGlobalNotifs.registerBell(element) em cada botão de sino.
 */
(function () {
    'use strict';

    var state = {
        uid: null,
        unsub: null,
        open: false,
        items: [],
        bells: [],
        host: null,
        panel: null,
        list: null,
        badge: null
    };

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function tsMillis(d) {
        if (!d) return 0;
        if (typeof d.toDate === 'function') {
            try {
                var x = d.toDate();
                return x.getTime();
            } catch (e) {}
        }
        if (typeof d.seconds === 'number') return d.seconds * 1000;
        var t = new Date(d).getTime();
        return isNaN(t) ? 0 : t;
    }

    function ensureHost() {
        if (state.host) return;
        var host = document.createElement('div');
        host.id = 'eco-global-notif-host';
        host.setAttribute('aria-live', 'polite');
        host.innerHTML =
            '<div id="eco-global-notif-panel" class="eco-global-notif-panel hidden" role="dialog" aria-label="Notificações">' +
            '<div class="eco-global-notif-head">' +
            '<strong>Notificações</strong>' +
            '<button type="button" class="eco-global-notif-mark" id="eco-global-notif-mark-all">Marcar lidas</button>' +
            '</div>' +
            '<div class="eco-global-notif-list" id="eco-global-notif-list"></div>' +
            '</div>';
        document.body.appendChild(host);
        state.host = host;
        state.panel = document.getElementById('eco-global-notif-panel');
        state.list = document.getElementById('eco-global-notif-list');

        document.getElementById('eco-global-notif-mark-all').addEventListener('click', function (e) {
            e.stopPropagation();
            markAllRead();
        });

        state.panel.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        document.addEventListener('click', function () {
            if (!state.open) return;
            state.open = false;
            state.panel.classList.add('hidden');
        });
    }

    function countUnread() {
        return state.items.filter(function (n) {
            return !n.lida;
        }).length;
    }

    function syncBadges() {
        var n = countUnread();
        state.bells.forEach(function (bell) {
            var b = bell.querySelector('.eco-global-notif-badge');
            if (!b) return;
            if (n > 0) {
                b.textContent = n > 9 ? '9+' : String(n);
                b.classList.remove('hidden');
            } else {
                b.classList.add('hidden');
            }
        });
    }

    function renderList() {
        if (!state.list) return;
        if (!state.items.length) {
            state.list.innerHTML = '<p class="eco-global-notif-empty">Nenhuma notificação ainda.</p>';
            return;
        }
        state.list.innerHTML = state.items
            .map(function (n) {
                var cls = n.lida ? 'eco-global-notif-item' : 'eco-global-notif-item eco-global-notif-item--unread';
                var when = tsMillis(n.createdAt);
                var whenStr = when ? new Date(when).toLocaleString('pt-BR') : '';
                return (
                    '<div class="' +
                    cls +
                    '" data-eco-notif-doc="' +
                    esc(n.id) +
                    '">' +
                    '<strong>' +
                    esc(n.titulo) +
                    '</strong>' +
                    '<p>' +
                    esc(n.mensagem) +
                    '</p>' +
                    '<small>' +
                    esc(whenStr) +
                    '</small>' +
                    '</div>'
                );
            })
            .join('');

        state.list.querySelectorAll('[data-eco-notif-doc]').forEach(function (row) {
            row.addEventListener('click', function () {
                var id = row.getAttribute('data-eco-notif-doc');
                var item = state.items.find(function (x) {
                    return x.id === id;
                });
                if (!item || item.lida || !state.uid || typeof db === 'undefined') return;
                item.lida = true;
                row.classList.remove('eco-global-notif-item--unread');
                db.collection('usuarios')
                    .doc(state.uid)
                    .collection('notificacoes')
                    .doc(id)
                    .update({ lida: true })
                    .catch(function () {});
                syncBadges();
            });
        });
    }

    function markAllRead() {
        if (!state.uid || typeof db === 'undefined') return;
        var batch = db.batch();
        var refBase = db.collection('usuarios').doc(state.uid).collection('notificacoes');
        state.items.forEach(function (n) {
            if (!n.lida) batch.update(refBase.doc(n.id), { lida: true });
        });
        batch
            .commit()
            .catch(function () {})
            .then(function () {
                state.items.forEach(function (n) {
                    n.lida = true;
                });
                syncBadges();
                renderList();
            });
    }

    function applySnapshot(snap) {
        var rows = [];
        snap.forEach(function (doc) {
            var d = doc.data() || {};
            rows.push({
                id: doc.id,
                titulo: String(d.titulo || 'Eco Pneus'),
                mensagem: String(d.mensagem || ''),
                tipo: d.tipo || 'info',
                coletaId: d.coletaId || null,
                protocolo: String(d.protocolo || ''),
                lida: !!d.lida,
                createdAt: d.createdAt || null
            });
        });
        rows.sort(function (a, b) {
            return tsMillis(b.createdAt) - tsMillis(a.createdAt);
        });
        state.items = rows.slice(0, 40);
        renderList();
        syncBadges();
    }

    function stop() {
        if (state.unsub) {
            try {
                state.unsub();
            } catch (e) {}
            state.unsub = null;
        }
        state.uid = null;
        state.items = [];
    }

    function start(user) {
        stop();
        if (!user || !user.uid || typeof db === 'undefined') return;
        state.uid = user.uid;
        ensureHost();
        try {
            state.unsub = db
                .collection('usuarios')
                .doc(user.uid)
                .collection('notificacoes')
                .limit(40)
                .onSnapshot(applySnapshot, function () {});
        } catch (e) {
            state.unsub = null;
        }
    }

    function togglePanel(anchor) {
        ensureHost();
        state.open = !state.open;
        if (!state.panel) return;
        state.panel.classList.toggle('hidden', !state.open);
        if (state.open && anchor && anchor.getBoundingClientRect) {
            var r = anchor.getBoundingClientRect();
            var top = Math.min(window.innerHeight - 400, Math.max(72, r.bottom + 8));
            var right = Math.max(12, window.innerWidth - r.right);
            state.panel.style.top = top + 'px';
            state.panel.style.right = right + 'px';
            state.panel.style.left = 'auto';
        } else if (state.open) {
            state.panel.style.top = '72px';
            state.panel.style.right = '20px';
            state.panel.style.left = 'auto';
        }
        if (state.open) renderList();
    }

    function registerBell(el) {
        if (!el || el.dataset.ecoGlobalNotifBound) return;
        el.dataset.ecoGlobalNotifBound = '1';
        ensureHost();
        if (!el.querySelector('.eco-global-notif-badge')) {
            var badge = document.createElement('span');
            badge.className = 'eco-global-notif-badge hidden';
            badge.setAttribute('aria-live', 'polite');
            badge.textContent = '0';
            el.style.position = el.style.position || 'relative';
            el.appendChild(badge);
        }
        el.addEventListener('click', function (e) {
            e.stopPropagation();
            togglePanel(el);
        });
        state.bells.push(el);
        syncBadges();
    }

    window.EcoPneusGlobalNotifs = {
        start: start,
        stop: stop,
        registerBell: registerBell,
        refresh: syncBadges
    };
})();
