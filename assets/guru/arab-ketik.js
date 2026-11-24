/*
 * Tulis huruf Arab di editor soal (plugin TinyMCE "azarab" + jendela "Tulis Arab").
 * Guru mengetik dengan keyboard biasa (dipetakan ke tata letak keyboard Arab 101) atau mengklik papan huruf:
 * huruf hijaiyah, harakat, tanda waqaf & tanda Quran, nomor ayat, angka Arab dan huruf Pegon / Jawi.
 * Hasil disisipkan sebagai teks berfont "AZ Arab" (assets/css/aksara.css) atau sebagai gambar.
 * Skrip memakai JavaScript lama (ES5) dan hanya karakter ASCII.
 */
(function () {
	'use strict';

	function huruf() {
		var hasil = '';
		for (var i = 0; i < arguments.length; i++) {
			hasil += String.fromCharCode(arguments[i]);
		}
		return hasil;
	}

	function daftar(isi) {
		var hasil = [];
		for (var i = 0; i < isi.length; i++) {
			hasil.push({ nilai: typeof isi[i][0] === 'number' ? huruf(isi[i][0]) : isi[i][0], label: isi[i][1], tanda: !!isi[i][2] });
		}
		return hasil;
	}

	var LAM_ALIF = huruf(0x0644, 0x0627);

	var PAPAN = [
		{
			judul: 'Huruf hijaiyah',
			isi: daftar([
				[0x0627, 'alif'], [0x0628, 'ba'], [0x062A, 'ta'], [0x062B, 'tsa'], [0x062C, 'jim'], [0x062D, 'ha'], [0x062E, 'kha'],
				[0x062F, 'dal'], [0x0630, 'dzal'], [0x0631, 'ra'], [0x0632, 'zai'], [0x0633, 'sin'], [0x0634, 'syin'], [0x0635, 'shad'],
				[0x0636, 'dhad'], [0x0637, 'tha'], [0x0638, 'zha'], [0x0639, "'ain"], [0x063A, 'ghain'], [0x0641, 'fa'], [0x0642, 'qaf'],
				[0x0643, 'kaf'], [0x0644, 'lam'], [0x0645, 'mim'], [0x0646, 'nun'], [0x0648, 'wau'], [0x0647, 'ha'], [0x0621, 'hamzah'],
				[0x064A, 'ya']
			])
		},
		{
			judul: 'Alif, hamzah & lainnya',
			isi: daftar([
				[0x0623, 'alif hamzah atas'], [0x0625, 'alif hamzah bawah'], [0x0622, 'alif mad'], [0x0671, 'alif washal'],
				[0x0624, 'wau hamzah'], [0x0626, 'ya hamzah'], [0x0649, 'alif maqshurah'], [0x0629, "ta marbuthah"], [LAM_ALIF, 'lam alif'],
				[0x0640, 'tatwil']
			])
		},
		{
			judul: 'Harakat lainnya',
			isi: daftar([
				[0x0670, 'fathah berdiri', 1], [0x0656, 'kasrah berdiri', 1], [0x0657, 'dhammah terbalik', 1], [0x0653, 'mad', 1],
				[0x0654, 'hamzah atas', 1], [0x0655, 'hamzah bawah', 1]
			])
		},
		{
			judul: 'Tanda waqaf & tanda Quran',
			isi: daftar([
				[0x06D6, 'shad lam ya', 1], [0x06D7, 'qaf lam ya', 1], [0x06D8, 'mim (lazim)', 1], [0x06D9, 'la (jangan berhenti)', 1],
				[0x06DA, 'jim (jaiz)', 1], [0x06DB, "mu'anaqah", 1], [0x06DC, 'sin kecil', 1], [0x06E2, 'mim kecil (iqlab)', 1],
				[0x06ED, 'mim kecil bawah', 1], [0x06DF, 'bulatan kecil', 1], [0x06E0, 'bulatan lonjong', 1], [0x06E1, 'sukun kepala', 1],
				[0x06E5, 'wau kecil', 1], [0x06E6, 'ya kecil', 1], [0x06E7, 'ya kecil atas', 1], [0x06E8, 'nun kecil', 1],
				[0x06EA, 'titik bawah', 1], [0x06EB, 'titik atas', 1], [0x06EC, 'titik tengah', 1], [0x06E3, 'sin kecil bawah', 1],
				[0x06DE, 'rub el hizb'], [0x06E9, 'sajdah']
			])
		},
		{
			judul: 'Angka & tanda baca',
			isi: daftar([
				[0x0660, '0'], [0x0661, '1'], [0x0662, '2'], [0x0663, '3'], [0x0664, '4'], [0x0665, '5'], [0x0666, '6'], [0x0667, '7'],
				[0x0668, '8'], [0x0669, '9'], [0x060C, 'koma'], [0x061B, 'titik koma'], [0x061F, 'tanya'], [0x06D4, 'titik'],
				[0x066A, 'persen'], [0x00AB, 'kutip buka'], [0x00BB, 'kutip tutup'], [0xFD3F, 'kurung buka'], [0xFD3E, 'kurung tutup']
			])
		},
		{
			judul: 'Pegon / Jawi',
			isi: daftar([
				[0x0686, 'ca'], [0x06A0, 'nga'], [0x06A4, 'pa'], [0x0762, 'ga'], [0x06AC, 'ga (jawi)'], [0x06BD, 'nya'], [0x06D1, 'nya (jawi)'],
				[0x068E, 'dha'], [0x069F, 'tha'], [0x06CF, 'wa (va)']
			])
		}
	];

	var HARAKAT_UMUM = daftar([
		[0x064E, 'fathah', 1], [0x0650, 'kasrah', 1], [0x064F, 'dhammah', 1], [0x0652, 'sukun', 1], [0x0651, 'syaddah', 1],
		[0x064B, 'fathatain', 1], [0x064D, 'kasratain', 1], [0x064C, 'dhammatain', 1]
	]);

	var KEYBOARD = {
		'`': huruf(0x0630), '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9', '0': '0',
		q: huruf(0x0636), w: huruf(0x0635), e: huruf(0x062B), r: huruf(0x0642), t: huruf(0x0641), y: huruf(0x063A), u: huruf(0x0639),
		i: huruf(0x0647), o: huruf(0x062E), p: huruf(0x062D), '[': huruf(0x062C), ']': huruf(0x062F),
		a: huruf(0x0634), s: huruf(0x0633), d: huruf(0x064A), f: huruf(0x0628), g: huruf(0x0644), h: huruf(0x0627), j: huruf(0x062A),
		k: huruf(0x0646), l: huruf(0x0645), ';': huruf(0x0643), "'": huruf(0x0637),
		z: huruf(0x0626), x: huruf(0x0621), c: huruf(0x0624), v: huruf(0x0631), b: LAM_ALIF, n: huruf(0x0649), m: huruf(0x0629),
		',': huruf(0x0648), '.': huruf(0x0632), '/': huruf(0x0638),
		'~': huruf(0x0651), Q: huruf(0x064E), W: huruf(0x064B), E: huruf(0x064F), R: huruf(0x064C), T: huruf(0x0644, 0x0625),
		Y: huruf(0x0625), U: huruf(0x0670), I: huruf(0x00F7), O: huruf(0x00D7), P: huruf(0x061B),
		A: huruf(0x0650), S: huruf(0x064D), D: ']', F: '[', G: huruf(0x0644, 0x0623), H: huruf(0x0623), J: huruf(0x0640),
		K: huruf(0x060C), L: '/', Z: '~', X: huruf(0x0652), C: '}', V: '{', B: huruf(0x0644, 0x0622), N: huruf(0x0622),
		M: huruf(0x0671), '<': ',', '>': '.', '?': huruf(0x061F)
	};

	var HARAKAT = /[\u064B-\u065F\u0670\u06D6-\u06ED]/g;
	var ANGKA_ARAB = 0x0660;

	function angkaArab(teks) {
		return String(teks).replace(/[0-9]/g, function (c) {
			return huruf(ANGKA_ARAB + parseInt(c, 10));
		});
	}

	function escHtml(teks) {
		return String(teks).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	var FONT = 'AZ Arab';
	var KELAS_GAMBAR = 'az-arab-gambar';
	var KUNCI_SIMPAN = 'az-arab-ketik';

	var GAYA = '.az-ar-latar{position:fixed;inset:0;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.45);z-index:200000;display:flex;align-items:center;justify-content:center;padding:12px}' +
		'.az-ar-kotak{background:#fff;color:#1f2937;border-radius:10px;width:100%;max-width:780px;max-height:94vh;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,.25);font:14px/1.45 Arial,sans-serif}' +
		'.az-ar-kepala{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:bold;font-size:16px}' +
		'.az-ar-tutup{border:0;background:none;font-size:22px;line-height:1;cursor:pointer;color:#6b7280}' +
		'.az-ar-isi{padding:12px 16px;overflow:auto}' +
		'.az-ar-isi label.az-ar-judul{display:block;font-weight:bold;margin:8px 0 4px}' +
		'.az-ar-hasil{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:6px 10px;font-size:30px !important;line-height:2 !important;min-height:96px;direction:rtl;text-align:right;font-family:"AZ Arab","AZ Arab Pegon",serif !important}' +
		'.az-ar-petunjuk{color:#6b7280;font-size:12px;margin-top:4px}' +
		'.az-ar-baris{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px;margin-top:6px;font-size:13px}' +
		'.az-ar-baris input[type=number]{width:70px;padding:3px 6px;border:1px solid #d1d5db;border-radius:6px}' +
		'.az-ar-baris select{padding:3px 6px;border:1px solid #d1d5db;border-radius:6px}' +
		'.az-ar-kecil{padding:4px 10px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;cursor:pointer;font-size:13px}' +
		'.az-ar-kecil b{font-family:"AZ Arab","AZ Arab Pegon",serif;font-weight:normal;font-size:18px;line-height:1}' +
		'.az-ar-kecil:hover{background:#eef2ff;border-color:#818cf8}' +
		'.az-ar-tab{display:flex;flex-wrap:wrap;gap:4px;margin-top:10px;border-bottom:1px solid #e5e7eb}' +
		'.az-ar-tab button{border:1px solid transparent;border-bottom:0;background:none;padding:5px 10px;cursor:pointer;font-size:13px;color:#4b5563;border-radius:6px 6px 0 0}' +
		'.az-ar-tab button.aktif{border-color:#e5e7eb;background:#fff;color:#1d4ed8;font-weight:bold;margin-bottom:-1px}' +
		'.az-ar-papan{padding-top:8px;direction:rtl;text-align:right}' +
		'.az-ar-atas{position:sticky;top:-12px;z-index:3;margin:-12px 0 0;padding:12px 0 8px;background:#fff;border-bottom:1px dashed #d1d5db}' +
		'.az-ar-atas label.az-ar-judul{margin-top:0}' +
		'.az-ar-pin{display:flex;justify-content:space-between;gap:4px;margin-top:6px;direction:rtl}' +
		'@media (max-width:520px){' +
		'.az-ar-atas label.az-ar-judul{display:none}' +
		'.az-ar-atas .az-ar-hasil{font-size:24px !important;line-height:1.7 !important;min-height:0;height:72px}' +
		'.az-ar-atas .az-ar-baris{margin-top:4px}' +
		'}' +
		'.az-ar-pin .az-ar-tombol{flex:1 1 0;max-width:42px;min-width:0;aspect-ratio:1/1;margin:0;padding:0;border-radius:50%;justify-content:center;background:#fff7ed;border-color:#fdba74}' +
		'.az-ar-pin .az-ar-tombol span{font-size:22px;line-height:1;min-height:0}' +
		'.az-ar-pin .az-ar-tombol small{display:none}' +
		'.az-ar-tombol{display:inline-flex;flex-direction:column;align-items:center;min-width:46px;margin:0 0 4px 4px;padding:2px 4px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;cursor:pointer;vertical-align:top}' +
		'.az-ar-tombol:hover{background:#eef2ff;border-color:#818cf8}' +
		'.az-ar-tombol span{font-family:"AZ Arab","AZ Arab Pegon",serif;font-size:26px;line-height:1.7;min-height:44px}' +
		'.az-ar-tombol small{font-size:10px;color:#6b7280;line-height:1.2;direction:ltr;max-width:70px;text-align:center}' +
		'.az-ar-jenis label{display:block;font-weight:normal;margin:4px 0;cursor:pointer}.az-ar-jenis span{color:#6b7280;font-size:12px}' +
		'.az-ar-kaki{display:flex;justify-content:flex-end;gap:8px;padding:10px 16px;border-top:1px solid #e5e7eb}' +
		'.az-ar-kaki button{padding:7px 14px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;font-size:14px}' +
		'.az-ar-kaki .az-ar-utama{background:#2563eb;border-color:#2563eb;color:#fff}';

	function pasangGaya() {
		if (document.getElementById('az-arab-ketik-gaya')) {
			return;
		}
		var gaya = document.createElement('style');
		gaya.id = 'az-arab-ketik-gaya';
		gaya.textContent = GAYA;
		document.head.appendChild(gaya);
	}

	var TERAKHIR = bacaPilihan();

	function bacaPilihan() {
		var pilihan = { jenis: 'teks', ukuran: '28', keyboard: true, tab: 0, rataKanan: true };
		try {
			var simpanan = JSON.parse(window.localStorage.getItem(KUNCI_SIMPAN) || '{}');
			if (simpanan && (simpanan.jenis === 'gambar' || simpanan.jenis === 'teks')) {
				pilihan.jenis = simpanan.jenis;
			}
			if (simpanan && /^\d{2}$/.test(String(simpanan.ukuran || ''))) {
				pilihan.ukuran = String(simpanan.ukuran);
			}
			if (simpanan && typeof simpanan.keyboard === 'boolean') {
				pilihan.keyboard = simpanan.keyboard;
			}
			if (simpanan && typeof simpanan.rataKanan === 'boolean') {
				pilihan.rataKanan = simpanan.rataKanan;
			}
			if (simpanan && typeof simpanan.tab === 'number' && simpanan.tab >= 0 && simpanan.tab < PAPAN.length) {
				pilihan.tab = simpanan.tab;
			}
		} catch (galat) {
			return pilihan;
		}
		return pilihan;
	}

	function simpanPilihan() {
		try {
			window.localStorage.setItem(KUNCI_SIMPAN, JSON.stringify(TERAKHIR));
		} catch (galat) {
			return;
		}
	}

	function wadahDialog(elemen) {
		while (elemen && elemen.nodeType === 1) {
			if (typeof elemen.className === 'string' && (' ' + elemen.className + ' ').indexOf(' modal ') !== -1) {
				return elemen;
			}
			elemen = elemen.parentNode;
		}
		return document.body;
	}

	function fontSiap(gayaFont, teks) {
		if (document.fonts && document.fonts.load) {
			return document.fonts.load(gayaFont, teks).then(function () {
				return true;
			}, function () {
				return true;
			});
		}
		return {
			then: function (lanjut) {
				setTimeout(lanjut, 300);
			}
		};
	}

	function buatGambar(teks, ukuran, selesai) {
		var skala = 2;
		var px = ukuran * skala;
		var gayaFont = px + 'px "' + FONT + '", "AZ Arab Pegon", serif';
		fontSiap(gayaFont, teks).then(function () {
			var baris = teks.split('\n');
			var kanvas = document.createElement('canvas');
			var konteks = kanvas.getContext('2d');
			konteks.font = gayaFont;
			var lebar = 1;
			for (var i = 0; i < baris.length; i++) {
				lebar = Math.max(lebar, konteks.measureText(baris[i]).width);
			}
			var tinggiBaris = Math.ceil(px * 2);
			var jarak = Math.ceil(px * 0.2);
			kanvas.width = Math.ceil(lebar) + jarak * 2;
			kanvas.height = tinggiBaris * baris.length;
			kanvas.setAttribute('dir', 'rtl');
			konteks.font = gayaFont;
			konteks.direction = 'rtl';
			konteks.textAlign = 'right';
			konteks.fillStyle = '#000000';
			konteks.textBaseline = 'middle';
			for (var j = 0; j < baris.length; j++) {
				konteks.fillText(baris[j], kanvas.width - jarak, tinggiBaris * (j + 0.5));
			}
			selesai(kanvas.toDataURL('image/png'), Math.round(kanvas.width / skala), Math.round(kanvas.height / skala));
		});
	}

	function htmlTeks(teks, ukuran) {
		return '<span class="az-arab-teks" dir="rtl" style="font-family: \'' + FONT + '\', serif; font-size: ' + ukuran + 'px;">' +
			escHtml(teks).replace(/\n/g, '<br>') + '</span>&nbsp;';
	}

	function bungkusRata(html, rata) {
		if (!rata) {
			return html;
		}
		return '<p dir="rtl" style="text-align: right;">' + html.replace(/&nbsp;$/, '') + '</p>';
	}

	function htmlGambar(dataUri, lebar, tinggi, teks, ukuran) {
		return '<img class="' + KELAS_GAMBAR + '" src="' + dataUri + '" width="' + lebar + '" height="' + tinggi + '"' +
			' alt="' + escHtml(teks) + '" title="Klik dua kali untuk mengubah tulisan Arab"' +
			' data-aksara-skrip="arab" data-aksara-ukuran="' + escHtml(ukuran) + '" style="vertical-align: middle;">&nbsp;';
	}

	function htmlTombol(isi) {
		var html = '';
		for (var h = 0; h < isi.length; h++) {
			var item = isi[h];
			var tampil = item.tanda ? '\u0640' + item.nilai + '\u0640' : item.nilai;
			html += '<button type="button" class="az-ar-tombol" data-nilai="' + escHtml(item.nilai) + '" title="' + escHtml(item.label) + '" aria-label="' + escHtml(item.label) + '">' +
				'<span>' + escHtml(tampil) + '</span><small>' + escHtml(item.label) + '</small></button>';
		}
		return html;
	}

	function layarSentuh() {
		return !!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
	}

	function fokusTanpaGulir(kolom) {
		try {
			kolom.focus({ preventScroll: true });
		} catch (galat) {
			kolom.focus();
		}
	}

	function sisipDiKursor(kolom, nilai) {
		var awal = typeof kolom.selectionStart === 'number' ? kolom.selectionStart : kolom.value.length;
		var akhir = typeof kolom.selectionEnd === 'number' ? kolom.selectionEnd : awal;
		kolom.value = kolom.value.substring(0, awal) + nilai + kolom.value.substring(akhir);
		fokusTanpaGulir(kolom);
		kolom.selectionStart = kolom.selectionEnd = awal + nilai.length;
	}

	function bukaDialog(opsi) {
		pasangGaya();
		var latar = document.createElement('div');
		latar.className = 'az-ar-latar';
		var ukuran = '';
		var daftarUkuran = ['16', '20', '24', '28', '32', '36', '40', '48'];
		for (var u = 0; u < daftarUkuran.length; u++) {
			ukuran += '<option value="' + daftarUkuran[u] + '">' + daftarUkuran[u] + ' px</option>';
		}
		var tab = '';
		for (var t = 0; t < PAPAN.length; t++) {
			tab += '<button type="button" data-tab="' + t + '">' + escHtml(PAPAN[t].judul) + '</button>';
		}
		latar.innerHTML = '<div class="az-ar-kotak" role="dialog" aria-modal="true" aria-label="Tulis Arab">' +
			'<div class="az-ar-kepala"><span>Tulis Arab</span><button type="button" class="az-ar-tutup" title="Tutup">&times;</button></div>' +
			'<div class="az-ar-isi">' +
			'<div class="az-ar-atas">' +
			'<label class="az-ar-judul">Tulisan Arab</label>' +
			'<textarea class="az-ar-hasil" rows="2" dir="rtl" lang="ar" spellcheck="false"></textarea>' +
			'<div class="az-ar-baris">' +
			'<button type="button" class="az-ar-kecil az-ar-spasi">Spasi</button>' +
			'<button type="button" class="az-ar-kecil az-ar-mundur">&#9003; Hapus</button>' +
			'<button type="button" class="az-ar-kecil az-ar-gundul">Hapus harakat</button>' +
			'</div>' +
			'<div class="az-ar-pin" aria-label="Harakat umum"></div>' +
			'</div>' +
			'<div class="az-ar-baris">' +
			'<label><input type="checkbox" class="az-ar-keyboard"> Keyboard Arab</label>' +
			'<span>Nomor ayat <input type="number" min="1" max="286" class="az-ar-ayat"></span>' +
			'<button type="button" class="az-ar-kecil az-ar-sisip-ayat" data-model="bulat"><b dir="rtl">\u06DD\u0661</b> + nomor</button>' +
			'<button type="button" class="az-ar-kecil az-ar-sisip-ayat" data-model="kurung"><b dir="rtl">\uFD3F\u0661\uFD3E</b> kurung</button>' +
			'</div>' +
			'<div class="az-ar-petunjuk az-ar-petunjuk-keyboard">Keyboard Arab aktif: tombol keyboard biasa menghasilkan huruf Arab (tata letak Arab 101). ' +
			'Harakat dengan Shift: Q fathah, A kasrah, E dhammah, X sukun, ~ syaddah, W/S/R tanwin, U fathah berdiri. Huruf B = lam alif.</div>' +
			'<div class="az-ar-tab">' + tab + '</div>' +
			'<div class="az-ar-papan"></div>' +
			'<div class="az-ar-petunjuk">Klik huruf untuk menambah di posisi kursor. Harakat dan tanda waqaf ditulis setelah hurufnya.</div>' +
			'<label class="az-ar-judul">Simpan sebagai</label>' +
			'<div class="az-ar-jenis">' +
			'<label><input type="radio" name="az-ar-jenis" value="teks"> <b>Teks</b> (disarankan) <span>memakai font Arab bawaan CBT, tampil lengkap dengan harakat di semua perangkat siswa, bisa diedit &amp; dibaca AI analisis soal</span></label>' +
			'<label><input type="radio" name="az-ar-jenis" value="gambar"> <b>Gambar</b> <span>tampil sama persis di luar CBT (misal disalin ke Word); ubah dengan klik dua kali pada gambar</span></label>' +
			'</div>' +
			'<div class="az-ar-baris">Ukuran huruf <select class="az-ar-ukuran">' + ukuran + '</select>' +
			'<label><input type="checkbox" class="az-ar-rata"> Baris sendiri, rata kanan</label></div>' +
			'</div>' +
			'<div class="az-ar-kaki"><button type="button" class="az-ar-batal">Batal</button><button type="button" class="az-ar-utama">Sisipkan ke soal</button></div>' +
			'</div>';
		wadahDialog(opsi.dekat).appendChild(latar);
		var kolomHasil = latar.querySelector('.az-ar-hasil');
		var papan = latar.querySelector('.az-ar-papan');
		var pin = latar.querySelector('.az-ar-pin');
		var kotakTab = latar.querySelector('.az-ar-tab');
		var pilihUkuran = latar.querySelector('.az-ar-ukuran');
		var centangKeyboard = latar.querySelector('.az-ar-keyboard');
		var petunjukKeyboard = latar.querySelector('.az-ar-petunjuk-keyboard');
		var kolomAyat = latar.querySelector('.az-ar-ayat');
		var radioJenis = latar.querySelectorAll('input[name="az-ar-jenis"]');
		var tombolUtama = latar.querySelector('.az-ar-utama');
		var centangRata = latar.querySelector('.az-ar-rata');
		centangRata.checked = TERAKHIR.rataKanan;
		if (opsi.ganti) {
			centangRata.parentNode.style.display = 'none';
		}
		var sentuh = layarSentuh();
		if (sentuh) {
			centangKeyboard.parentNode.lastChild.nodeValue = ' Papan huruf (sembunyikan keyboard HP)';
			petunjukKeyboard.textContent = 'Papan huruf aktif: keyboard HP disembunyikan, ketik dengan papan huruf di bawah. ' +
				'Hilangkan centang untuk memakai keyboard HP (misalnya keyboard Arab di Gboard).';
		}
		pilihUkuran.value = opsi.ukuran || TERAKHIR.ukuran;
		centangKeyboard.checked = TERAKHIR.keyboard;
		kolomHasil.value = opsi.hasil || '';

		function jenisTerpilih() {
			for (var r = 0; r < radioJenis.length; r++) {
				if (radioJenis[r].checked) {
					return radioJenis[r].value;
				}
			}
			return 'teks';
		}

		function aturJenis(jenis) {
			for (var r = 0; r < radioJenis.length; r++) {
				radioJenis[r].checked = radioJenis[r].value === jenis;
			}
		}

		function aturKeyboard() {
			petunjukKeyboard.style.display = centangKeyboard.checked ? '' : 'none';
			if (!sentuh) {
				return;
			}
			var mode = centangKeyboard.checked ? 'none' : 'text';
			if (kolomHasil.getAttribute('inputmode') === mode) {
				return;
			}
			kolomHasil.setAttribute('inputmode', mode);
			if (document.activeElement === kolomHasil) {
				kolomHasil.blur();
				fokusTanpaGulir(kolomHasil);
			}
		}

		function tampilkanPapan(nomor) {
			var tombolTab = kotakTab.querySelectorAll('button');
			for (var b = 0; b < tombolTab.length; b++) {
				tombolTab[b].className = String(b) === String(nomor) ? 'aktif' : '';
			}
			papan.innerHTML = htmlTombol(PAPAN[nomor].isi);
			TERAKHIR.tab = nomor;
		}

		function tekanTombol(e, wadah) {
			var tombol = e.target;
			while (tombol && tombol !== wadah && !tombol.getAttribute('data-nilai')) {
				tombol = tombol.parentNode;
			}
			if (!tombol || tombol === wadah) {
				return;
			}
			sisipDiKursor(kolomHasil, tombol.getAttribute('data-nilai'));
		}

		function tutup() {
			if (latar.parentNode) {
				latar.parentNode.removeChild(latar);
			}
			document.removeEventListener('keydown', tombolEsc, true);
		}

		function tombolEsc(e) {
			if (e.keyCode === 27) {
				e.stopPropagation();
				tutup();
			}
		}

		kolomHasil.addEventListener('keydown', function (e) {
			if (!centangKeyboard.checked || e.ctrlKey || e.metaKey || e.altKey || !e.key || e.key.length !== 1) {
				return;
			}
			if (KEYBOARD.hasOwnProperty(e.key)) {
				e.preventDefault();
				sisipDiKursor(kolomHasil, KEYBOARD[e.key]);
			}
		});
		papan.addEventListener('click', function (e) {
			tekanTombol(e, papan);
		});
		pin.innerHTML = htmlTombol(HARAKAT_UMUM);
		pin.addEventListener('click', function (e) {
			tekanTombol(e, pin);
		});
		kotakTab.addEventListener('click', function (e) {
			var nomor = e.target.getAttribute('data-tab');
			if (nomor !== null) {
				tampilkanPapan(parseInt(nomor, 10));
			}
		});
		latar.querySelector('.az-ar-spasi').addEventListener('click', function () {
			sisipDiKursor(kolomHasil, ' ');
		});
		latar.querySelector('.az-ar-mundur').addEventListener('click', function () {
			var awal = kolomHasil.selectionStart;
			var akhir = kolomHasil.selectionEnd;
			if (typeof awal !== 'number') {
				awal = akhir = kolomHasil.value.length;
			}
			if (awal === akhir && awal > 0) {
				awal--;
			}
			kolomHasil.value = kolomHasil.value.substring(0, awal) + kolomHasil.value.substring(akhir);
			fokusTanpaGulir(kolomHasil);
			kolomHasil.selectionStart = kolomHasil.selectionEnd = awal;
		});
		latar.querySelector('.az-ar-gundul').addEventListener('click', function () {
			kolomHasil.value = kolomHasil.value.replace(HARAKAT, '');
			fokusTanpaGulir(kolomHasil);
		});
		var tombolAyat = latar.querySelectorAll('.az-ar-sisip-ayat');
		for (var a = 0; a < tombolAyat.length; a++) {
			tombolAyat[a].addEventListener('click', function () {
				var nomor = parseInt(kolomAyat.value, 10);
				if (!nomor || nomor < 1) {
					kolomAyat.focus();
					return;
				}
				var angka = angkaArab(nomor);
				var nilai = this.getAttribute('data-model') === 'kurung' ? huruf(0xFD3F) + angka + huruf(0xFD3E) : huruf(0x06DD) + angka;
				sisipDiKursor(kolomHasil, ' ' + nilai + ' ');
			});
		}
		centangKeyboard.addEventListener('change', function () {
			aturKeyboard();
			fokusTanpaGulir(kolomHasil);
		});
		latar.querySelector('.az-ar-tutup').addEventListener('click', tutup);
		latar.querySelector('.az-ar-batal').addEventListener('click', tutup);
		latar.addEventListener('mousedown', function (e) {
			if (e.target === latar) {
				tutup();
			}
		});
		tombolUtama.addEventListener('click', function () {
			var teks = kolomHasil.value.replace(/^\s+|\s+$/g, '');
			var jenis = jenisTerpilih();
			var besar = parseInt(pilihUkuran.value, 10) || 28;
			TERAKHIR.jenis = jenis;
			TERAKHIR.ukuran = pilihUkuran.value;
			TERAKHIR.rataKanan = centangRata.checked;
			TERAKHIR.keyboard = centangKeyboard.checked;
			simpanPilihan();
			if (teks === '') {
				tutup();
				return;
			}
			if (jenis !== 'gambar') {
				opsi.sisipkan(bungkusRata(htmlTeks(teks, besar), centangRata.checked && !opsi.ganti), 'teks');
				tutup();
				return;
			}
			tombolUtama.disabled = true;
			tombolUtama.textContent = 'Membuat gambar...';
			buatGambar(teks, besar, function (dataUri, lebar, tinggi) {
				opsi.sisipkan(bungkusRata(htmlGambar(dataUri, lebar, tinggi, teks, pilihUkuran.value), centangRata.checked && !opsi.ganti), 'gambar');
				tutup();
			});
		});
		document.addEventListener('keydown', tombolEsc, true);
		aturJenis(opsi.jenis || TERAKHIR.jenis);
		aturKeyboard();
		tampilkanPapan(TERAKHIR.tab);
		fokusTanpaGulir(kolomHasil);
		kolomHasil.selectionStart = kolomHasil.selectionEnd = kolomHasil.value.length;
	}

	function bukaDariEditor(editor, gambarLama) {
		var opsi = {
			dekat: editor.getContainer(),
			sisipkan: function (html, jenis) {
				editor.focus();
				if (gambarLama && gambarLama.parentNode) {
					editor.undoManager.transact(function () {
						var pengganti = editor.dom.createFragment(html.replace(/&nbsp;$/, ''));
						gambarLama.parentNode.replaceChild(pengganti, gambarLama);
					});
					editor.nodeChanged();
					editor.fire('change');
				} else {
					editor.insertContent(html);
				}
				if (jenis === 'gambar') {
					editor.fire('azGambarBaru');
				}
			}
		};
		if (gambarLama) {
			opsi.ganti = true;
			opsi.hasil = gambarLama.getAttribute('alt') || '';
			opsi.ukuran = gambarLama.getAttribute('data-aksara-ukuran') || '';
			opsi.jenis = 'gambar';
		} else {
			var terpilih = editor.selection ? editor.selection.getContent({ format: 'text' }) : '';
			opsi.hasil = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(terpilih) ? terpilih : '';
		}
		bukaDialog(opsi);
	}

	function gambarArab(elemen) {
		return elemen && elemen.nodeName === 'IMG' && (' ' + (elemen.className || '') + ' ').indexOf(' ' + KELAS_GAMBAR + ' ') !== -1;
	}

	window.azArabKetik = { buka: bukaDialog, buatGambar: buatGambar, keyboard: KEYBOARD };

	if (window.tinymce && window.tinymce.PluginManager) {
		window.tinymce.PluginManager.add('azarab', function (editor) {
			editor.addButton('azarab', {
				text: 'Arab',
				tooltip: 'Tulis huruf Arab (keyboard Arab, harakat, tanda waqaf, nomor ayat)',
				onclick: function () {
					var terpilih = editor.selection ? editor.selection.getNode() : null;
					bukaDariEditor(editor, gambarArab(terpilih) ? terpilih : null);
				}
			});
			editor.on('dblclick', function (e) {
				if (gambarArab(e.target)) {
					e.preventDefault();
					bukaDariEditor(editor, e.target);
				}
			});
		});
	}
})();
