/* White Marbelia — progressive enhancement. No dependencies. */
(function () {
	'use strict';
	var d = document;
	var root = d.documentElement;
	var cfg = window.WM || { i18n: {} };
	var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	root.classList.add('js');

	/* ---------- Tracking: cookieless dataLayer events; GA4 only after consent ---------- */
	window.dataLayer = window.dataLayer || [];
	function track(event, params) {
		var payload = Object.assign({ event: event }, params || {});
		window.dataLayer.push(payload);
		if (typeof window.gtag === 'function') { window.gtag('event', event, params || {}); }
	}
	d.addEventListener('click', function (e) {
		var a = e.target.closest('[data-wm-track]');
		if (!a) return;
		var kind = a.getAttribute('data-wm-track');
		var map = { whatsapp: 'wm_whatsapp_click', contact: 'wm_contact_click', catalogue: 'wm_catalogue_download' };
		track(map[kind] || 'wm_click', { channel: a.getAttribute('data-wm-channel') || kind, page: location.pathname });
	});

	/* ---------- Consent & GA4 ---------- */
	var CONSENT_KEY = 'wm_consent_v1';
	function getConsent() { try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; } }
	function setConsent(v) { try { localStorage.setItem(CONSENT_KEY, v); } catch (e) {} }
	function loadGA() {
		if (!cfg.ga4 || window.__wmGA) return;
		window.__wmGA = true;
		var s = d.createElement('script');
		s.async = true;
		s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(cfg.ga4);
		d.head.appendChild(s);
		window.gtag = function () { window.dataLayer.push(arguments); };
		window.gtag('js', new Date());
		window.gtag('config', cfg.ga4, { anonymize_ip: true });
	}
	function clearGACookies() {
		d.cookie.split(';').forEach(function (c) {
			var name = c.split('=')[0].trim();
			if (/^_ga/.test(name)) {
				var host = location.hostname.split('.');
				for (var i = 0; i < host.length - 1; i++) {
					d.cookie = name + '=; Max-Age=0; path=/; domain=.' + host.slice(i).join('.');
				}
				d.cookie = name + '=; Max-Age=0; path=/';
			}
		});
	}
	var banner = d.querySelector('[data-wm-consent]');
	if (banner) {
		var state = getConsent();
		if (state === 'granted') loadGA(); else if (!state) banner.hidden = false;
		banner.addEventListener('click', function (e) {
			var b = e.target.closest('[data-wm-consent-choice]');
			if (!b) return;
			var v = b.getAttribute('data-wm-consent-choice');
			setConsent(v);
			banner.hidden = true;
			if (v === 'granted') loadGA(); else { clearGACookies(); if (window.__wmGA) location.reload(); }
		});
	}
	d.querySelectorAll('[data-wm-consent-open]').forEach(function (btn) {
		if (!banner) { btn.closest('li').hidden = true; return; }
		btn.addEventListener('click', function () { banner.hidden = false; var f = banner.querySelector('button'); if (f) f.focus(); });
	});

	/* ---------- Header: hide on scroll down, reveal on scroll up ---------- */
	var header = d.querySelector('[data-wm-header]');
	if (header) {
		var lastY = window.scrollY, ticking = false;
		var onScroll = function () {
			var y = window.scrollY;
			header.classList.toggle('is-scrolled', y > 40);
			if (!reduce && !d.body.classList.contains('menu-open')) {
				header.classList.toggle('is-hidden', y > lastY && y > 320);
			}
			lastY = y;
			ticking = false;
		};
		window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
		header.addEventListener('focusin', function () { header.classList.remove('is-hidden'); });
		onScroll();
	}

	/* ---------- Mobile menu (focus trap, Esc) ---------- */
	var toggle = d.querySelector('[data-wm-menu-toggle]');
	var sheet = d.querySelector('[data-wm-sheet]');
	if (toggle && sheet) {
		var closeMenu = function (focusToggle) {
			toggle.setAttribute('aria-expanded', 'false');
			sheet.hidden = true;
			d.body.classList.remove('menu-open');
			d.body.style.overflow = '';
			if (focusToggle) toggle.focus();
		};
		toggle.addEventListener('click', function () {
			var open = toggle.getAttribute('aria-expanded') === 'true';
			if (open) { closeMenu(false); return; }
			var r = header.getBoundingClientRect();
			sheet.style.setProperty('--sheet-top', Math.max(0, r.bottom) + 'px');
			toggle.setAttribute('aria-expanded', 'true');
			sheet.hidden = false;
			d.body.classList.add('menu-open');
			d.body.style.overflow = 'hidden';
			var first = sheet.querySelector('a');
			if (first) first.focus();
		});
		d.addEventListener('keydown', function (e) {
			if (sheet.hidden) return;
			if (e.key === 'Escape') { closeMenu(true); return; }
			if (e.key === 'Tab') {
				var items = [toggle].concat(Array.prototype.slice.call(sheet.querySelectorAll('a, button')));
				var i = items.indexOf(d.activeElement);
				if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
				else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
			}
		});
		sheet.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(false); });
		window.matchMedia('(min-width: 1081px)').addEventListener('change', function (m) { if (m.matches) closeMenu(false); });
	}

	/* ---------- Hero specimen index: hover/focus swaps the plate ---------- */
	var plates = d.querySelectorAll('[data-wm-specimen]');
	var links = d.querySelectorAll('[data-wm-specimen-link]');
	if (plates.length && links.length) {
		var activate = function (slug) {
			plates.forEach(function (p) { p.classList.toggle('is-active', p.getAttribute('data-wm-specimen') === slug); });
			links.forEach(function (l) { l.classList.toggle('is-active', l.getAttribute('data-wm-specimen-link') === slug); });
		};
		links.forEach(function (l) {
			var slug = l.getAttribute('data-wm-specimen-link');
			l.addEventListener('mouseenter', function () { activate(slug); });
			l.addEventListener('focus', function () { activate(slug); });
			// Lazy images in hidden plates: load on first intent.
			l.addEventListener('mouseenter', function () {
				var img = d.querySelector('[data-wm-specimen="' + slug + '"] img[loading="lazy"]');
				if (img) img.loading = 'eager';
			}, { once: true });
		});
	}

	/* ---------- Reveal on first view ---------- */
	var reveals = d.querySelectorAll('.wm-reveal');
	if (reveals.length && 'IntersectionObserver' in window && !reduce) {
		var io = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
		}, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
		reveals.forEach(function (el) { io.observe(el); });
	} else {
		reveals.forEach(function (el) { el.classList.add('is-in'); });
	}

	/* ---------- Local clocks ---------- */
	var clocks = d.querySelectorAll('[data-wm-clock]');
	if (clocks.length && window.Intl) {
		var tick = function () {
			var now = new Date();
			clocks.forEach(function (c) {
				try {
					var tz = c.getAttribute('data-wm-clock');
					c.textContent = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: tz }).format(now);
					c.setAttribute('datetime', now.toISOString());
				} catch (e) { c.textContent = ''; }
			});
		};
		tick();
		setInterval(tick, 30000);
	}

	/* ---------- Applications index: highlight current section ---------- */
	var appLinks = d.querySelectorAll('.wm-apps__index a');
	if (appLinks.length && 'IntersectionObserver' in window) {
		var byId = {};
		appLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
		var aio = new IntersectionObserver(function (entries) {
			entries.forEach(function (en) {
				if (en.isIntersecting) {
					appLinks.forEach(function (a) { a.classList.remove('is-current'); a.removeAttribute('aria-current'); });
					var a = byId[en.target.id];
					if (a) { a.classList.add('is-current'); a.setAttribute('aria-current', 'true'); }
				}
			});
		}, { rootMargin: '-30% 0px -60% 0px' });
		d.querySelectorAll('.wm-app').forEach(function (s) { aio.observe(s); });
	}

	/* ---------- Collection filters ---------- */
	var filterForm = d.querySelector('[data-wm-filters]');
	if (filterForm) {
		var items = d.querySelectorAll('.wm-catalogue__item');
		var count = filterForm.querySelector('.wm-filters__count');
		filterForm.addEventListener('change', function () {
			var data = new FormData(filterForm);
			var shown = 0;
			items.forEach(function (it) {
				var ok = true;
				data.forEach(function (val, key) {
					if (val && (' ' + (it.getAttribute('data-' + key) || '') + ' ').indexOf(' ' + val + ' ') === -1) ok = false;
				});
				it.hidden = !ok;
				if (ok) shown++;
			});
			count.textContent = shown + (shown === 1 ? ' stone' : ' stones');
		});
	}

	/* ---------- "Request technical data" pre-fills the product form ---------- */
	d.querySelectorAll('[data-wm-prefill]').forEach(function (a) {
		a.addEventListener('click', function () {
			var ta = d.querySelector('#enquiry textarea');
			if (ta && !ta.value) ta.value = a.getAttribute('data-wm-prefill');
		});
	});

	/* ---------- Thank-you page conversion event ---------- */
	var thanks = d.querySelector('[data-wm-thanks]');
	if (thanks) {
		var t = thanks.getAttribute('data-wm-thanks');
		var flagKey = 'wm_conv_' + t + '_' + (new Date()).toDateString();
		var seen = false;
		try { seen = sessionStorage.getItem(flagKey); sessionStorage.setItem(flagKey, '1'); } catch (e) {}
		if (t && !seen) track('wm_enquiry_submit', { type: t });
	}

	/* ---------- Enquiry forms ---------- */
	function refreshToken(form) {
		if (!cfg.tokenUrl || !window.fetch) return;
		fetch(cfg.tokenUrl, { credentials: 'same-origin', cache: 'no-store' })
			.then(function (r) { return r.ok ? r.json() : null; })
			.then(function (j) { if (j && j.token) { var f = form.querySelector('[data-wm-token]'); if (f) f.value = j.token; } })
			.catch(function () {});
	}

	function fieldError(form, key, msg) {
		var wrap = form.querySelector('[data-field="' + key + '"]');
		if (!wrap) return null;
		var err = wrap.querySelector('.wm-error');
		var input = wrap.querySelector('input, select, textarea, fieldset');
		wrap.classList.toggle('has-error', !!msg);
		if (err) { err.textContent = msg || ''; err.hidden = !msg; }
		wrap.querySelectorAll('input, select, textarea').forEach(function (i) {
			if (msg) i.setAttribute('aria-invalid', 'true'); else i.removeAttribute('aria-invalid');
		});
		return input;
	}

	function validate(form, only) {
		var errors = [];
		(only ? [only] : form.querySelectorAll('[data-field]')).forEach(function (wrap) {
			var key = wrap.getAttribute('data-field');
			var label = (wrap.querySelector('label, legend') || {}).textContent || key;
			label = label.replace(/\(required\)/, '').trim();
			var msg = '';
			var inputs = wrap.querySelectorAll('input, select, textarea');
			var req = wrap.querySelector('[required], [aria-required="true"]');
			var first = inputs[0];
			if (!first) return;
			if (first.type === 'checkbox' || first.type === 'radio') {
				var any = Array.prototype.some.call(inputs, function (i) { return i.checked; });
				if (req && !any) msg = first.name.indexOf('[consent]') > -1 ? 'Please confirm you agree, so we can reply to you.' : 'Please choose an option for "' + label + '".';
			} else {
				var v = first.value.trim();
				if (req && !v) msg = 'Please fill in "' + label + '".';
				else if (v && first.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Please enter a valid email address, like name@example.com.';
				else if (v && first.type === 'number' && (isNaN(Number(v)) || Number(v) < 0)) msg = 'Please enter a number (or leave this empty).';
				else if (first.maxLength > 0 && v.length > first.maxLength) msg = 'Please keep this under ' + first.maxLength + ' characters.';
			}
			fieldError(form, key, msg);
			if (msg) errors.push({ key: key, msg: msg, id: (wrap.querySelector('[id]') || {}).id });
		});
		return errors;
	}

	function showSummary(form, title, errors) {
		var box = form.querySelector('.wm-form__summary');
		box.innerHTML = '';
		var p = d.createElement('p');
		var s = d.createElement('strong');
		s.textContent = title;
		p.appendChild(s);
		box.appendChild(p);
		if (errors && errors.length) {
			var ul = d.createElement('ul');
			errors.forEach(function (er) {
				var li = d.createElement('li');
				var a = d.createElement('a');
				a.href = '#' + (er.id || '');
				a.textContent = er.msg;
				a.addEventListener('click', function (ev) { ev.preventDefault(); var t = d.getElementById(er.id); if (t) { var f = t.matches('fieldset') ? t.querySelector('input') : t; (f || t).focus(); } });
				li.appendChild(a);
				ul.appendChild(li);
			});
			box.appendChild(ul);
		}
		box.hidden = false;
		box.focus();
	}

	d.querySelectorAll('[data-wm-form]').forEach(function (form) {
		refreshToken(form);
		var started = false;
		form.addEventListener('input', function () {
			if (!started) { started = true; track('wm_form_start', { type: form.getAttribute('data-type') }); }
		}, { once: true });

		// Clear a field's error as soon as it is corrected (on input/change, not focusout,
		// so the layout never shifts between mousedown and mouseup on the next control).
		var recheck = function (e) {
			var wrap = e.target.closest('[data-field]');
			if (!wrap || !wrap.classList.contains('has-error')) return;
			validate(form, wrap);
		};
		form.addEventListener('input', recheck);
		form.addEventListener('change', recheck);

		form.addEventListener('submit', function (e) {
			var errors = validate(form);
			if (errors.length) {
				e.preventDefault();
				showSummary(form, cfg.i18n.fix || 'Please correct the following:', errors);
				return;
			}
			if (!window.fetch || !window.FormData) return; // fall back to normal POST
			e.preventDefault();
			var btn = form.querySelector('button[type="submit"]');
			var label = btn.querySelector('span');
			var original = label.textContent;
			var status = form.querySelector('.wm-form__status');
			btn.disabled = true;
			label.textContent = cfg.i18n.sending || 'Sending…';
			status.textContent = cfg.i18n.sending || 'Sending…';
			var fd = new FormData(form);
			fd.append('wm_ajax', '1');
			window.WMStaticSubmit(form)
				.then(function (j) {
					if (j && j.ok && j.redirect) {
						status.textContent = '';
						// The conversion event fires on the confirmation page, so it is not lost to navigation.
						window.location.assign(j.redirect);
						return;
					}
					var list = [];
					if (j && j.errors) {
						Object.keys(j.errors).forEach(function (k) {
							var input = fieldError(form, k, j.errors[k]);
							list.push({ key: k, msg: j.errors[k], id: input ? input.id : '' });
						});
					}
					showSummary(form, (j && j.message) || cfg.i18n.error, list);
					status.textContent = '';
					refreshToken(form);
				})
				.catch(function () {
					showSummary(form, cfg.i18n.error, []);
					status.textContent = '';
				})
				.finally(function () {
					btn.disabled = false;
					label.textContent = original;
				});
		});
	});
})();
