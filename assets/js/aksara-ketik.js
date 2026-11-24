/*
 * Tulis aksara daerah di editor soal (plugin TinyMCE "azaksara" + jendela "Tulis Aksara").
 * Guru mengetik huruf Latin, hasilnya langsung tampil dalam aksara (transliterasi per suku kata) dan bisa
 * dikoreksi lewat papan huruf. Hasil disisipkan dalam <span> berfont aksara (assets/css/aksara.css).
 * Ejaan Latin: e = pepet (seperti "sega"), e dengan aksen (\u00e9 / \u00e8) = taling (seperti "sate"), eu = Sunda "eu".
 * Skrip memakai JavaScript lama (ES5) dan hanya karakter ASCII.
 */
(function () {
	'use strict';

	function huruf(kode) {
		if (kode <= 0xFFFF) {
			return String.fromCharCode(kode);
		}
		var sisa = kode - 0x10000;
		return String.fromCharCode(0xD800 + (sisa >> 10), 0xDC00 + (sisa & 0x3FF));
	}

	function peta(daftar) {
		var hasil = {};
		for (var kunci in daftar) {
			if (daftar.hasOwnProperty(kunci)) {
				hasil[kunci] = typeof daftar[kunci] === 'number' ? huruf(daftar[kunci]) : daftar[kunci];
			}
		}
		return hasil;
	}

	function angka(awal) {
		var hasil = {};
		for (var i = 0; i < 10; i++) {
			hasil[String(i)] = huruf(awal + i);
		}
		return hasil;
	}

	var TELU = huruf(0xA9B3);

	var SKRIP = {
		jawa: {
			nama: 'Aksara Jawa',
			font: 'AZ Aksara Jawa',
			konsonan: peta({
				h: 0xA9B2, n: 0xA9A4, c: 0xA995, r: 0xA9AB, k: 0xA98F, d: 0xA9A2, t: 0xA9A0, s: 0xA9B1, w: 0xA9AE, l: 0xA9AD,
				p: 0xA9A5, dh: 0xA99D, j: 0xA997, y: 0xA9AA, ny: 0xA99A, m: 0xA9A9, g: 0xA992, b: 0xA9A7, th: 0xA99B, ng: 0xA994,
				q: 0xA98F, f: huruf(0xA9A5) + TELU, v: huruf(0xA9AE) + TELU, z: huruf(0xA997) + TELU, kh: huruf(0xA98F) + TELU,
				gh: huruf(0xA992) + TELU, sy: huruf(0xA9B1) + TELU
			}),
			vokal: peta({ a: '', i: 0xA9B6, u: 0xA9B8, e: 0xA9BC, '\u00e9': 0xA9BA, o: huruf(0xA9BA) + huruf(0xA9B4) }),
			sisipan: peta({ r: 0xA9BF, y: 0xA9BE }),
			keret: huruf(0xA9BD),
			khusus: peta({ 're': 0xA989, 'le': 0xA98A }),
			akhir: peta({ ng: 0xA981, r: 0xA982, h: 0xA983 }),
			pangkon: huruf(0xA9C0),
			awalVokal: 'h',
			angka: angka(0xA9D0),
			tandaBaca: peta({ ',': 0xA9C8, '.': 0xA9C9 })
		},
		sunda: {
			nama: 'Aksara Sunda',
			font: 'AZ Aksara Sunda',
			konsonan: peta({
				k: 0x1B8A, q: 0x1B8B, g: 0x1B8C, ng: 0x1B8D, c: 0x1B8E, j: 0x1B8F, z: 0x1B90, ny: 0x1B91, t: 0x1B92, d: 0x1B93,
				n: 0x1B94, p: 0x1B95, f: 0x1B96, v: 0x1B97, b: 0x1B98, m: 0x1B99, y: 0x1B9A, r: 0x1B9B, l: 0x1B9C, w: 0x1B9D,
				s: 0x1B9E, x: 0x1B9F, h: 0x1BA0, kh: 0x1BAE, sy: 0x1BAF
			}),
			vokal: peta({ a: '', i: 0x1BA4, u: 0x1BA5, '\u00e9': 0x1BA6, o: 0x1BA7, e: 0x1BA8, eu: 0x1BA9 }),
			vokalMandiri: peta({ a: 0x1B83, i: 0x1B84, u: 0x1B85, '\u00e9': 0x1B86, o: 0x1B87, e: 0x1B88, eu: 0x1B89 }),
			sisipan: peta({ y: 0x1BA1, r: 0x1BA2, l: 0x1BA3 }),
			akhir: peta({ ng: 0x1B80, r: 0x1B81, h: 0x1B82 }),
			pangkon: huruf(0x1BAA),
			awalVokal: 'mandiri',
			angka: angka(0x1BB0),
			tandaBaca: {}
		},
		bali: {
			nama: 'Aksara Bali',
			font: 'AZ Aksara Bali',
			konsonan: peta({
				h: 0x1B33, n: 0x1B26, c: 0x1B18, r: 0x1B2D, k: 0x1B13, d: 0x1B24, t: 0x1B22, s: 0x1B32, w: 0x1B2F, l: 0x1B2E,
				m: 0x1B2B, g: 0x1B15, b: 0x1B29, ng: 0x1B17, p: 0x1B27, j: 0x1B1A, y: 0x1B2C, ny: 0x1B1C,
				q: 0x1B13, f: 0x1B27, v: 0x1B2F, z: 0x1B1A
			}),
			vokal: peta({ a: '', i: 0x1B36, u: 0x1B38, '\u00e9': 0x1B3E, o: 0x1B40, e: 0x1B42 }),
			sisipan: {},
			khusus: peta({ 're': 0x1B0B, 'le': 0x1B0D }),
			akhir: peta({ ng: 0x1B02, r: 0x1B03, h: 0x1B04 }),
			pangkon: huruf(0x1B44),
			awalVokal: 'h',
			angka: angka(0x1B50),
			tandaBaca: peta({ ',': 0x1B5E, '.': 0x1B5F })
		},
		batak: {
			nama: 'Aksara Batak (Toba)',
			font: 'AZ Aksara Batak',
			konsonan: peta({
				h: 0x1BC2, k: 0x1BC2, b: 0x1BC5, p: 0x1BC7, n: 0x1BC9, w: 0x1BCB, g: 0x1BCE, j: 0x1BD0, d: 0x1BD1, r: 0x1BD2,
				m: 0x1BD4, t: 0x1BD6, s: 0x1BD8, y: 0x1BDB, ng: 0x1BDD, l: 0x1BDE, ny: 0x1BE0, c: 0x1BE1,
				q: 0x1BC2, f: 0x1BC7, v: 0x1BCB, z: 0x1BD0
			}),
			vokal: peta({ a: '', i: 0x1BEA, u: 0x1BEE, e: 0x1BE7, '\u00e9': 0x1BE7, o: 0x1BEC }),
			vokalMandiri: peta({ a: 0x1BC0, i: 0x1BE4, u: 0x1BE5 }),
			sisipan: {},
			akhir: peta({ ng: 0x1BF0, h: 0x1BF1 }),
			pangkon: huruf(0x1BF2),
			awalVokal: 'mandiri',
			angka: {},
			tandaBaca: {}
		},
		lontara: {
			nama: 'Aksara Lontara (Bugis)',
			font: 'AZ Aksara Lontara',
			konsonan: peta({
				k: 0x1A00, g: 0x1A01, ng: 0x1A02, p: 0x1A04, b: 0x1A05, m: 0x1A06, t: 0x1A08, d: 0x1A09, n: 0x1A0A, c: 0x1A0C,
				j: 0x1A0D, ny: 0x1A0E, y: 0x1A10, r: 0x1A11, l: 0x1A12, w: 0x1A13, s: 0x1A14, h: 0x1A16,
				q: 0x1A00, f: 0x1A04, v: 0x1A13, z: 0x1A0D
			}),
			vokal: peta({ a: '', i: 0x1A17, u: 0x1A18, e: 0x1A19, '\u00e9': 0x1A19, o: 0x1A1A }),
			vokalMandiri: peta({ a: 0x1A15 }),
			sisipan: {},
			akhir: {},
			pangkon: '',
			awalVokal: 'a',
			angka: {},
			tandaBaca: peta({ '.': 0x1A1E })
		},
		makassar: {
			nama: 'Aksara Makassar',
			font: 'AZ Aksara Makassar',
			konsonan: peta({
				k: 0x11EE0, g: 0x11EE1, ng: 0x11EE2, p: 0x11EE3, b: 0x11EE4, m: 0x11EE5, t: 0x11EE6, d: 0x11EE7, n: 0x11EE8,
				c: 0x11EE9, j: 0x11EEA, ny: 0x11EEB, y: 0x11EEC, r: 0x11EED, l: 0x11EEE, w: 0x11EEF, s: 0x11EF0,
				q: 0x11EE0, f: 0x11EE3, v: 0x11EEF, z: 0x11EEA
			}),
			vokal: peta({ a: '', i: 0x11EF3, u: 0x11EF4, e: 0x11EF5, '\u00e9': 0x11EF5, o: 0x11EF6 }),
			vokalMandiri: peta({ a: 0x11EF1 }),
			sisipan: {},
			akhir: {},
			pangkon: '',
			awalVokal: 'a',
			angka: {},
			tandaBaca: peta({ '.': 0x11EF7 })
		},
		rejang: {
			nama: 'Aksara Rejang',
			font: 'AZ Aksara Rejang',
			konsonan: peta({
				k: 0xA930, g: 0xA931, ng: 0xA932, t: 0xA933, d: 0xA934, n: 0xA935, p: 0xA936, b: 0xA937, m: 0xA938, c: 0xA939,
				j: 0xA93A, ny: 0xA93B, s: 0xA93C, r: 0xA93D, l: 0xA93E, y: 0xA93F, w: 0xA940, h: 0xA941,
				q: 0xA930, f: 0xA936, v: 0xA940, z: 0xA93A
			}),
			vokal: peta({ a: '', i: 0xA947, u: 0xA948, '\u00e9': 0xA949, e: 0xA94D, eu: 0xA94D, o: 0xA94B }),
			vokalMandiri: peta({ a: 0xA946 }),
			sisipan: {},
			akhir: peta({ ng: 0xA94F, n: 0xA950, r: 0xA951, h: 0xA952 }),
			pangkon: huruf(0xA953),
			awalVokal: 'a',
			angka: {},
			tandaBaca: {}
		}
	};

	var URUTAN_SKRIP = ['jawa', 'sunda', 'bali', 'lontara', 'makassar', 'batak', 'rejang'];
	var DIGRAF = ['ng', 'ny', 'dh', 'th', 'kh', 'gh', 'sy'];

	function rapikanLatin(teks) {
		return String(teks).toLowerCase()
			.replace(/[\u00e8\u00e9]/g, '\u00e9')
			.replace(/\u00ea/g, 'e')
			.replace(/x/g, 'ks');
	}

	function pecahToken(kata, skrip) {
		var token = [];
		var i = 0;
		while (i < kata.length) {
			var dua = kata.substr(i, 2);
			if (dua === 'eu' && skrip.vokal.eu !== undefined) {
				token.push({ jenis: 'V', nilai: 'eu' });
				i += 2;
				continue;
			}
			var satu = kata.charAt(i);
			if ('aiuoe\u00e9'.indexOf(satu) !== -1) {
				token.push({ jenis: 'V', nilai: satu === '\u00e9' ? '\u00e9' : satu });
				i++;
				continue;
			}
			if (DIGRAF.indexOf(dua) !== -1 && skrip.konsonan[dua] !== undefined) {
				token.push({ jenis: 'K', nilai: dua });
				i += 2;
				continue;
			}
			if (skrip.konsonan[satu] !== undefined) {
				token.push({ jenis: 'K', nilai: satu });
			} else if (DIGRAF.indexOf(dua) !== -1) {
				token.push({ jenis: 'K', nilai: dua.charAt(0) });
				token.push({ jenis: 'K', nilai: dua.charAt(1) });
				i += 2;
				continue;
			}
			i++;
		}
		return token;
	}

	function tandaVokal(skrip, vokal) {
		if (skrip.vokal[vokal] !== undefined) {
			return skrip.vokal[vokal];
		}
		if (vokal === 'eu' || vokal === '\u00e9') {
			return skrip.vokal.e || '';
		}
		return '';
	}

	function sukuKata(skrip, awal, sisipan, vokal) {
		var kunciKhusus = awal + (vokal === 'e' ? 'e' : '');
		if (!sisipan && vokal === 'e' && skrip.khusus && skrip.khusus[kunciKhusus] !== undefined && kunciKhusus.length === 2) {
			return skrip.khusus[kunciKhusus];
		}
		var hasil = skrip.konsonan[awal] || '';
		if (sisipan) {
			if (sisipan === 'r' && vokal === 'e' && skrip.keret) {
				return hasil + skrip.keret;
			}
			hasil += skrip.sisipan[sisipan];
		}
		return hasil + tandaVokal(skrip, vokal);
	}

	function vokalAwal(skrip, vokal) {
		if (skrip.awalVokal === 'h') {
			return sukuKata(skrip, 'h', '', vokal);
		}
		if (skrip.vokalMandiri && skrip.vokalMandiri[vokal] !== undefined) {
			return skrip.vokalMandiri[vokal];
		}
		var dasar = skrip.vokalMandiri && skrip.vokalMandiri.a ? skrip.vokalMandiri.a : '';
		return dasar + (vokal === 'a' ? '' : tandaVokal(skrip, vokal));
	}

	function konsonanMati(skrip, konsonan) {
		if (skrip.akhir[konsonan] !== undefined) {
			return skrip.akhir[konsonan];
		}
		if (!skrip.pangkon) {
			return '';
		}
		return (skrip.konsonan[konsonan] || '') + skrip.pangkon;
	}

	function alihKata(kata, skrip) {
		var token = pecahToken(kata, skrip);
		var hasil = '';
		var i = 0;
		while (i < token.length) {
			if (token[i].jenis === 'V') {
				hasil += vokalAwal(skrip, token[i].nilai);
				i++;
				continue;
			}
			var deret = [];
			while (i < token.length && token[i].jenis === 'K') {
				deret.push(token[i].nilai);
				i++;
			}
			if (i >= token.length) {
				for (var m = 0; m < deret.length; m++) {
					hasil += konsonanMati(skrip, deret[m]);
				}
				break;
			}
			var vokal = token[i].nilai;
			i++;
			var akhirDeret = deret.length - 1;
			var sisipan = '';
			if (deret.length >= 2 && skrip.sisipan[deret[akhirDeret]] !== undefined) {
				sisipan = deret[akhirDeret];
				akhirDeret--;
			}
			for (var n = 0; n < akhirDeret; n++) {
				hasil += konsonanMati(skrip, deret[n]);
			}
			hasil += sukuKata(skrip, deret[akhirDeret], sisipan, vokal);
		}
		return hasil;
	}

	function alih(teks, kunciSkrip) {
		var skrip = SKRIP[kunciSkrip];
		if (!skrip) {
			return '';
		}
		var bagian = rapikanLatin(teks).split(/([a-z\u00e9]+)/);
		var hasil = '';
		for (var i = 0; i < bagian.length; i++) {
			if (i % 2 === 1) {
				hasil += alihKata(bagian[i], skrip);
				continue;
			}
			var lain = bagian[i];
			for (var j = 0; j < lain.length; j++) {
				var c = lain.charAt(j);
				if (skrip.angka[c] !== undefined) {
					hasil += skrip.angka[c];
				} else if (skrip.tandaBaca[c] !== undefined) {
					hasil += skrip.tandaBaca[c];
				} else {
					hasil += c;
				}
			}
		}
		return hasil;
	}

	function papanHuruf(kunciSkrip) {
		var skrip = SKRIP[kunciSkrip];
		var grup = [];
		var dilihat = {};
		function kumpulkan(judul, daftar, tanda) {
			var isi = [];
			for (var kunci in daftar) {
				if (daftar.hasOwnProperty(kunci) && daftar[kunci] && !dilihat[daftar[kunci]]) {
					dilihat[daftar[kunci]] = true;
					isi.push({ label: kunci, nilai: daftar[kunci], tanda: !!tanda });
				}
			}
			if (isi.length) {
				grup.push({ judul: judul, isi: isi });
			}
		}
		kumpulkan('Huruf', skrip.konsonan, false);
		kumpulkan('Huruf vokal', skrip.vokalMandiri || {}, false);
		kumpulkan('Sandhangan vokal', skrip.vokal, true);
		kumpulkan('Sisipan', skrip.sisipan, true);
		kumpulkan('Konsonan akhir', skrip.akhir, true);
		if (skrip.pangkon) {
			kumpulkan('Pemati huruf', { mati: skrip.pangkon }, true);
		}
		kumpulkan('Angka', skrip.angka, false);
		kumpulkan('Tanda baca', skrip.tandaBaca, false);
		return grup;
	}

	function escHtml(teks) {
		return String(teks).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
	}

	var GAYA = '.az-ak-latar{position:fixed;inset:0;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,.45);z-index:200000;display:flex;align-items:center;justify-content:center;padding:12px}' +
		'.az-ak-kotak{background:#fff;color:#1f2937;border-radius:10px;width:100%;max-width:720px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 50px rgba(0,0,0,.25);font:14px/1.45 Arial,sans-serif}' +
		'.az-ak-kepala{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-bottom:1px solid #e5e7eb;font-weight:bold;font-size:16px}' +
		'.az-ak-tutup{border:0;background:none;font-size:22px;line-height:1;cursor:pointer;color:#6b7280}' +
		'.az-ak-isi{padding:12px 16px;overflow:auto}' +
		'.az-ak-isi label{display:block;font-weight:bold;margin:8px 0 4px}' +
		'.az-ak-isi select,.az-ak-isi textarea{width:100%;box-sizing:border-box;border:1px solid #d1d5db;border-radius:6px;padding:6px 8px;font-size:15px}' +
		'.az-ak-hasil{font-size:26px !important;line-height:1.8 !important;min-height:70px}' +
		'.az-ak-petunjuk{color:#6b7280;font-size:12px;margin-top:4px}' +
		'.az-ak-grup{margin-top:8px}.az-ak-grup b{display:block;font-size:12px;color:#374151;margin-bottom:3px}' +
		'.az-ak-tombol{display:inline-flex;flex-direction:column;align-items:center;min-width:42px;margin:0 4px 4px 0;padding:3px 4px;border:1px solid #d1d5db;border-radius:6px;background:#f9fafb;cursor:pointer}' +
		'.az-ak-tombol:hover{background:#eef2ff;border-color:#818cf8}' +
		'.az-ak-tombol span{font-size:22px;line-height:1.9;min-height:42px}.az-ak-tombol small{font-size:10px;color:#6b7280;line-height:1.2}' +
		'.az-ak-jenis label{display:block;font-weight:normal;margin:4px 0;cursor:pointer}.az-ak-jenis span{color:#6b7280;font-size:12px}.az-ak-ukuran{margin:6px 0 0 22px;font-size:13px}.az-ak-ukuran select{width:auto;display:inline-block;margin-left:6px;padding:3px 6px}' +
		'.az-ak-kaki{display:flex;justify-content:flex-end;gap:8px;padding:10px 16px;border-top:1px solid #e5e7eb}' +
		'.az-ak-kaki button{padding:7px 14px;border-radius:6px;border:1px solid #d1d5db;background:#fff;cursor:pointer;font-size:14px}' +
		'.az-ak-kaki .az-ak-utama{background:#2563eb;border-color:#2563eb;color:#fff}';

	function pasangGaya() {
		if (document.getElementById('az-aksara-ketik-gaya')) {
			return;
		}
		var gaya = document.createElement('style');
		gaya.id = 'az-aksara-ketik-gaya';
		gaya.textContent = GAYA;
		document.head.appendChild(gaya);
	}

	var KUNCI_SIMPAN = 'az-aksara-ketik';
	var TERAKHIR = bacaPilihan();
	var KELAS_GAMBAR = 'az-aksara-gambar';

	function bacaPilihan() {
		var pilihan = { skrip: 'lontara', jenis: 'gambar', ukuran: '20' };
		try {
			var simpanan = JSON.parse(window.localStorage.getItem(KUNCI_SIMPAN) || '{}');
			if (simpanan && SKRIP[simpanan.skrip]) {
				pilihan.skrip = simpanan.skrip;
			}
			if (simpanan && (simpanan.jenis === 'gambar' || simpanan.jenis === 'teks')) {
				pilihan.jenis = simpanan.jenis;
			}
			if (simpanan && /^\d{2}$/.test(String(simpanan.ukuran || ''))) {
				pilihan.ukuran = String(simpanan.ukuran);
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

	function buatGambar(teks, font, ukuran, selesai) {
		var skala = 2;
		var px = ukuran * skala;
		var gayaFont = px + 'px "' + font + '", sans-serif';
		fontSiap(gayaFont, teks).then(function () {
			var baris = teks.split('\n');
			var kanvas = document.createElement('canvas');
			var konteks = kanvas.getContext('2d');
			konteks.font = gayaFont;
			var lebar = 1;
			for (var i = 0; i < baris.length; i++) {
				lebar = Math.max(lebar, konteks.measureText(baris[i]).width);
			}
			var tinggiBaris = Math.ceil(px * 1.7);
			var jarak = Math.ceil(px * 0.15);
			kanvas.width = Math.ceil(lebar) + jarak * 2;
			kanvas.height = tinggiBaris * baris.length;
			konteks.font = gayaFont;
			konteks.fillStyle = '#000000';
			konteks.textBaseline = 'middle';
			for (var j = 0; j < baris.length; j++) {
				konteks.fillText(baris[j], jarak, tinggiBaris * (j + 0.5));
			}
			selesai(kanvas.toDataURL('image/png'), Math.round(kanvas.width / skala), Math.round(kanvas.height / skala));
		});
	}

	function htmlTeks(teks, skrip) {
		return '<span style="font-family: \'' + skrip.font + '\', sans-serif;">' + escHtml(teks).replace(/\n/g, '<br>') + '</span>&nbsp;';
	}

	function htmlGambar(dataUri, lebar, tinggi, teks, latin, kunciSkrip, ukuran) {
		return '<img class="' + KELAS_GAMBAR + '" src="' + dataUri + '" width="' + lebar + '" height="' + tinggi + '"' +
			' alt="' + escHtml(teks) + '" title="Klik dua kali untuk mengubah aksara"' +
			' data-aksara-skrip="' + escHtml(kunciSkrip) + '" data-aksara-latin="' + escHtml(latin) + '"' +
			' data-aksara-ukuran="' + escHtml(ukuran) + '" style="vertical-align: middle;">&nbsp;';
	}

	function bukaDialog(opsi) {
		pasangGaya();
		var latar = document.createElement('div');
		latar.className = 'az-ak-latar';
		var pilihan = '';
		for (var i = 0; i < URUTAN_SKRIP.length; i++) {
			pilihan += '<option value="' + URUTAN_SKRIP[i] + '">' + escHtml(SKRIP[URUTAN_SKRIP[i]].nama) + '</option>';
		}
		var ukuran = '';
		var daftarUkuran = ['14', '16', '20', '24', '28', '32', '40'];
		for (var u = 0; u < daftarUkuran.length; u++) {
			ukuran += '<option value="' + daftarUkuran[u] + '">' + daftarUkuran[u] + ' px</option>';
		}
		latar.innerHTML = '<div class="az-ak-kotak" role="dialog" aria-modal="true" aria-label="Tulis Aksara">' +
			'<div class="az-ak-kepala"><span>Tulis Aksara</span><button type="button" class="az-ak-tutup" title="Tutup">&times;</button></div>' +
			'<div class="az-ak-isi">' +
			'<label>Aksara</label><select class="az-ak-skrip">' + pilihan + '</select>' +
			'<label>Ketik huruf Latin</label><textarea class="az-ak-latin" rows="2" placeholder="contoh: hanacaraka"></textarea>' +
			'<div class="az-ak-petunjuk">e = pepet (sega), \u00e9 / \u00e8 = taling (sate), eu = Sunda. Konsonan mati otomatis memakai pangkon / pasangan.</div>' +
			'<label>Hasil (bisa dikoreksi)</label><textarea class="az-ak-hasil" rows="2"></textarea>' +
			'<div class="az-ak-petunjuk">Klik huruf di bawah untuk menambah / mengoreksi hasil di posisi kursor.</div>' +
			'<div class="az-ak-papan"></div>' +
			'<label>Simpan sebagai</label>' +
			'<div class="az-ak-jenis">' +
			'<label><input type="radio" name="az-ak-jenis" value="gambar"> <b>Gambar</b> (disarankan) <span>tampil sama di semua perangkat &amp; aplikasi lain walau font aksara belum terpasang; ubah dengan klik dua kali pada gambar</span></label>' +
			'<label><input type="radio" name="az-ak-jenis" value="teks"> <b>Teks</b> <span>memakai font aksara bawaan aplikasi, bisa diedit langsung &amp; dibaca AI analisis soal; perlu font aksara bila soal dibuka di luar CBT</span></label>' +
			'<div class="az-ak-ukuran">Ukuran huruf gambar <select class="az-ak-ukuran-pilih">' + ukuran + '</select></div>' +
			'</div>' +
			'</div>' +
			'<div class="az-ak-kaki"><button type="button" class="az-ak-batal">Batal</button><button type="button" class="az-ak-utama">Sisipkan ke soal</button></div>' +
			'</div>';
		wadahDialog(opsi.dekat).appendChild(latar);
		var pilihSkrip = latar.querySelector('.az-ak-skrip');
		var kolomLatin = latar.querySelector('.az-ak-latin');
		var kolomHasil = latar.querySelector('.az-ak-hasil');
		var papan = latar.querySelector('.az-ak-papan');
		var pilihUkuran = latar.querySelector('.az-ak-ukuran-pilih');
		var kotakUkuran = latar.querySelector('.az-ak-ukuran');
		var radioJenis = latar.querySelectorAll('input[name="az-ak-jenis"]');
		var tombolUtama = latar.querySelector('.az-ak-utama');
		pilihSkrip.value = SKRIP[opsi.skrip] ? opsi.skrip : TERAKHIR.skrip;
		pilihUkuran.value = opsi.ukuran || TERAKHIR.ukuran;
		kolomLatin.value = opsi.latin || '';

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
			kotakUkuran.style.display = jenis === 'gambar' ? '' : 'none';
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

		function terjemahkan() {
			kolomHasil.value = alih(kolomLatin.value, pilihSkrip.value);
		}

		function gambarPapan() {
			var skrip = SKRIP[pilihSkrip.value];
			kolomHasil.style.fontFamily = '"' + skrip.font + '", sans-serif';
			var html = '';
			var grup = papanHuruf(pilihSkrip.value);
			for (var g = 0; g < grup.length; g++) {
				html += '<div class="az-ak-grup"><b>' + escHtml(grup[g].judul) + '</b>';
				for (var h = 0; h < grup[g].isi.length; h++) {
					var item = grup[g].isi[h];
					var tampil = item.tanda ? '\u25CC' + item.nilai : item.nilai;
					html += '<button type="button" class="az-ak-tombol" data-nilai="' + escHtml(item.nilai) + '"><span style="font-family:\'' + skrip.font + '\',sans-serif">' + escHtml(tampil) + '</span><small>' + escHtml(item.label) + '</small></button>';
				}
				html += '</div>';
			}
			papan.innerHTML = html;
		}

		papan.addEventListener('click', function (e) {
			var tombol = e.target;
			while (tombol && tombol !== papan && !tombol.getAttribute('data-nilai')) {
				tombol = tombol.parentNode;
			}
			if (!tombol || tombol === papan) {
				return;
			}
			var nilai = tombol.getAttribute('data-nilai');
			var awal = kolomHasil.selectionStart || kolomHasil.value.length;
			var akhir = kolomHasil.selectionEnd || awal;
			kolomHasil.value = kolomHasil.value.substring(0, awal) + nilai + kolomHasil.value.substring(akhir);
			kolomHasil.focus();
			kolomHasil.selectionStart = kolomHasil.selectionEnd = awal + nilai.length;
		});
		pilihSkrip.addEventListener('change', function () {
			gambarPapan();
			terjemahkan();
		});
		for (var r = 0; r < radioJenis.length; r++) {
			radioJenis[r].addEventListener('change', function () {
				aturJenis(jenisTerpilih());
			});
		}
		kolomLatin.addEventListener('input', terjemahkan);
		latar.querySelector('.az-ak-tutup').addEventListener('click', tutup);
		latar.querySelector('.az-ak-batal').addEventListener('click', tutup);
		latar.addEventListener('mousedown', function (e) {
			if (e.target === latar) {
				tutup();
			}
		});
		tombolUtama.addEventListener('click', function () {
			var teks = kolomHasil.value;
			var kunciSkrip = pilihSkrip.value;
			var skrip = SKRIP[kunciSkrip];
			var jenis = jenisTerpilih();
			TERAKHIR.skrip = kunciSkrip;
			TERAKHIR.jenis = jenis;
			TERAKHIR.ukuran = pilihUkuran.value;
			simpanPilihan();
			if (teks.replace(/\s+/g, '') === '') {
				tutup();
				return;
			}
			if (jenis !== 'gambar') {
				opsi.sisipkan(htmlTeks(teks, skrip), 'teks');
				tutup();
				return;
			}
			tombolUtama.disabled = true;
			tombolUtama.textContent = 'Membuat gambar...';
			buatGambar(teks, skrip.font, parseInt(pilihUkuran.value, 10) || 20, function (dataUri, lebar, tinggi) {
				opsi.sisipkan(htmlGambar(dataUri, lebar, tinggi, teks, kolomLatin.value, kunciSkrip, pilihUkuran.value), 'gambar');
				tutup();
			});
		});
		document.addEventListener('keydown', tombolEsc, true);
		aturJenis(opsi.jenis || TERAKHIR.jenis);
		gambarPapan();
		if (opsi.hasil) {
			kolomHasil.value = opsi.hasil;
		} else {
			terjemahkan();
		}
		kolomLatin.focus();
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
			opsi.skrip = gambarLama.getAttribute('data-aksara-skrip') || '';
			opsi.latin = gambarLama.getAttribute('data-aksara-latin') || '';
			opsi.hasil = gambarLama.getAttribute('alt') || '';
			opsi.ukuran = gambarLama.getAttribute('data-aksara-ukuran') || '';
			opsi.jenis = 'gambar';
		} else {
			opsi.latin = editor.selection ? editor.selection.getContent({ format: 'text' }) : '';
		}
		bukaDialog(opsi);
	}

	function gambarAksara(elemen) {
		return elemen && elemen.nodeName === 'IMG' && (' ' + (elemen.className || '') + ' ').indexOf(' ' + KELAS_GAMBAR + ' ') !== -1;
	}

	window.azAksaraKetik = { alih: alih, buka: bukaDialog, skrip: SKRIP, buatGambar: buatGambar };

	if (window.tinymce && window.tinymce.PluginManager) {
		window.tinymce.PluginManager.add('azaksara', function (editor) {
			editor.addButton('azaksara', {
				text: 'Aksara',
				tooltip: 'Tulis aksara daerah (Jawa, Sunda, Bali, Lontara, Makassar, Batak, Rejang)',
				onclick: function () {
					var terpilih = editor.selection ? editor.selection.getNode() : null;
					bukaDariEditor(editor, gambarAksara(terpilih) ? terpilih : null);
				}
			});
			editor.on('dblclick', function (e) {
				if (gambarAksara(e.target)) {
					e.preventDefault();
					bukaDariEditor(editor, e.target);
				}
			});
		});
	}
})();
