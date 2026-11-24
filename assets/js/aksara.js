/*
 * Aksara daerah (Jawa, Sunda, Bali, Lontara, Makassar, Batak, Rejang) dan huruf Arab di isi soal.
 * Potongan teks beraksara dibungkus <span class="az-aksara">, potongan teks Arab dibungkus <span class="az-arab">,
 * agar memakai font bawaan aplikasi (aksara.css + fonts/aksara) walaupun isi soal memakai font lain seperti
 * Times New Roman atau font Quran yang tidak terpasang di perangkat siswa (harakat & tanda waqaf tetap tampil).
 * Huruf Arab bentuk presentasi (FB50-FEFC, biasanya hasil salin dari PDF) dinormalkan ke huruf dasar.
 * Hanya bekerja di wadah isi soal (isinya diganti utuh lewat innerHTML), bukan teks antarmuka.
 * Pengaturan (opsional, didefinisikan sebelum skrip ini dimuat):
 *   window.AZ_AKSARA = { wadah: '#pnlSoal' };   // pemilih elemen isi soal
 * Skrip memakai JavaScript lama (ES5) agar jalan di WebView Android lama. Salinan Android harus identik.
 */
(function () {
	'use strict';

	var pengaturan = window.AZ_AKSARA || {};
	var PEMILIH_WADAH = pengaturan.wadah || '[ng-bind-html], [data-az-muat-tabel], [data-az-aksara], .kolomsoal, #pnlSoal, .az-isi-soal, .fr-view, .az-ai-pratinjau, .az-ai-opsi-isi';
	var KELAS = 'az-aksara';
	var KELAS_ARAB = 'az-arab';
	var HURUF = '\uA980-\uA9DF\u1B80-\u1BBF\u1CC0-\u1CC7\u1B00-\u1B7F\u1A00-\u1A1F\uA930-\uA95F\u1BC0-\u1BFF';
	var MAKASSAR = '\uD807[\uDEE0-\uDEF8]';
	var ARAB = '\u0600-\u06FF\u0750-\u077F\u0870-\u08FF\uFB50-\uFDFF\uFE70-\uFEFC';
	var ADA_AKSARA = new RegExp('[' + HURUF + ']|' + MAKASSAR);
	var ADA = new RegExp('[' + HURUF + ARAB + ']|' + MAKASSAR);
	var POTONGAN_ARAB = '[' + ARAB + '](?:[' + ARAB + '\u200C\u200D\u25CC \u00A0]*[' + ARAB + '])?';
	var POTONGAN = new RegExp('(' + POTONGAN_ARAB + ')|(?:[' + HURUF + '\u200C\u200D\u25CC]|' + MAKASSAR + ')+', 'g');
	var PRESENTASI = /[\uFB50-\uFD3D\uFD40-\uFDF1\uFDF3-\uFDF9\uFDFE-\uFDFF\uFE70-\uFEFC]/g;
	var DILEWATI = { SCRIPT: true, STYLE: true, TEXTAREA: true, INPUT: true, SELECT: true, OPTION: true };
	var jadwal = null;

	function sudahDibungkus(elemen) {
		var kelas = typeof elemen.className === 'string' ? ' ' + elemen.className + ' ' : '';
		return kelas.indexOf(' ' + KELAS + ' ') !== -1 || kelas.indexOf(' ' + KELAS_ARAB + ' ') !== -1;
	}

	function normalkanArab(teks) {
		if (!String.prototype.normalize) {
			return teks;
		}
		return teks.replace(PRESENTASI, function (huruf) {
			return huruf.normalize('NFKC');
		});
	}

	function dilewati(teks) {
		var elemen = teks.parentNode;
		while (elemen && elemen.nodeType === 1) {
			if (DILEWATI[elemen.nodeName] || elemen.isContentEditable || sudahDibungkus(elemen)) {
				return true;
			}
			elemen = elemen.parentNode;
		}
		return false;
	}

	function bungkus(teks) {
		var isi = teks.nodeValue;
		var hasil = document.createDocumentFragment();
		var akhir = 0;
		var adaBungkus = false;
		var cocok;
		POTONGAN.lastIndex = 0;
		while ((cocok = POTONGAN.exec(isi)) !== null) {
			var arab = !!cocok[1];
			if (!arab && !ADA_AKSARA.test(cocok[0])) {
				continue;
			}
			if (cocok.index > akhir) {
				hasil.appendChild(document.createTextNode(isi.substring(akhir, cocok.index)));
			}
			var span = document.createElement('span');
			span.className = arab ? KELAS_ARAB : KELAS;
			span.appendChild(document.createTextNode(arab ? normalkanArab(cocok[0]) : cocok[0]));
			hasil.appendChild(span);
			akhir = cocok.index + cocok[0].length;
			adaBungkus = true;
		}
		if (!adaBungkus) {
			return;
		}
		if (akhir < isi.length) {
			hasil.appendChild(document.createTextNode(isi.substring(akhir)));
		}
		teks.parentNode.replaceChild(hasil, teks);
	}

	function proses(akar) {
		var jalan = document.createTreeWalker(akar, 4, null, false);
		var daftar = [];
		var teks = jalan.nextNode();
		while (teks) {
			if (ADA.test(teks.nodeValue) && !dilewati(teks)) {
				daftar.push(teks);
			}
			teks = jalan.nextNode();
		}
		for (var i = 0; i < daftar.length; i++) {
			bungkus(daftar[i]);
		}
	}

	function prosesSemua() {
		var wadah;
		try {
			wadah = document.querySelectorAll(PEMILIH_WADAH);
		} catch (galat) {
			return;
		}
		for (var i = 0; i < wadah.length; i++) {
			proses(wadah[i]);
		}
	}

	function jadwalkan() {
		if (jadwal) {
			clearTimeout(jadwal);
		}
		jadwal = setTimeout(prosesSemua, 100);
	}

	function mulai() {
		if (!document.createTreeWalker || !document.querySelectorAll) {
			return;
		}
		prosesSemua();
		if (window.MutationObserver) {
			new MutationObserver(jadwalkan).observe(document.body, { childList: true, subtree: true, characterData: true });
		}
		window.addEventListener('beforeprint', prosesSemua);
	}

	window.azAksara = { proses: prosesSemua };

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', mulai);
	} else {
		mulai();
	}
})();
