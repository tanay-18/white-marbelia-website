/* White Marbelia static site: enquiry forms send through Web3Forms (https://web3forms.com).
   To connect the forms, put the access key between the quotes below. */
window.WM_FORM_KEY = "";
window.WMStaticSubmit = function (form) {
	var key = window.WM_FORM_KEY;
	var type = form.getAttribute('data-type') || 'general';
	if (!key) {
		return Promise.resolve({ ok: false, message: 'Our online form is being connected. Please email whitemarbeliavn@gmail.com or WhatsApp +84 397 761 894, and we will reply quickly.' });
	}
	var data = { access_key: key, from_name: 'White Marbelia website', subject: 'New website enquiry (' + type + ')' };
	var honey = form.querySelector('input[name="wm[website]"]');
	if (honey && honey.value) { return Promise.resolve({ ok: true, redirect: '/enquiry-received/' }); }
	form.querySelectorAll('[data-field]').forEach(function (wrap) {
		var label = ((wrap.querySelector('label, legend') || {}).textContent || wrap.getAttribute('data-field')).replace(/\(required\)/, '').trim();
		var vals = [];
		wrap.querySelectorAll('input, select, textarea').forEach(function (i) {
			if ((i.type === 'checkbox' || i.type === 'radio')) {
				if (i.checked) { var l = form.querySelector('label[for="' + i.id + '"]'); vals.push(l ? l.textContent.trim() : i.value); }
			} else if (i.tagName === 'SELECT') {
				if (i.value) { vals.push(i.options[i.selectedIndex].text.trim()); }
			} else if (i.value.trim()) { vals.push(i.value.trim()); }
		});
		if (wrap.querySelector('input[name*="[consent]"]')) { label = 'Consent'; vals = vals.length ? ['Yes'] : []; }
		if (vals.length) { data[label] = vals.join(', '); }
		var em = wrap.querySelector('input[type="email"]');
		if (em && em.value) { data.replyto = em.value.trim(); }
	});
	data['Page'] = location.href;
	return fetch('https://api.web3forms.com/submit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(data) })
		.then(function (r) { return r.json(); })
		.then(function (j) { return j && j.success ? { ok: true, redirect: '/enquiry-received/' } : { ok: false, message: 'Sorry, your enquiry could not be sent. Please email whitemarbeliavn@gmail.com or WhatsApp +84 397 761 894.' }; });
};
