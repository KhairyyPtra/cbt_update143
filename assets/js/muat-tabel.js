/*
 * Menyesuaikan tabel di isi soal agar tidak melebihi lebar halaman / kertas.
 * Pengaturan (opsional, didefinisikan sebelum skrip ini dimuat):
 *   window.AZ_MUAT_TABEL = {
 *     wadah: '.kolomsoal',   // pemilih elemen isi soal yang tabelnya diperiksa
 *     skalaMinimum: 0.6      // batas pengecilan; di bawah ini tabel dibuat bisa digeser (0 = selalu dikecilkan, untuk cetak)
 *   };
 * Tabel yang sudah muat tidak diubah. Skrip memakai JavaScript lama (ES5) agar jalan di WebView Android lama.
 */
(function () {
	'use strict';

	var pengaturan = window.AZ_MUAT_TABEL || {};
	var PEMILIH_WADAH = pengaturan.wadah || '[data-az-muat-tabel]';
	var SKALA_MINIMUM = typeof pengaturan.skalaMinimum === 'number' ? pengaturan.skalaMinimum : 0.6;
	var KELAS_GESER = 'az-tabel-geser';
	var jadwal = null;

	function pasangGaya() {
		if (document.getElementById('az-muat-tabel-gaya')) {
			return;
		}
		var gaya = document.createElement('style');
		gaya.id = 'az-muat-tabel-gaya';
		gaya.textContent =
			'.' + KELAS_GESER + '{display:block;max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch;margin:4px 0;}' +
			'.' + KELAS_GESER + '>table{max-width:none !important;}' +
			'.' + KELAS_GESER + '-petunjuk{display:block;font-size:12px;color:#6b7280;margin:2px 0 6px;}' +
			'@media print{.' + KELAS_GESER + '{overflow:visible;}.' + KELAS_GESER + '-petunjuk{display:none;}}';
		document.head.appendChild(gaya);
	}

	function indukBlok(elemen) {
		var induk = elemen.parentElement;
		while (induk && window.getComputedStyle(induk).display.indexOf('inline') === 0) {
			induk = induk.parentElement;
		}
		return induk;
	}

	function lebarIsiInduk(elemen) {
		var induk = indukBlok(elemen);
		if (!induk) {
			return 0;
		}
		var gaya = window.getComputedStyle(induk);
		var padding = parseFloat(gaya.paddingLeft) + parseFloat(gaya.paddingRight);
		return induk.getBoundingClientRect().width - padding;
	}

	function lebarAsli(tabel) {
		return Math.max(tabel.scrollWidth, tabel.getBoundingClientRect().width);
	}

	function kembalikanSkala(tabel) {
		tabel.style.zoom = '';
	}

	function lepasLebarTetap(tabel) {
		tabel.removeAttribute('width');
		tabel.style.width = '100%';
		tabel.style.maxWidth = '100%';
		var sel = tabel.querySelectorAll('td, th, col, colgroup');
		for (var i = 0; i < sel.length; i++) {
			sel[i].removeAttribute('width');
			sel[i].style.width = '';
			sel[i].style.minWidth = '';
			sel[i].style.whiteSpace = 'normal';
			sel[i].style.overflowWrap = 'break-word';
		}
		var tabelDalam = tabel.querySelectorAll('table');
		for (var k = 0; k < tabelDalam.length; k++) {
			tabelDalam[k].removeAttribute('width');
			tabelDalam[k].style.width = '100%';
			tabelDalam[k].style.maxWidth = '100%';
		}
		var gambar = tabel.querySelectorAll('img');
		for (var j = 0; j < gambar.length; j++) {
			gambar[j].style.maxWidth = '100%';
			gambar[j].style.height = 'auto';
		}
	}

	function bungkusAgarBisaDigeser(tabel) {
		var induk = tabel.parentElement;
		if (induk && induk.classList.contains(KELAS_GESER)) {
			return;
		}
		var petunjuk = document.createElement('span');
		petunjuk.className = KELAS_GESER + '-petunjuk';
		petunjuk.textContent = '↔ Geser tabel ke samping untuk melihat seluruh isi';
		var pembungkus = document.createElement('div');
		pembungkus.className = KELAS_GESER;
		tabel.parentNode.insertBefore(petunjuk, tabel);
		tabel.parentNode.insertBefore(pembungkus, tabel);
		pembungkus.appendChild(tabel);
	}

	function muatkanTabel(tabel) {
		if (tabel.parentElement && tabel.parentElement.classList.contains(KELAS_GESER)) {
			return;
		}
		kembalikanSkala(tabel);
		var batas = lebarIsiInduk(tabel);
		if (batas <= 0 || lebarAsli(tabel) <= batas + 1) {
			return;
		}
		lepasLebarTetap(tabel);
		var lebar = lebarAsli(tabel);
		if (lebar <= batas + 1) {
			return;
		}
		if (cobaKecilkan(tabel, batas, batas / lebar)) {
			return;
		}
		kembalikanSkala(tabel);
		bungkusAgarBisaDigeser(tabel);
	}

	function lebarTampil(tabel) {
		var kotak = tabel.getBoundingClientRect();
		var kanan = kotak.right;
		var isi = tabel.querySelectorAll('td, th, img, svg');
		for (var i = 0; i < isi.length; i++) {
			var kotakIsi = isi[i].getBoundingClientRect();
			if (kotakIsi.width > 0 && kotakIsi.right > kanan) {
				kanan = kotakIsi.right;
			}
		}
		return kanan - kotak.left;
	}

	function cobaKecilkan(tabel, batas, skalaAwal) {
		var skala = skalaAwal;
		for (var percobaan = 0; percobaan < 5; percobaan++) {
			if (skala < SKALA_MINIMUM) {
				return false;
			}
			tabel.style.zoom = String(Math.floor(skala * 1000) / 1000);
			var lebarSekarang = lebarTampil(tabel);
			if (lebarSekarang <= batas + 1) {
				return true;
			}
			skala = skala * (batas / lebarSekarang) - 0.005;
		}
		return false;
	}

	function pantauGambar(tabel) {
		var gambar = tabel.querySelectorAll('img');
		for (var k = 0; k < gambar.length; k++) {
			if (gambar[k].complete || gambar[k].getAttribute('data-az-muat-tunggu')) {
				continue;
			}
			gambar[k].setAttribute('data-az-muat-tunggu', '1');
			gambar[k].addEventListener('load', jadwalkan);
		}
	}

	function muatkanSemua() {
		jadwal = null;
		var wadah = document.querySelectorAll(PEMILIH_WADAH);
		for (var i = 0; i < wadah.length; i++) {
			var tabel = wadah[i].querySelectorAll('table');
			for (var j = 0; j < tabel.length; j++) {
				pantauGambar(tabel[j]);
				muatkanTabel(tabel[j]);
			}
		}
	}

	function jadwalkan() {
		if (jadwal !== null) {
			clearTimeout(jadwal);
		}
		jadwal = setTimeout(muatkanSemua, 120);
	}

	function mulai() {
		pasangGaya();
		muatkanSemua();
		if (window.MutationObserver) {
			new MutationObserver(jadwalkan).observe(document.body, { childList: true, subtree: true });
		}
		window.addEventListener('load', muatkanSemua);
		window.addEventListener('resize', jadwalkan);
		window.addEventListener('beforeprint', muatkanSemua);
		if (window.matchMedia) {
			var mediaCetak = window.matchMedia('print');
			if (mediaCetak.addListener) {
				mediaCetak.addListener(function (perubahan) {
					if (perubahan.matches) {
						muatkanSemua();
					}
				});
			}
		}
	}

	window.azMuatTabel = muatkanSemua;
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', mulai);
	} else {
		mulai();
	}
})();
