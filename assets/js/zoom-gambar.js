/*
 * Popup gambar soal yang bisa diperbesar & digeser (web, SEB, desktop, Android, Vue, cbtoff).
 * Salinan identik: cbtazzahra/azcbt/cbtvue assets/js, AndroidApp assets/js, frontend & cbtvue-frontend src/siswa/lib,
 * cbtoff assets/esai/js. ES5 & ASCII saja (WebView Android lama).
 *
 * window.AZ_ZOOM_GAMBAR (opsional, sebelum skrip dimuat):
 *   wadah   : selector elemen isi soal; hanya gambar di dalamnya yang dapat di-popup
 *   kecuali : selector tambahan yang gambarnya diabaikan
 *   saatTerbuka(terbuka) : dipanggil saat popup dibuka/ditutup (Android: sembunyikan tombol daftar nomor)
 * Ikon huruf pilihan A-E (img[id^=option], img[alt^=option], img ber-onclick) tidak di-popup; gambar di isi soal
 * maupun di isi pilihan jawaban dapat di-popup. Klik gambar tidak diteruskan, jadi tidak ikut memilih jawaban.
 */
(function () {
	'use strict';

	if (window.azZoomGambar) {
		return;
	}

	var SKALA_MAKS = 6;
	var SKALA_KETUK = 2.5;
	var JEDA_KETUK_GANDA = 300;
	var UKURAN_MINIMUM = 24;
	var KECUALI_BAWAAN = 'a, button, select';

	function setelan() {
		return window.AZ_ZOOM_GAMBAR || {};
	}

	function wadahSoal() {
		return setelan().wadah || '#pnlSoal';
	}

	function kecualiTambahan() {
		return setelan().kecuali || '';
	}

	function kabarkan(terbuka) {
		var saatTerbuka = setelan().saatTerbuka;
		if (typeof saatTerbuka !== 'function') {
			return;
		}
		try {
			saatTerbuka(terbuka);
		} catch (galat) {
			return;
		}
	}

	var JEDA_PETUNJUK = 2500;

	var lapisan = null;
	var bingkai = null;
	var gambar = null;
	var petunjuk = null;
	var timerPetunjuk = null;
	var keadaan = { skala: 1, x: 0, y: 0, lebar: 0, tinggi: 0, sudut: 0 };
	var sentuh = { jari: 0, awalJarak: 0, awalSkala: 1, awalX: 0, awalY: 0, titikX: 0, titikY: 0, geser: false, bergerak: false, ketukTerakhir: 0 };

	function cocok(el, selector) {
		if (!el || el.nodeType !== 1 || !selector) {
			return false;
		}
		var fungsi = el.matches || el.webkitMatchesSelector || el.msMatchesSelector || el.mozMatchesSelector;
		if (!fungsi) {
			return false;
		}
		try {
			return fungsi.call(el, selector);
		} catch (galat) {
			return false;
		}
	}

	function cariWadah(el) {
		while (el && el !== document) {
			if (cocok(el, wadahSoal())) {
				return el;
			}
			el = el.parentNode;
		}
		return null;
	}

	function gambarOpsi(img) {
		var id = img.getAttribute('id') || '';
		var alt = img.getAttribute('alt') || '';
		return id.indexOf('option') === 0 || alt.toLowerCase().indexOf('option') === 0;
	}

	function bolehDibuka(img) {
		var wadah = cariWadah(img);
		if (!wadah || gambarOpsi(img) || img.hasAttribute('onclick')) {
			return false;
		}
		var el = img.parentNode;
		while (el && el !== wadah) {
			if (cocok(el, KECUALI_BAWAAN) || (kecualiTambahan() && cocok(el, kecualiTambahan()))) {
				return false;
			}
			el = el.parentNode;
		}
		var lebar = img.naturalWidth || img.width;
		var tinggi = img.naturalHeight || img.height;
		return lebar >= UKURAN_MINIMUM && tinggi >= UKURAN_MINIMUM;
	}

	function pasangGaya() {
		if (document.getElementById('az-zg-gaya')) {
			return;
		}
		var css = '' +
			'.az-zg-lapisan{position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483000;background:rgba(15,23,42,.92);overflow:hidden;' +
			'touch-action:none;-webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent}' +
			'.az-zg-bingkai{position:absolute;left:0;top:0;-webkit-transform-origin:0 0;transform-origin:0 0;cursor:grab}' +
			'.az-zg-gambar{position:absolute;max-width:none;max-height:none;background:#fff;border-radius:4px;' +
			'box-shadow:0 10px 40px rgba(0,0,0,.45);-webkit-user-drag:none;-webkit-transition:-webkit-transform .2s;transition:transform .2s}' +
			'.az-zg-tutup{position:absolute;top:12px;right:12px;width:44px;height:44px;border:1px solid rgba(255,255,255,.35);border-radius:50%;' +
			'background:rgba(15,23,42,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);color:#fff;font-size:28px;line-height:42px;text-align:center;cursor:pointer;padding:0;box-shadow:0 2px 10px rgba(0,0,0,.45)}' +
			'.az-zg-alat{position:absolute;left:50%;bottom:16px;-webkit-transform:translateX(-50%);transform:translateX(-50%);display:-webkit-box;display:flex;' +
			'background:rgba(15,23,42,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.35);border-radius:24px;padding:4px;box-shadow:0 2px 12px rgba(0,0,0,.45)}' +
			'.az-zg-alat button{width:44px;height:40px;border:0;background:transparent;color:#fff;font-size:22px;line-height:40px;cursor:pointer;padding:0}' +
			'.az-zg-alat .az-zg-teks{font-size:14px;font-weight:700;font-family:sans-serif}' +
			'.az-zg-petunjuk{position:absolute;left:64px;right:64px;top:16px;text-align:center;color:#fff;font:13px/1.4 sans-serif;pointer-events:none;padding:6px 10px;' +
			'background:rgba(15,23,42,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border-radius:10px;' +
			'-webkit-transition:opacity .4s;transition:opacity .4s}' +
			'.az-zg-petunjuk.az-zg-hilang{opacity:0}' +
			'.az-zg-buka{cursor:zoom-in}';
		var gaya = document.createElement('style');
		gaya.id = 'az-zg-gaya';
		gaya.appendChild(document.createTextNode(css));
		(document.head || document.documentElement).appendChild(gaya);
	}

	function sembunyikanPetunjuk() {
		if (petunjuk) {
			petunjuk.className = 'az-zg-petunjuk az-zg-hilang';
		}
	}

	function terapkan() {
		var t = 'translate(' + keadaan.x + 'px,' + keadaan.y + 'px) scale(' + keadaan.skala + ')';
		bingkai.style.webkitTransform = t;
		bingkai.style.transform = t;
		if (keadaan.skala > 1) {
			sembunyikanPetunjuk();
		}
	}

	function batasiGeser() {
		var lebarLayar = lapisan.clientWidth;
		var tinggiLayar = lapisan.clientHeight;
		var lebar = keadaan.lebar * keadaan.skala;
		var tinggi = keadaan.tinggi * keadaan.skala;
		if (lebar <= lebarLayar) {
			keadaan.x = (lebarLayar - lebar) / 2;
		} else {
			keadaan.x = Math.min(0, Math.max(lebarLayar - lebar, keadaan.x));
		}
		if (tinggi <= tinggiLayar) {
			keadaan.y = (tinggiLayar - tinggi) / 2;
		} else {
			keadaan.y = Math.min(0, Math.max(tinggiLayar - tinggi, keadaan.y));
		}
	}

	function zoomDi(skalaBaru, titikX, titikY) {
		skalaBaru = Math.max(1, Math.min(SKALA_MAKS, skalaBaru));
		var rasio = skalaBaru / keadaan.skala;
		keadaan.x = titikX - (titikX - keadaan.x) * rasio;
		keadaan.y = titikY - (titikY - keadaan.y) * rasio;
		keadaan.skala = skalaBaru;
		batasiGeser();
		terapkan();
	}

	function zoomTengah(faktor) {
		zoomDi(keadaan.skala * faktor, lapisan.clientWidth / 2, lapisan.clientHeight / 2);
	}

	function ukurAwal() {
		if (!lapisan) {
			return;
		}
		var lebarLayar = lapisan.clientWidth;
		var tinggiLayar = lapisan.clientHeight;
		var lebarAsli = gambar.naturalWidth || 1;
		var tinggiAsli = gambar.naturalHeight || 1;
		var miring = keadaan.sudut % 180 !== 0;
		var lebarTampil = miring ? tinggiAsli : lebarAsli;
		var tinggiTampil = miring ? lebarAsli : tinggiAsli;
		var muat = Math.min((lebarLayar * 0.94) / lebarTampil, (tinggiLayar * 0.76) / tinggiTampil);
		var perbesarKecil = Math.min(3, muat);
		var lebarGambar = lebarAsli * perbesarKecil;
		var tinggiGambar = tinggiAsli * perbesarKecil;
		keadaan.lebar = lebarTampil * perbesarKecil;
		keadaan.tinggi = tinggiTampil * perbesarKecil;
		bingkai.style.width = keadaan.lebar + 'px';
		bingkai.style.height = keadaan.tinggi + 'px';
		gambar.style.width = lebarGambar + 'px';
		gambar.style.height = tinggiGambar + 'px';
		gambar.style.left = ((keadaan.lebar - lebarGambar) / 2) + 'px';
		gambar.style.top = ((keadaan.tinggi - tinggiGambar) / 2) + 'px';
		var putar = 'rotate(' + keadaan.sudut + 'deg)';
		gambar.style.webkitTransform = putar;
		gambar.style.transform = putar;
		keadaan.skala = 1;
		batasiGeser();
		terapkan();
	}

	function putarGambar() {
		keadaan.sudut = (keadaan.sudut + 90) % 360;
		ukurAwal();
	}

	function tombol(teks, judul, aksi) {
		var b = document.createElement('button');
		b.type = 'button';
		b.title = judul;
		b.setAttribute('aria-label', judul);
		b.innerHTML = teks;
		b.addEventListener('click', function (e) {
			e.stopPropagation();
			aksi();
		});
		return b;
	}

	function titikLapisan(clientX, clientY) {
		var kotak = lapisan.getBoundingClientRect();
		return { x: clientX - kotak.left, y: clientY - kotak.top };
	}

	function jarak(a, b) {
		var dx = a.clientX - b.clientX;
		var dy = a.clientY - b.clientY;
		return Math.sqrt(dx * dx + dy * dy);
	}

	function diTombol(el) {
		while (el && el !== lapisan) {
			if (el.tagName === 'BUTTON') {
				return true;
			}
			el = el.parentNode;
		}
		return false;
	}

	function mulaiSentuh(e) {
		if (diTombol(e.target)) {
			sentuh.jari = 0;
			return;
		}
		sentuh.jari = e.touches.length;
		sentuh.bergerak = false;
		if (e.touches.length === 2) {
			sentuh.awalJarak = jarak(e.touches[0], e.touches[1]);
			sentuh.awalSkala = keadaan.skala;
			var tengah = titikLapisan((e.touches[0].clientX + e.touches[1].clientX) / 2, (e.touches[0].clientY + e.touches[1].clientY) / 2);
			sentuh.titikX = tengah.x;
			sentuh.titikY = tengah.y;
		} else if (e.touches.length === 1) {
			sentuh.awalX = e.touches[0].clientX - keadaan.x;
			sentuh.awalY = e.touches[0].clientY - keadaan.y;
		}
		e.preventDefault();
	}

	function gerakSentuh(e) {
		if (sentuh.jari === 0) {
			return;
		}
		sentuh.bergerak = true;
		if (e.touches.length === 2 && sentuh.awalJarak > 0) {
			var skalaBaru = sentuh.awalSkala * (jarak(e.touches[0], e.touches[1]) / sentuh.awalJarak);
			zoomDi(skalaBaru, sentuh.titikX, sentuh.titikY);
		} else if (e.touches.length === 1 && sentuh.jari === 1) {
			keadaan.x = e.touches[0].clientX - sentuh.awalX;
			keadaan.y = e.touches[0].clientY - sentuh.awalY;
			batasiGeser();
			terapkan();
		}
		e.preventDefault();
	}

	function akhirSentuh(e) {
		if (sentuh.jari === 0) {
			return;
		}
		if (e.touches.length === 1) {
			sentuh.jari = 1;
			sentuh.awalX = e.touches[0].clientX - keadaan.x;
			sentuh.awalY = e.touches[0].clientY - keadaan.y;
			return;
		}
		if (e.touches.length > 0 || sentuh.bergerak || sentuh.jari !== 1) {
			sentuh.jari = e.touches.length;
			return;
		}
		var sekarang = new Date().getTime();
		var titik = titikLapisan(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
		if (sekarang - sentuh.ketukTerakhir < JEDA_KETUK_GANDA) {
			sentuh.ketukTerakhir = 0;
			zoomDi(keadaan.skala > 1 ? 1 : SKALA_KETUK, titik.x, titik.y);
			return;
		}
		sentuh.ketukTerakhir = sekarang;
		if (e.target === lapisan && keadaan.skala === 1) {
			setTimeout(function () {
				if (sentuh.ketukTerakhir === sekarang) {
					tutup();
				}
			}, JEDA_KETUK_GANDA);
		}
	}

	function mulaiMouse(e) {
		if (e.button !== 0 || (e.target !== gambar && e.target !== bingkai)) {
			return;
		}
		sentuh.geser = true;
		sentuh.bergerak = false;
		sentuh.awalX = e.clientX - keadaan.x;
		sentuh.awalY = e.clientY - keadaan.y;
		bingkai.style.cursor = 'grabbing';
		e.preventDefault();
	}

	function gerakMouse(e) {
		if (!sentuh.geser) {
			return;
		}
		sentuh.bergerak = true;
		keadaan.x = e.clientX - sentuh.awalX;
		keadaan.y = e.clientY - sentuh.awalY;
		batasiGeser();
		terapkan();
	}

	function akhirMouse() {
		sentuh.geser = false;
		if (bingkai) {
			bingkai.style.cursor = 'grab';
		}
	}

	function rodaMouse(e) {
		var titik = titikLapisan(e.clientX, e.clientY);
		var arah = e.deltaY < 0 ? 1.2 : 1 / 1.2;
		zoomDi(keadaan.skala * arah, titik.x, titik.y);
		e.preventDefault();
	}

	function klikGanda(e) {
		var titik = titikLapisan(e.clientX, e.clientY);
		zoomDi(keadaan.skala > 1 ? 1 : SKALA_KETUK, titik.x, titik.y);
		e.preventDefault();
	}

	function klikLapisan(e) {
		if (e.target === lapisan && !sentuh.bergerak) {
			tutup();
		}
	}

	function tombolKeyboard(e) {
		if (!lapisan) {
			return;
		}
		if (e.key === 'Escape' || e.keyCode === 27) {
			tutup();
		} else if (e.key === '+' || e.key === '=') {
			zoomTengah(1.25);
		} else if (e.key === '-') {
			zoomTengah(0.8);
		}
	}

	function cegah(e) {
		e.preventDefault();
	}

	function buka(img) {
		pasangGaya();
		tutup();
		lapisan = document.createElement('div');
		lapisan.className = 'az-zg-lapisan';
		lapisan.setAttribute('role', 'dialog');
		lapisan.setAttribute('aria-label', 'Gambar soal');
		keadaan.sudut = 0;
		bingkai = document.createElement('div');
		bingkai.className = 'az-zg-bingkai';
		gambar = document.createElement('img');
		gambar.className = 'az-zg-gambar';
		gambar.alt = img.getAttribute('alt') || 'Gambar soal';
		gambar.draggable = false;
		gambar.addEventListener('contextmenu', cegah);
		petunjuk = document.createElement('div');
		petunjuk.className = 'az-zg-petunjuk';
		petunjuk.appendChild(document.createTextNode('Cubit, scroll, atau ketuk dua kali untuk memperbesar. Geser untuk melihat bagian lain.'));
		var alat = document.createElement('div');
		alat.className = 'az-zg-alat';
		alat.appendChild(tombol('&minus;', 'Perkecil', function () { zoomTengah(0.8); }));
		alat.appendChild(tombol('<span class="az-zg-teks">1:1</span>', 'Ukuran awal', function () { zoomDi(1, 0, 0); }));
		alat.appendChild(tombol('+', 'Perbesar', function () { zoomTengah(1.25); }));
		alat.appendChild(tombol('&#8635;', 'Putar 90 derajat', putarGambar));
		bingkai.appendChild(gambar);
		lapisan.appendChild(bingkai);
		lapisan.appendChild(petunjuk);
		lapisan.appendChild(alat);
		var tombolTutup = tombol('&times;', 'Tutup', tutup);
		tombolTutup.className = 'az-zg-tutup';
		lapisan.appendChild(tombolTutup);
		lapisan.addEventListener('touchstart', mulaiSentuh, { passive: false });
		lapisan.addEventListener('touchmove', gerakSentuh, { passive: false });
		lapisan.addEventListener('touchend', akhirSentuh);
		lapisan.addEventListener('mousedown', mulaiMouse);
		lapisan.addEventListener('wheel', rodaMouse, { passive: false });
		lapisan.addEventListener('dblclick', klikGanda);
		lapisan.addEventListener('click', klikLapisan);
		lapisan.addEventListener('contextmenu', cegah);
		document.addEventListener('mousemove', gerakMouse);
		document.addEventListener('mouseup', akhirMouse);
		window.addEventListener('resize', ukurAwal);
		document.body.appendChild(lapisan);
		kabarkan(true);
		timerPetunjuk = setTimeout(sembunyikanPetunjuk, JEDA_PETUNJUK);
		gambar.onload = ukurAwal;
		gambar.src = img.currentSrc || img.src;
		if (gambar.complete && gambar.naturalWidth) {
			ukurAwal();
		}
	}

	function tutup() {
		if (!lapisan) {
			return;
		}
		document.removeEventListener('mousemove', gerakMouse);
		document.removeEventListener('mouseup', akhirMouse);
		window.removeEventListener('resize', ukurAwal);
		if (lapisan.parentNode) {
			lapisan.parentNode.removeChild(lapisan);
		}
		clearTimeout(timerPetunjuk);
		lapisan = null;
		bingkai = null;
		gambar = null;
		petunjuk = null;
		sentuh.geser = false;
		kabarkan(false);
	}

	function tandaiGambar(e) {
		var img = e.target;
		if (img && img.tagName === 'IMG' && !lapisan && bolehDibuka(img)) {
			img.classList.add('az-zg-buka');
		}
	}

	function klikDokumen(e) {
		var img = e.target;
		if (!img || img.tagName !== 'IMG' || lapisan) {
			return;
		}
		if (!bolehDibuka(img)) {
			return;
		}
		e.preventDefault();
		e.stopPropagation();
		buka(img);
	}

	pasangGaya();
	document.addEventListener('click', klikDokumen, true);
	document.addEventListener('mouseover', tandaiGambar, false);
	document.addEventListener('keydown', tombolKeyboard, false);

	window.azZoomGambar = { buka: buka, tutup: tutup, terbuka: function () { return !!lapisan; } };
})();
