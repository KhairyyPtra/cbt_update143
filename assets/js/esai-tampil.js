/*
 * Tampilkan jawaban esai yang diketik peserta (teks polos) dengan aman di halaman koreksi / pratinjau.
 * Format jawaban: teks UTF-8 biasa, baris baru = "\n", rumus ditulis sebagai \( LaTeX \).
 * Teks tidak pernah dianggap HTML; setiap baris diberi dir="auto" agar teks Arab tampil kanan ke kiri.
 * Rumus dirender dengan MathLive (assets/vendor/mathlive) bila sudah dimuat; tanpa MathLive rumus tampil sebagai teks.
 * Aksara daerah dirapikan oleh aksara.js karena wadah diberi atribut data-az-aksara.
 *
 *   azEsaiTampil.render(elemen, teks);
 *   azEsaiTampil.adaIsi(teks);       // true bila jawaban berisi teks/rumus
 *   azEsaiTampil.teksPolos(teks);    // jawaban tanpa penanda rumus, untuk pencarian / cuplikan
 *
 * Salinan berkas ini HARUS identik di cbtazzahra, azcbt, cbtvue (assets/js) dan AndroidApp (assets/js).
 * Skrip memakai JavaScript lama (ES5) dan hanya karakter ASCII.
 */
(function () {
	'use strict';

	if (window.azEsaiTampil) {
		return;
	}

	var POLA_RUMUS = /\\\(([\s\S]*?)\\\)/g;

	function potongBagian(baris) {
		var hasil = [];
		var akhir = 0;
		var cocok;
		POLA_RUMUS.lastIndex = 0;
		while ((cocok = POLA_RUMUS.exec(baris)) !== null) {
			if (cocok.index > akhir) {
				hasil.push({ rumus: false, isi: baris.slice(akhir, cocok.index) });
			}
			hasil.push({ rumus: true, isi: cocok[1] });
			akhir = cocok.index + cocok[0].length;
		}
		if (akhir < baris.length) {
			hasil.push({ rumus: false, isi: baris.slice(akhir) });
		}
		return hasil;
	}

	var POLA_PERINTAH_HTML = /\\(htmlStyle|htmlData|htmlId|cssId|style|class|href|url|includegraphics)(?![A-Za-z])/g;

	function rumusAman(latex) {
		return String(latex).replace(POLA_PERINTAH_HTML, '\\text');
	}

	function markupRumus(latex) {
		var ml = window.MathLive;
		if (!ml || typeof ml.convertLatexToMarkup !== 'function') {
			return null;
		}
		try {
			return ml.convertLatexToMarkup(rumusAman(latex));
		} catch (e) {
			return null;
		}
	}

	function buatRumus(latex) {
		var span = document.createElement('span');
		span.className = 'az-esai-rumus';
		var markup = markupRumus(latex);
		if (markup === null) {
			span.className += ' az-esai-rumus-teks';
			span.textContent = latex;
			return span;
		}
		span.innerHTML = markup;
		span.setAttribute('title', latex);
		return span;
	}

	function render(elemen, teks) {
		if (!elemen) {
			return;
		}
		while (elemen.firstChild) {
			elemen.removeChild(elemen.firstChild);
		}
		elemen.setAttribute('data-az-aksara', '');
		if (elemen.className.indexOf('az-esai-jawaban') === -1) {
			elemen.className += (elemen.className ? ' ' : '') + 'az-esai-jawaban';
		}
		var daftarBaris = String(teks === null || teks === undefined ? '' : teks).replace(/\r\n?/g, '\n').split('\n');
		for (var i = 0; i < daftarBaris.length; i++) {
			var div = document.createElement('div');
			div.className = 'az-esai-baris';
			div.setAttribute('dir', 'auto');
			var bagian = potongBagian(daftarBaris[i]);
			if (bagian.length === 0) {
				div.appendChild(document.createElement('br'));
			}
			for (var j = 0; j < bagian.length; j++) {
				if (bagian[j].rumus) {
					div.appendChild(buatRumus(bagian[j].isi));
				} else {
					div.appendChild(document.createTextNode(bagian[j].isi));
				}
			}
			elemen.appendChild(div);
		}
		if (window.azAksara && typeof window.azAksara.proses === 'function') {
			window.azAksara.proses();
		}
	}

	function teksPolos(teks) {
		return String(teks === null || teks === undefined ? '' : teks).replace(POLA_RUMUS, function (semua, latex) {
			return ' ' + latex + ' ';
		}).replace(/\s+/g, ' ').trim();
	}

	function adaIsi(teks) {
		return teksPolos(teks) !== '';
	}

	window.azEsaiTampil = {
		render: render,
		adaIsi: adaIsi,
		teksPolos: teksPolos
	};
})();
