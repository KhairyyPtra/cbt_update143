/*
 * Jawaban esai yang diketik di aplikasi (soal esai dengan alat_jawab terisi).
 * Di halaman soal tampil pratinjau jawaban + tombol "Tulis jawaban"; tombol membuka panel ketik di halaman yang sama
 * (bukan jendela baru, jadi tidak dianggap meninggalkan ujian). Panel bisa diciutkan untuk membaca soal lagi.
 *
 * Panel berisi satu kotak jawaban (contenteditable): teks biasa dan rumus sebagai "chip" di dalam teks. Tombol
 * "Sisipkan rumus" membuka jendela rumus (MathLive math-field, bila alat memuat "rumus"); "Sisipkan" memasukkan
 * rumus ke posisi kursor lalu siswa langsung melanjutkan teks. Ketuk chip untuk mengubah / menghapus rumus.
 * Alat tambahan: papan huruf Arab ("arab") dan papan huruf aksara daerah ("aksara-<skrip>", nama & font dari
 * window.azAksaraKetik.skrip di js/aksara-ketik.js). Siswa memilih huruf sendiri; tidak ada alih tulis dari huruf Latin.
 *
 * Format jawaban (sama dengan server & js/esai-tampil.js): teks polos, baris baru "\n", rumus ditulis \( LaTeX \),
 * maksimal 4000 karakter. Jawaban disimpan lewat opsi.simpan (ditunda sebentar setelah mengetik).
 *
 *   azEsaiKetik.pasang({ wadah: el, alat: 'teks,rumus,arab,aksara-jawa', jawab: '...', nomor: '3', simpan: fn });
 *   azEsaiKetik.simpanSekarang();   // kirim perubahan yang masih tertunda (dipanggil sebelum pindah soal)
 *   azEsaiKetik.lepas();            // tutup panel & lepaskan soal aktif
 *   azEsaiKetik.saatTempel = fn;    // dipanggil bila siswa mencoba menempel teks
 *   azEsaiKetik.izinBuka = fn;      // fn(lanjut): panggil lanjut({ boleh: true }) atau lanjut({ boleh: false, pesan })
 *                                   // sebelum panel (dan keyboard) boleh dibuka, mis. hanya saat layar ujian terkunci
 *   azEsaiKetik.saatPanel = fn;     // fn(terbuka): panel jawaban tampil / disembunyikan (mis. sembunyikan tombol aplikasi)
 *
 * Skrip memakai JavaScript lama (ES5) dan hanya karakter ASCII.
 */
(function () {
	'use strict';

	if (window.azEsaiKetik) {
		return;
	}

	var BATAS_KARAKTER = 4000;
	var TUNDA_SIMPAN_MS = 600;
	var JEDA_LAPOR_TEMPEL_MS = 10000;
	var SKRIP_MATHLIVE = alamatMathlive();
	var DAFTAR_SKRIP_AKSARA = ['jawa', 'sunda', 'bali', 'lontara', 'makassar', 'batak', 'rejang'];

	/* MathLive ada di folder "mathlive" sejajar dengan folder "js" tempat skrip ini (Android: assets/, cbtoff: assets/esai/). */
	function alamatMathlive() {
		var skrip = document.currentScript;
		var alamat = skrip && skrip.src ? String(skrip.src) : '';
		var cocok = alamat.match(/^(.*\/)js\/esai-ketik\.js(?:[?#].*)?$/);
		return (cocok ? cocok[1] : '') + 'mathlive/mathlive.min.js';
	}

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
	var LINGKARAN_TANDA = huruf(0x25CC);

	var HURUF_ARAB = daftar([
		[0x0627, 'alif'], [0x0628, 'ba'], [0x062A, 'ta'], [0x062B, 'tsa'], [0x062C, 'jim'], [0x062D, 'ha'], [0x062E, 'kha'],
		[0x062F, 'dal'], [0x0630, 'dzal'], [0x0631, 'ra'], [0x0632, 'zai'], [0x0633, 'sin'], [0x0634, 'syin'], [0x0635, 'shad'],
		[0x0636, 'dhad'], [0x0637, 'tha'], [0x0638, 'zha'], [0x0639, "'ain"], [0x063A, 'ghain'], [0x0641, 'fa'], [0x0642, 'qaf'],
		[0x0643, 'kaf'], [0x0644, 'lam'], [0x0645, 'mim'], [0x0646, 'nun'], [0x0647, 'ha'], [0x0648, 'wau'], [0x064A, 'ya'],
		[0x0621, 'hamzah'], [0x0623, 'alif hamzah atas'], [0x0625, 'alif hamzah bawah'], [0x0622, 'alif mad'],
		[0x0624, 'wau hamzah'], [0x0626, 'ya hamzah'], [0x0629, 'ta marbuthah'], [0x0649, 'alif maqshurah'], [LAM_ALIF, 'lam alif']
	]);

	var HARAKAT_ARAB = [
		{ nilai: huruf(0x064E), label: 'fathah', letak: 'atas' },
		{ nilai: huruf(0x0650), label: 'kasrah', letak: 'bawah' },
		{ nilai: huruf(0x064F), label: 'dhammah', letak: 'atas' },
		{ nilai: huruf(0x064B), label: 'fathatain', letak: 'atas' },
		{ nilai: huruf(0x064D), label: 'kasratain', letak: 'bawah' },
		{ nilai: huruf(0x064C), label: 'dhammatain', letak: 'atas' },
		{ nilai: huruf(0x0652), label: 'sukun', letak: 'atas' },
		{ nilai: huruf(0x0651), label: 'syaddah', letak: 'atas' }
	];

	var keadaan = {
		opsi: null,
		alat: {},
		panel: null,
		isi: null,
		editor: null,
		rentang: null,
		cuplikan: '',
		dialogRumus: null,
		hitung: null,
		papan: null,
		pratinjau: null,
		tombolBuka: null,
		terbuka: false,
		ciut: false,
		papanAktif: '',
		timerSimpan: null,
		teksTersimpan: '',
		laporTerakhir: 0,
		mathlive: 'belum',
		antreanMathlive: []
	};

	function el(tag, kelas, teks) {
		var e = document.createElement(tag);
		if (kelas) {
			e.className = kelas;
		}
		if (teks !== undefined) {
			e.textContent = teks;
		}
		return e;
	}

	function tombol(kelas, teks, judul, aksi) {
		var b = el('button', kelas, teks);
		b.type = 'button';
		if (judul) {
			b.setAttribute('aria-label', judul);
			b.title = judul;
		}
		b.addEventListener('click', function (e) {
			e.preventDefault();
			aksi(e);
		});
		return b;
	}

	function bacaAlat(teks) {
		var hasil = { teks: false, rumus: false, arab: false, aksara: '' };
		var bagian = String(teks || '').split(',');
		for (var i = 0; i < bagian.length; i++) {
			var t = bagian[i].replace(/\s+/g, '').toLowerCase();
			if (t === '') {
				continue;
			}
			hasil.teks = true;
			if (t === 'rumus') {
				hasil.rumus = true;
			} else if (t === 'arab') {
				hasil.arab = true;
			} else if (t.indexOf('aksara-') === 0 && DAFTAR_SKRIP_AKSARA.indexOf(t.slice(7)) !== -1) {
				hasil.aksara = t.slice(7);
			}
		}
		return hasil;
	}

	function aktif(teksAlat) {
		return bacaAlat(teksAlat).teks;
	}

	/* ---------- MathLive (dimuat hanya bila soal memakai rumus) ---------- */

	function mathliveDidukung() {
		return !!(window.customElements && window.Promise && Element.prototype.attachShadow && window.CSS && CSS.supports && CSS.supports('display', 'grid'));
	}

	function muatMathlive(selesai) {
		if (keadaan.mathlive === 'siap') {
			selesai(true);
			return;
		}
		if (keadaan.mathlive === 'gagal') {
			selesai(false);
			return;
		}
		keadaan.antreanMathlive.push(selesai);
		if (keadaan.mathlive === 'memuat') {
			return;
		}
		if (!mathliveDidukung()) {
			akhiriMuatMathlive(false);
			return;
		}
		keadaan.mathlive = 'memuat';
		var skrip = document.createElement('script');
		skrip.src = SKRIP_MATHLIVE;
		skrip.onload = function () {
			var ok = !!(window.MathfieldElement && window.MathLive);
			if (ok) {
				try {
					window.MathfieldElement.soundsDirectory = null;
				} catch (e) {
				}
			}
			akhiriMuatMathlive(ok);
		};
		skrip.onerror = function () {
			akhiriMuatMathlive(false);
		};
		document.head.appendChild(skrip);
	}

	function akhiriMuatMathlive(ok) {
		keadaan.mathlive = ok ? 'siap' : 'gagal';
		var antrean = keadaan.antreanMathlive;
		keadaan.antreanMathlive = [];
		for (var i = 0; i < antrean.length; i++) {
			antrean[i](ok);
		}
	}

	function rumusTersedia() {
		return keadaan.alat.rumus && keadaan.mathlive === 'siap';
	}

	/* ---------- Format jawaban ---------- */

	var POLA_RUMUS = /\\\(([\s\S]*?)\\\)/g;
	var PENANDA_KURSOR = '\u200b';

	function urai(teks) {
		var hasil = [];
		var akhir = 0;
		var cocok;
		teks = String(teks || '');
		POLA_RUMUS.lastIndex = 0;
		while ((cocok = POLA_RUMUS.exec(teks)) !== null) {
			hasil.push({ jenis: 'teks', isi: teks.slice(akhir, cocok.index) });
			hasil.push({ jenis: 'rumus', isi: cocok[1] });
			akhir = cocok.index + cocok[0].length;
		}
		hasil.push({ jenis: 'teks', isi: teks.slice(akhir) });
		return hasil;
	}

	function amankanTeks(teks) {
		return String(teks).replace(/\\\(/g, '\\ (').replace(/\\\)/g, '\\ )');
	}

	function rapikanLatex(latex) {
		return String(latex || '').replace(/\\placeholder\{\}/g, '{}').trim();
	}

	function adalahChip(simpul) {
		return !!(simpul && simpul.nodeType === 1 && simpul.className && String(simpul.className).indexOf('esai-chip') !== -1);
	}

	function adalahPenutup(simpul) {
		return !!(simpul && simpul.nodeType === 1 && simpul.nodeName === 'BR' && simpul.getAttribute('data-penutup') === '1');
	}

	/* Isi kotak jawaban -> format jawaban: teks, "\n" untuk baris baru, chip rumus -> \( LaTeX \). */
	function susunDari(simpul, hasil) {
		for (var anak = simpul.firstChild; anak; anak = anak.nextSibling) {
			if (anak.nodeType === 3) {
				hasil.teks += amankanTeks(anak.nodeValue.split(PENANDA_KURSOR).join('').replace(/\u00a0/g, ' '));
			} else if (anak.nodeType !== 1) {
				continue;
			} else if (adalahChip(anak)) {
				var latex = rapikanLatex(anak.getAttribute('data-latex'));
				if (latex !== '') {
					hasil.teks += '\\(' + latex + '\\)';
				}
			} else if (anak.nodeName === 'BR') {
				if (!adalahPenutup(anak) && !(anak === simpul.lastChild && simpul !== keadaan.editor)) {
					hasil.teks += '\n';
				}
			} else if (anak.nodeName === 'DIV' || anak.nodeName === 'P') {
				if (hasil.teks !== '' && hasil.teks.charAt(hasil.teks.length - 1) !== '\n') {
					hasil.teks += '\n';
				}
				susunDari(anak, hasil);
			} else {
				susunDari(anak, hasil);
			}
		}
	}

	function susun() {
		if (!keadaan.editor) {
			return keadaan.teksTersimpan;
		}
		var hasil = { teks: '' };
		susunDari(keadaan.editor, hasil);
		return hasil.teks;
	}

	/* ---------- Simpan ---------- */

	function jadwalkanSimpan() {
		clearTimeout(keadaan.timerSimpan);
		keadaan.timerSimpan = setTimeout(simpanSekarang, TUNDA_SIMPAN_MS);
		perbaruiHitung();
	}

	function simpanSekarang() {
		clearTimeout(keadaan.timerSimpan);
		keadaan.timerSimpan = null;
		if (!keadaan.opsi || !keadaan.editor) {
			return;
		}
		var teks = susun();
		if (teks.replace(/\s+/g, '') === '') {
			teks = '';
		}
		if (teks === keadaan.teksTersimpan) {
			return;
		}
		keadaan.teksTersimpan = teks;
		try {
			keadaan.opsi.simpan(teks);
		} catch (e) {
		}
		tampilkanPratinjau();
	}

	function perbaruiHitung() {
		if (!keadaan.hitung) {
			return;
		}
		var teks = susun();
		keadaan.hitung.textContent = teks.length + '/' + BATAS_KARAKTER;
		keadaan.hitung.className = 'esai-hitung' + (teks.length >= BATAS_KARAKTER ? ' penuh' : '');
		if (keadaan.editor) {
			keadaan.editor.className = 'esai-editor' + (teks === '' ? ' kosong' : '');
		}
	}

	/* ---------- Pratinjau di halaman soal ---------- */

	function tampilkanPratinjau() {
		var kotak = keadaan.pratinjau;
		if (!kotak) {
			return;
		}
		var teks = keadaan.teksTersimpan;
		if (!window.azEsaiTampil || !window.azEsaiTampil.adaIsi(teks)) {
			kotak.className = 'esai-pratinjau kosong';
			kotak.textContent = 'Belum ada jawaban. Ketuk "Tulis jawaban" untuk mulai mengetik.';
		} else {
			kotak.className = 'esai-pratinjau';
			window.azEsaiTampil.render(kotak, teks);
		}
		if (keadaan.tombolBuka) {
			keadaan.tombolBuka.textContent = window.azEsaiTampil && window.azEsaiTampil.adaIsi(teks) ? 'Ubah jawaban' : 'Tulis jawaban';
		}
	}

	/* ---------- Kotak jawaban (satu kotak: teks + chip rumus) ---------- */

	function laporTempel() {
		var sekarang = Date.now();
		if (sekarang - keadaan.laporTerakhir < JEDA_LAPOR_TEMPEL_MS) {
			return;
		}
		keadaan.laporTerakhir = sekarang;
		if (typeof window.azEsaiKetik.saatTempel === 'function') {
			try {
				window.azEsaiKetik.saatTempel();
			} catch (e) {
			}
		}
	}

	function markupRumus(latex) {
		var ml = window.MathLive;
		if (!ml || typeof ml.convertLatexToMarkup !== 'function') {
			return null;
		}
		try {
			return ml.convertLatexToMarkup(latex);
		} catch (e) {
			return null;
		}
	}

	function buatChip(latex) {
		var chip = el('span', 'esai-chip');
		chip.setAttribute('contenteditable', 'false');
		chip.setAttribute('data-latex', latex);
		chip.setAttribute('role', 'button');
		chip.setAttribute('title', 'Ketuk untuk mengubah rumus');
		var markup = markupRumus(latex);
		if (markup === null) {
			chip.className += ' esai-chip-teks';
			chip.textContent = latex;
		} else {
			chip.innerHTML = markup;
		}
		return chip;
	}

	function pastikanPenutup() {
		var editor = keadaan.editor;
		if (!adalahPenutup(editor.lastChild)) {
			var br = document.createElement('br');
			br.setAttribute('data-penutup', '1');
			editor.appendChild(br);
		}
	}

	function isiEditor(teks) {
		var editor = keadaan.editor;
		while (editor.firstChild) {
			editor.removeChild(editor.firstChild);
		}
		var bagian = urai(teks);
		for (var i = 0; i < bagian.length; i++) {
			if (bagian[i].jenis === 'rumus') {
				editor.appendChild(buatChip(bagian[i].isi));
				editor.appendChild(document.createTextNode(PENANDA_KURSOR));
			} else {
				var simpul = simpulTeks(bagian[i].isi);
				for (var j = 0; j < simpul.length; j++) {
					editor.appendChild(simpul[j]);
				}
			}
		}
		pastikanPenutup();
		keadaan.cuplikan = editor.innerHTML;
	}

	/*
	 * Posisi kursor terakhir di kotak jawaban, dicatat selama kotak fokus. Saat papan huruf dipakai kotak tidak fokus;
	 * posisi hasil sisipan papan disimpan langsung (letakkanKursor) dan tidak boleh tertimpa seleksi lama dokumen.
	 */
	function catatRentang() {
		var editor = keadaan.editor;
		var sel = window.getSelection ? window.getSelection() : null;
		if (!editor || !sel || sel.rangeCount === 0 || document.activeElement !== editor) {
			return;
		}
		var rentang = sel.getRangeAt(0);
		if (editor.contains(rentang.startContainer) && editor.contains(rentang.endContainer)) {
			keadaan.rentang = rentang.cloneRange();
		}
	}

	function rentangSisip() {
		var editor = keadaan.editor;
		var r = keadaan.rentang;
		if (r && editor.contains(r.startContainer) && editor.contains(r.endContainer)) {
			return r.cloneRange();
		}
		var akhir = document.createRange();
		if (adalahPenutup(editor.lastChild)) {
			akhir.setStartBefore(editor.lastChild);
		} else {
			akhir.selectNodeContents(editor);
			akhir.collapse(false);
		}
		akhir.collapse(true);
		return akhir;
	}

	function letakkanKursor(rentang, fokus) {
		keadaan.rentang = rentang.cloneRange();
		if (!fokus && document.activeElement !== keadaan.editor) {
			return;
		}
		if (fokus && document.activeElement !== keadaan.editor) {
			try {
				keadaan.editor.focus();
			} catch (e) {
			}
		}
		var sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(rentang);
	}

	/* Sisipkan simpul (teks / chip) di posisi kursor; dibatalkan bila jawaban melebihi batas karakter. */
	function sisipkanSimpul(daftarSimpul, fokus) {
		var rentang = rentangSisip();
		var cadangan = keadaan.editor.innerHTML;
		rentang.deleteContents();
		for (var i = 0; i < daftarSimpul.length; i++) {
			rentang.insertNode(daftarSimpul[i]);
			rentang.setStartAfter(daftarSimpul[i]);
			rentang.collapse(true);
		}
		pastikanPenutup();
		if (susun().length > BATAS_KARAKTER) {
			keadaan.editor.innerHTML = cadangan;
			keadaan.rentang = null;
			perbaruiHitung();
			return false;
		}
		keadaan.cuplikan = keadaan.editor.innerHTML;
		letakkanKursor(rentang, fokus);
		tampakkanKursor();
		jadwalkanSimpan();
		return true;
	}

	/* Teks -> simpul untuk kotak jawaban; baris baru menjadi <br> agar kursor bisa berada di baris kosong. */
	function simpulTeks(teks) {
		var hasil = [];
		var baris = String(teks).split('\n');
		for (var i = 0; i < baris.length; i++) {
			if (i > 0) {
				hasil.push(document.createElement('br'));
			}
			if (baris[i] !== '') {
				hasil.push(document.createTextNode(baris[i]));
			}
		}
		return hasil;
	}

	function sisipkanTeks(teks) {
		if (teks === '') {
			return;
		}
		sisipkanSimpul(simpulTeks(teks), false);
	}

	function simpulSebelum(rentang) {
		var simpul = rentang.startContainer;
		var offset = rentang.startOffset;
		var calon;
		if (simpul.nodeType === 3) {
			if (offset > 0) {
				return { simpul: simpul, offset: offset };
			}
			calon = simpul;
		} else if (offset > 0) {
			calon = simpul.childNodes[offset - 1];
			return turunKeAkhir(calon);
		} else {
			calon = simpul;
		}
		while (calon && calon !== keadaan.editor && !calon.previousSibling) {
			calon = calon.parentNode;
		}
		if (!calon || calon === keadaan.editor) {
			return null;
		}
		return turunKeAkhir(calon.previousSibling);
	}

	function turunKeAkhir(simpul) {
		while (simpul && simpul.nodeType === 1 && !adalahChip(simpul) && simpul.nodeName !== 'BR' && simpul.lastChild) {
			simpul = simpul.lastChild;
		}
		if (!simpul) {
			return null;
		}
		return { simpul: simpul, offset: simpul.nodeType === 3 ? simpul.nodeValue.length : 0 };
	}

	/* Tombol "Hapus" di papan huruf: hapus satu huruf (atau satu rumus) sebelum kursor tanpa memunculkan keyboard. */
	function hapusSatu() {
		var rentang = rentangSisip();
		if (!rentang.collapsed) {
			rentang.deleteContents();
		} else {
			var batas = 20;
			while (batas > 0) {
				batas--;
				var sebelum = simpulSebelum(rentang);
				if (!sebelum) {
					break;
				}
				var s = sebelum.simpul;
				if (s.nodeType === 3) {
					if (sebelum.offset === 0) {
						rentang.setStartBefore(s);
						rentang.collapse(true);
						continue;
					}
					var akhir = sebelum.offset;
					var awal = akhir - 1;
					var kode = s.nodeValue.charCodeAt(awal);
					if (kode >= 0xDC00 && kode <= 0xDFFF && awal > 0) {
						awal--;
					}
					var hilang = s.nodeValue.slice(awal, akhir);
					s.nodeValue = s.nodeValue.slice(0, awal) + s.nodeValue.slice(akhir);
					rentang.setStart(s, awal);
					rentang.collapse(true);
					if (hilang === PENANDA_KURSOR) {
						continue;
					}
					break;
				}
				rentang.setStartBefore(s);
				rentang.collapse(true);
				s.parentNode.removeChild(s);
				break;
			}
		}
		pastikanPenutup();
		keadaan.cuplikan = keadaan.editor.innerHTML;
		letakkanKursor(rentang, false);
		tampakkanKursor();
		jadwalkanSimpan();
	}

	/* Kotak jawaban digeser agar posisi kursor (tempat huruf baru) terlihat, mis. saat papan huruf terbuka. */
	function tampakkanKursor() {
		var isi = keadaan.isi;
		var r = keadaan.rentang;
		if (!isi || !r || !r.getClientRects) {
			return;
		}
		var kotak = r.getClientRects()[0];
		if (!kotak) {
			var simpul = r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentNode;
			kotak = simpul && simpul.getBoundingClientRect ? simpul.getBoundingClientRect() : null;
		}
		if (!kotak) {
			return;
		}
		var batas = isi.getBoundingClientRect();
		if (kotak.bottom > batas.bottom) {
			isi.scrollTop += kotak.bottom - batas.bottom + 10;
		} else if (kotak.top < batas.top) {
			isi.scrollTop -= batas.top - kotak.top + 10;
		}
	}

	function buatEditor() {
		var editor = el('div', 'esai-editor');
		editor.setAttribute('contenteditable', 'true');
		editor.setAttribute('role', 'textbox');
		editor.setAttribute('aria-multiline', 'true');
		editor.setAttribute('aria-label', 'Jawaban');
		editor.setAttribute('data-kosong', 'Ketik jawaban di sini');
		editor.setAttribute('spellcheck', 'false');
		editor.setAttribute('autocorrect', 'off');
		editor.setAttribute('autocapitalize', 'sentences');
		editor.setAttribute('autocomplete', 'off');
		editor.style.fontFamily = fontTeks();
		editor.addEventListener('paste', function (e) {
			e.preventDefault();
			laporTempel();
		});
		editor.addEventListener('drop', function (e) {
			e.preventDefault();
		});
		editor.addEventListener('beforeinput', function (e) {
			var jenis = e.inputType || '';
			if (jenis === 'insertFromPaste' || jenis === 'insertFromDrop' || jenis === 'insertFromYank') {
				e.preventDefault();
				laporTempel();
				return;
			}
			if (jenis.indexOf('format') === 0) {
				e.preventDefault();
				return;
			}
			if (jenis === 'insertParagraph' || jenis === 'insertLineBreak') {
				e.preventDefault();
				catatRentang();
				sisipkanSimpul([document.createElement('br')], true);
				return;
			}
			if (jenis === 'insertText' && e.data && susun().length + e.data.length > BATAS_KARAKTER) {
				e.preventDefault();
			}
		});
		editor.addEventListener('input', function () {
			if (susun().length > BATAS_KARAKTER) {
				editor.innerHTML = keadaan.cuplikan;
				keadaan.rentang = null;
				letakkanKursor(rentangSisip(), true);
			}
			pastikanPenutup();
			keadaan.cuplikan = editor.innerHTML;
			catatRentang();
			jadwalkanSimpan();
		});
		editor.addEventListener('keyup', catatRentang);
		editor.addEventListener('mouseup', catatRentang);
		editor.addEventListener('touchend', catatRentang);
		editor.addEventListener('click', function (e) {
			var simpul = e.target;
			while (simpul && simpul !== editor && !adalahChip(simpul)) {
				simpul = simpul.parentNode;
			}
			if (adalahChip(simpul)) {
				e.preventDefault();
				var r = document.createRange();
				r.setStartAfter(simpul);
				r.collapse(true);
				keadaan.rentang = r;
				bukaDialogRumus(simpul);
			}
		});
		return editor;
	}

	var pantauSeleksi = false;

	function pasangPantauSeleksi() {
		if (pantauSeleksi) {
			return;
		}
		pantauSeleksi = true;
		document.addEventListener('selectionchange', catatRentang);
	}

	/* ---------- Jendela rumus: tulis rumus lalu "Sisipkan" ke dalam teks di posisi kursor ---------- */

	/* Menu bawaan MathLive dimatikan: isinya berbahasa Inggris dan memuat Tempel/Salin yang membaca papan klip langsung. */
	function matikanMenuRumus(medan) {
		var kosongkan = function () {
			try {
				medan.menuItems = [];
			} catch (e) {
			}
		};
		kosongkan();
		medan.addEventListener('mount', kosongkan);
		medan.addEventListener('contextmenu', function (e) {
			e.preventDefault();
			e.stopPropagation();
		}, true);
	}

	/*
	 * Palet rumus per kelompok (kebutuhan ujian matematika & kimia SMA). Tiap tombol: l = label (LaTeX, ditampilkan
	 * oleh MathLive), j = keterangan, s = LaTeX yang disisipkan (#? = kotak isian), p = perintah MathLive.
	 */
	var NAVIGASI_RUMUS = [
		{ t: '\u2192', j: 'Ke kotak berikutnya (mis. penyebut), atau keluar dari pangkat/indeks/pecahan', p: 'lanjut' },
		{ t: '\u2190', j: 'Geser kursor ke kiri', p: 'moveToPreviousChar' },
		{ t: '\u232b', j: 'Hapus satu bagian sebelum kursor', p: 'deleteBackward' }
	];

	var GRUP_RUMUS = [
		{ nama: 'Dasar', alat: [
			{ l: '\\square^{\\square}', j: 'Pangkat (bilangan sebelum kursor menjadi bilangan pokok)', s: '#@^{#?}' },
			{ l: '\\square_{\\square}', j: 'Indeks bawah (bilangan sebelum kursor menjadi bilangan pokok)', s: '#@_{#?}' },
			{ l: '\\frac{\\square}{\\square}', j: 'Pecahan', s: '\\frac{#?}{#?}' },
			{ l: '\\sqrt{\\square}', j: 'Akar kuadrat', s: '\\sqrt{#?}' },
			{ l: '\\sqrt[n]{\\square}', j: 'Akar pangkat n', s: '\\sqrt[#?]{#?}' },
			{ l: '(\\square)', j: 'Kurung', s: '\\left(#?\\right)' },
			{ l: '|\\square|', j: 'Nilai mutlak', s: '\\left|#?\\right|' },
			{ l: '\\pm', j: 'Plus minus', s: '\\pm' },
			{ l: '\\times', j: 'Kali', s: '\\times' },
			{ l: '\\div', j: 'Bagi', s: '\\div' },
			{ l: '\\cdot', j: 'Titik kali', s: '\\cdot' },
			{ l: '\\ne', j: 'Tidak sama dengan', s: '\\ne' },
			{ l: '\\le', j: 'Kurang dari atau sama dengan', s: '\\le' },
			{ l: '\\ge', j: 'Lebih dari atau sama dengan', s: '\\ge' },
			{ l: '\\approx', j: 'Kira-kira', s: '\\approx' },
			{ l: '\\infty', j: 'Tak hingga', s: '\\infty' },
			{ l: '\\pi', j: 'Pi', s: '\\pi' },
			{ l: '\\square^{\\circ}', j: 'Derajat', s: '^{\\circ}' },
			{ l: '\\%', j: 'Persen', s: '\\%' }
		] },
		{ nama: 'Aljabar', alat: [
			{ l: '\\log', j: 'Logaritma', s: '\\log ' },
			{ l: '{}^{a}\\log b', j: 'Logaritma basis a', s: '{}^{#?}\\log #?' },
			{ l: '\\log_{a}b', j: 'Logaritma basis a (indeks bawah)', s: '\\log_{#?}#?' },
			{ l: '\\ln', j: 'Logaritma natural', s: '\\ln ' },
			{ l: 'e^{\\square}', j: 'Eksponen e', s: 'e^{#?}' },
			{ l: 'f(x)', j: 'Fungsi', s: 'f(x)' },
			{ l: 'f^{-1}(x)', j: 'Fungsi invers', s: 'f^{-1}(x)' },
			{ l: '(f\\circ g)(x)', j: 'Fungsi komposisi', s: '(f\\circ g)(x)' },
			{ l: 'n!', j: 'Faktorial', s: '#?!' },
			{ l: '\\binom{n}{r}', j: 'Kombinasi', s: '\\binom{#?}{#?}' },
			{ l: '{}_{n}C_{r}', j: 'Kombinasi (nCr)', s: '{}_{#?}C_{#?}' },
			{ l: '{}_{n}P_{r}', j: 'Permutasi (nPr)', s: '{}_{#?}P_{#?}' },
			{ l: '\\sum_{i=1}^{n}', j: 'Notasi sigma', s: '\\sum_{#?}^{#?}#?' },
			{ l: 'U_{n}', j: 'Suku ke-n', s: 'U_{#?}' },
			{ l: 'S_{n}', j: 'Jumlah n suku', s: 'S_{#?}' },
			{ l: '\\vec{a}', j: 'Vektor', s: '\\vec{#?}' },
			{ l: '\\overline{x}', j: 'Rata-rata / garis atas', s: '\\overline{#?}' },
			{ l: '\\begin{cases}\\square\\\\\\square\\end{cases}', j: 'Sistem persamaan / fungsi bercabang', s: '\\begin{cases}#?\\\\#?\\end{cases}' }
		] },
		{ nama: 'Kalkulus', alat: [
			{ l: '\\lim_{x\\to a}', j: 'Limit x mendekati a', s: '\\lim_{x\\to #?}#?' },
			{ l: '\\lim_{x\\to\\infty}', j: 'Limit tak hingga', s: '\\lim_{x\\to\\infty}#?' },
			{ l: '\\frac{d}{dx}', j: 'Turunan terhadap x', s: '\\frac{d}{dx}\\left(#?\\right)' },
			{ l: '\\frac{dy}{dx}', j: 'Turunan y terhadap x', s: '\\frac{dy}{dx}' },
			{ l: "f'(x)", j: 'Turunan pertama', s: "f'(x)" },
			{ l: "f''(x)", j: 'Turunan kedua', s: "f''(x)" },
			{ l: '\\int\\square\\,dx', j: 'Integral tak tentu', s: '\\int #?\\,dx' },
			{ l: '\\int_{a}^{b}\\square\\,dx', j: 'Integral tentu', s: '\\int_{#?}^{#?}#?\\,dx' },
			{ l: '\\left[\\square\\right]_{a}^{b}', j: 'Hasil integral tentu [F(x)] dari a sampai b', s: '\\left[#?\\right]_{#?}^{#?}' },
			{ l: '\\,dx', j: 'dx', s: '\\,dx' },
			{ l: '+C', j: 'Konstanta integral', s: '+C' },
			{ l: '\\Delta', j: 'Delta', s: '\\Delta ' },
			{ l: '\\partial', j: 'Turunan parsial', s: '\\partial ' }
		] },
		{ nama: 'Matriks', alat: [
			{ l: '\\begin{pmatrix}a&b\\\\c&d\\end{pmatrix}', j: 'Matriks 2\u00d72', s: '\\begin{pmatrix}#?&#?\\\\#?&#?\\end{pmatrix}' },
			{ l: '\\begin{pmatrix}a&b&c\\\\d&e&f\\\\g&h&i\\end{pmatrix}', j: 'Matriks 3\u00d73', s: '\\begin{pmatrix}#?&#?&#?\\\\#?&#?&#?\\\\#?&#?&#?\\end{pmatrix}' },
			{ l: '\\begin{pmatrix}a&b&c\\\\d&e&f\\end{pmatrix}', j: 'Matriks 2\u00d73', s: '\\begin{pmatrix}#?&#?&#?\\\\#?&#?&#?\\end{pmatrix}' },
			{ l: '\\begin{pmatrix}a\\\\b\\end{pmatrix}', j: 'Matriks kolom 2\u00d71 / vektor', s: '\\begin{pmatrix}#?\\\\#?\\end{pmatrix}' },
			{ l: '\\begin{pmatrix}a\\\\b\\\\c\\end{pmatrix}', j: 'Matriks kolom 3\u00d71 / vektor', s: '\\begin{pmatrix}#?\\\\#?\\\\#?\\end{pmatrix}' },
			{ l: '\\begin{vmatrix}a&b\\\\c&d\\end{vmatrix}', j: 'Determinan 2\u00d72', s: '\\begin{vmatrix}#?&#?\\\\#?&#?\\end{vmatrix}' },
			{ l: '\\begin{vmatrix}a&b&c\\\\d&e&f\\\\g&h&i\\end{vmatrix}', j: 'Determinan 3\u00d73', s: '\\begin{vmatrix}#?&#?&#?\\\\#?&#?&#?\\\\#?&#?&#?\\end{vmatrix}' },
			{ l: '\\det(A)', j: 'Determinan A', s: '\\det(#?)' },
			{ l: 'A^{T}', j: 'Transpose', s: '^{T}' },
			{ l: 'A^{-1}', j: 'Invers', s: '^{-1}' },
			{ l: '\\text{+baris}', j: 'Tambah baris di bawah baris kursor', p: 'addRowAfter' },
			{ l: '\\text{+kolom}', j: 'Tambah kolom di kanan kolom kursor', p: 'addColumnAfter' },
			{ l: '\\text{\u2212baris}', j: 'Hapus baris di kursor', p: 'removeRow' },
			{ l: '\\text{\u2212kolom}', j: 'Hapus kolom di kursor', p: 'removeColumn' }
		] },
		{ nama: 'Trigono', alat: [
			{ l: '\\sin', j: 'Sinus', s: '\\sin ' },
			{ l: '\\cos', j: 'Kosinus', s: '\\cos ' },
			{ l: '\\tan', j: 'Tangen', s: '\\tan ' },
			{ l: '\\csc', j: 'Kosekan', s: '\\csc ' },
			{ l: '\\sec', j: 'Sekan', s: '\\sec ' },
			{ l: '\\cot', j: 'Kotangen', s: '\\cot ' },
			{ l: '\\sin^{2}', j: 'Sinus kuadrat', s: '\\sin^{2}' },
			{ l: '\\cos^{2}', j: 'Kosinus kuadrat', s: '\\cos^{2}' },
			{ l: '\\theta', j: 'Theta', s: '\\theta' },
			{ l: '\\alpha', j: 'Alfa', s: '\\alpha' },
			{ l: '\\beta', j: 'Beta', s: '\\beta' },
			{ l: '\\angle', j: 'Sudut', s: '\\angle ' },
			{ l: '\\triangle', j: 'Segitiga', s: '\\triangle ' },
			{ l: '\\parallel', j: 'Sejajar', s: '\\parallel ' },
			{ l: '\\perp', j: 'Tegak lurus', s: '\\perp ' },
			{ l: '\\cong', j: 'Kongruen', s: '\\cong ' },
			{ l: '\\sim', j: 'Sebangun', s: '\\sim ' },
			{ l: '\\overline{AB}', j: 'Ruas garis', s: '\\overline{#?}' },
			{ l: '\\overrightarrow{AB}', j: 'Vektor AB', s: '\\overrightarrow{#?}' }
		] },
		{ nama: 'Himpunan', alat: [
			{ l: '\\{\\square\\}', j: 'Himpunan', s: '\\left\\{#?\\right\\}' },
			{ l: '\\in', j: 'Anggota', s: '\\in ' },
			{ l: '\\notin', j: 'Bukan anggota', s: '\\notin ' },
			{ l: '\\subset', j: 'Himpunan bagian', s: '\\subset ' },
			{ l: '\\subseteq', j: 'Himpunan bagian atau sama dengan', s: '\\subseteq ' },
			{ l: '\\cup', j: 'Gabungan', s: '\\cup ' },
			{ l: '\\cap', j: 'Irisan', s: '\\cap ' },
			{ l: '\\emptyset', j: 'Himpunan kosong', s: '\\emptyset' },
			{ l: 'A^{c}', j: 'Komplemen', s: '^{c}' },
			{ l: '\\mathbb{R}', j: 'Bilangan real', s: '\\mathbb{R}' },
			{ l: '\\mathbb{Z}', j: 'Bilangan bulat', s: '\\mathbb{Z}' },
			{ l: '\\mathbb{N}', j: 'Bilangan asli', s: '\\mathbb{N}' },
			{ l: '\\sim p', j: 'Negasi', s: '\\sim ' },
			{ l: '\\wedge', j: 'Dan (konjungsi)', s: '\\wedge ' },
			{ l: '\\vee', j: 'Atau (disjungsi)', s: '\\vee ' },
			{ l: '\\Rightarrow', j: 'Implikasi', s: '\\Rightarrow ' },
			{ l: '\\Leftrightarrow', j: 'Biimplikasi', s: '\\Leftrightarrow ' },
			{ l: '\\forall', j: 'Untuk setiap', s: '\\forall ' },
			{ l: '\\exists', j: 'Ada / terdapat', s: '\\exists ' },
			{ l: '\\therefore', j: 'Jadi', s: '\\therefore ' }
		] },
		{ nama: 'Kimia', alat: [
			{ l: '\\mathrm{H_2O}', j: 'Mode kimia: huruf tegak untuk rumus kimia (ketuk lagi untuk kembali ke huruf miring)', p: 'tegak' },
			{ l: '\\square_{\\square}', j: 'Indeks atom (angka di bawah)', s: '#@_{#?}' },
			{ l: '\\square^{\\square}', j: 'Muatan ion', s: '#@^{#?}' },
			{ l: '\\square^{+}', j: 'Ion positif', s: '#@^{+}' },
			{ l: '\\square^{-}', j: 'Ion negatif', s: '#@^{-}' },
			{ l: '{}_{Z}^{A}\\mathrm{X}', j: 'Notasi isotop (nomor massa & nomor atom)', s: '{}_{#?}^{#?}\\mathrm{#?}' },
			{ l: '\\rightarrow', j: 'Panah reaksi', s: '\\rightarrow ' },
			{ l: '\\rightleftharpoons', j: 'Reaksi kesetimbangan', s: '\\rightleftharpoons ' },
			{ l: '\\xrightarrow{\\Delta}', j: 'Panah reaksi dengan syarat (di atas panah)', s: '\\xrightarrow{#?}' },
			{ l: '\\uparrow', j: 'Gas', s: '\\uparrow ' },
			{ l: '\\downarrow', j: 'Endapan', s: '\\downarrow ' },
			{ l: '\\mathrm{(aq)}', j: 'Larutan', s: '\\mathrm{(aq)}' },
			{ l: '\\mathrm{(s)}', j: 'Padat', s: '\\mathrm{(s)}' },
			{ l: '\\mathrm{(l)}', j: 'Cair', s: '\\mathrm{(l)}' },
			{ l: '\\mathrm{(g)}', j: 'Gas (wujud)', s: '\\mathrm{(g)}' },
			{ l: '\\cdot', j: 'Titik hidrat, mis. CuSO4\u00b75H2O', s: '\\cdot ' },
			{ l: '\\Delta H', j: 'Perubahan entalpi', s: '\\Delta H' },
			{ l: '^{\\circ}\\mathrm{C}', j: 'Derajat Celsius', s: '^{\\circ}\\mathrm{C}' },
			{ l: '\\mathrm{K}', j: 'Kelvin', s: '\\mathrm{K}' },
			{ l: '\\mathrm{mol}', j: 'Mol', s: '\\mathrm{\\ mol}' },
			{ l: '\\mathrm{M}', j: 'Molaritas', s: '\\mathrm{\\ M}' },
			{ l: '[\\square]', j: 'Konsentrasi', s: '\\left[#?\\right]' },
			{ l: 'K_{c}', j: 'Tetapan kesetimbangan konsentrasi', s: 'K_{c}' },
			{ l: 'K_{p}', j: 'Tetapan kesetimbangan tekanan', s: 'K_{p}' },
			{ l: 'K_{a}', j: 'Tetapan ionisasi asam', s: 'K_{a}' },
			{ l: 'K_{b}', j: 'Tetapan ionisasi basa', s: 'K_{b}' },
			{ l: 'K_{sp}', j: 'Hasil kali kelarutan', s: 'K_{sp}' },
			{ l: '\\mathrm{pH}', j: 'pH', s: '\\mathrm{pH}' },
			{ l: '\\mathrm{pOH}', j: 'pOH', s: '\\mathrm{pOH}' },
			{ l: '\\delta^{+}', j: 'Parsial positif', s: '\\delta^{+}' },
			{ l: '\\delta^{-}', j: 'Parsial negatif', s: '\\delta^{-}' },
			{ l: 'e^{-}', j: 'Elektron', s: 'e^{-}' },
			{ l: '\\times 10^{\\square}', j: 'Notasi ilmiah', s: '\\times 10^{#?}' }
		] },
		{ nama: 'Yunani', alat: [
			{ l: '\\alpha', s: '\\alpha' }, { l: '\\beta', s: '\\beta' }, { l: '\\gamma', s: '\\gamma' }, { l: '\\delta', s: '\\delta' },
			{ l: '\\epsilon', s: '\\epsilon' }, { l: '\\theta', s: '\\theta' }, { l: '\\lambda', s: '\\lambda' }, { l: '\\mu', s: '\\mu' },
			{ l: '\\pi', s: '\\pi' }, { l: '\\rho', s: '\\rho' }, { l: '\\sigma', s: '\\sigma' }, { l: '\\tau', s: '\\tau' },
			{ l: '\\phi', s: '\\phi' }, { l: '\\omega', s: '\\omega' }, { l: '\\Delta', s: '\\Delta' }, { l: '\\Sigma', s: '\\Sigma' },
			{ l: '\\Omega', s: '\\Omega' }
		] }
	];

	function jalankanAlatRumus(medan, alat) {
		try {
			medan.focus();
			if (alat.p === 'lanjut') {
				lanjutDiRumus(medan);
			} else if (alat.p === 'tegak') {
				aturModeKimia(medan, !keadaan.modeKimia);
			} else if (alat.p) {
				medan.executeCommand(alat.p);
			} else {
				medan.insert(alat.s, { focus: true, selectionMode: 'placeholder' });
			}
		} catch (e) {
		}
	}

	function aturModeKimia(medan, aktif) {
		keadaan.modeKimia = !!aktif;
		terapkanModeKimia(medan);
		var tombolMode = keadaan.dialogRumus ? keadaan.dialogRumus.querySelectorAll('.esai-rumus-tegak') : [];
		for (var i = 0; i < tombolMode.length; i++) {
			tombolMode[i].className = 'esai-rumus-tombol esai-rumus-tegak' + (keadaan.modeKimia ? ' aktif' : '');
			tombolMode[i].setAttribute('aria-pressed', keadaan.modeKimia ? 'true' : 'false');
		}
	}

	function terapkanModeKimia(medan) {
		try {
			medan.applyStyle({ variantStyle: keadaan.modeKimia ? 'up' : '' }, { operation: 'set' });
		} catch (e) {
		}
	}

	function tombolAlatRumus(medan, alat) {
		var b = tombol('esai-rumus-tombol', alat.t || '', alat.j || '', function () {
			jalankanAlatRumus(medan, alat);
		});
		if (alat.p === 'tegak') {
			b.className = 'esai-rumus-tombol esai-rumus-tegak' + (keadaan.modeKimia ? ' aktif' : '');
			b.setAttribute('aria-pressed', keadaan.modeKimia ? 'true' : 'false');
		}
		if (alat.l) {
			var markup = markupRumus(alat.l);
			if (markup) {
				b.innerHTML = markup;
			} else {
				b.textContent = alat.l;
			}
			if (!alat.j) {
				b.setAttribute('aria-label', alat.l);
			}
		}
		return b;
	}

	function isiGrupRumus(wadah, medan, indeks) {
		wadah.innerHTML = '';
		var grup = GRUP_RUMUS[indeks] || GRUP_RUMUS[0];
		for (var i = 0; i < grup.alat.length; i++) {
			wadah.appendChild(tombolAlatRumus(medan, grup.alat[i]));
		}
	}

	function buatPaletRumus(medan) {
		var palet = el('div', 'esai-rumus-palet');
		palet.addEventListener('mousedown', function (e) {
			e.preventDefault();
		});
		var navigasi = el('div', 'esai-rumus-alat esai-rumus-navigasi');
		for (var n = 0; n < NAVIGASI_RUMUS.length; n++) {
			navigasi.appendChild(tombolAlatRumus(medan, NAVIGASI_RUMUS[n]));
		}
		palet.appendChild(navigasi);
		var tab = el('div', 'esai-rumus-tab');
		tab.setAttribute('role', 'tablist');
		var isi = el('div', 'esai-rumus-alat esai-rumus-isi');
		var aktif = keadaan.grupRumus || 0;
		var daftarTab = [];
		var pilih = function (indeks) {
			keadaan.grupRumus = indeks;
			for (var t = 0; t < daftarTab.length; t++) {
				daftarTab[t].className = 'esai-rumus-tab-tombol' + (t === indeks ? ' aktif' : '');
				daftarTab[t].setAttribute('aria-selected', t === indeks ? 'true' : 'false');
			}
			isiGrupRumus(isi, medan, indeks);
		};
		for (var g = 0; g < GRUP_RUMUS.length; g++) {
			(function (indeks) {
				var b = tombol('esai-rumus-tab-tombol', GRUP_RUMUS[indeks].nama, 'Rumus ' + GRUP_RUMUS[indeks].nama, function () {
					pilih(indeks);
				});
				b.setAttribute('role', 'tab');
				daftarTab.push(b);
				tab.appendChild(b);
			})(g);
		}
		palet.appendChild(tab);
		palet.appendChild(isi);
		pilih(aktif < GRUP_RUMUS.length ? aktif : 0);
		return palet;
	}

	/* Masih ada kotak kosong (mis. penyebut pecahan): pindah ke sana; bila tidak, keluar dari pangkat/indeks/pecahan. */
	function lanjutDiRumus(medan) {
		if (String(medan.value).indexOf('\\placeholder') !== -1) {
			medan.executeCommand('moveToNextPlaceholder');
			return;
		}
		medan.executeCommand('moveAfterParent');
	}

	function sembunyikanKeyboardRumus() {
		if (window.mathVirtualKeyboard && window.mathVirtualKeyboard.hide) {
			try {
				window.mathVirtualKeyboard.hide();
			} catch (e) {
			}
		}
	}

	/* chip = rumus yang diketuk untuk diubah; null = rumus baru di posisi kursor. */
	function bukaDialogRumus(chip) {
		if (!rumusTersedia() || !keadaan.panel) {
			return;
		}
		tutupDialogRumus();
		if (!chip) {
			catatRentang();
		}
		if (document.activeElement && document.activeElement.blur) {
			document.activeElement.blur();
		}
		var dialog = el('div', 'esai-rumus-dialog');
		dialog.setAttribute('role', 'dialog');
		dialog.setAttribute('aria-label', 'Tulis rumus');
		dialog.appendChild(el('div', 'esai-rumus-judul', chip ? 'Ubah rumus' : 'Tulis rumus'));
		var medan = new window.MathfieldElement();
		medan.className = 'esai-rumus-medan';
		medan.value = chip ? String(chip.getAttribute('data-latex') || '') : '';
		medan.setAttribute('aria-label', 'Rumus');
		medan.mathVirtualKeyboardPolicy = 'auto';
		matikanMenuRumus(medan);
		medan.addEventListener('paste', function (e) {
			e.preventDefault();
			laporTempel();
		}, true);
		medan.addEventListener('keydown', function (e) {
			if (e.key === 'Enter') {
				e.preventDefault();
				e.stopPropagation();
				selesaikanRumus(medan, chip);
			}
		}, true);
		medan.addEventListener('selection-change', function () {
			if (keadaan.modeKimia) {
				terapkanModeKimia(medan);
			}
		});
		dialog.appendChild(medan);
		dialog.appendChild(buatPaletRumus(medan));
		var aksi = el('div', 'esai-rumus-aksi');
		if (chip) {
			aksi.appendChild(tombol('esai-rumus-hapus', 'Hapus rumus', 'Hapus rumus ini dari jawaban', function () {
				hapusChip(chip);
			}));
		}
		aksi.appendChild(tombol('esai-rumus-batal', 'Batal', 'Tutup tanpa menyimpan rumus', function () {
			tutupDialogRumus();
		}));
		aksi.appendChild(tombol('esai-rumus-sisip', chip ? 'Simpan' : 'Sisipkan', chip ? 'Simpan perubahan rumus' : 'Sisipkan rumus ke jawaban', function () {
			selesaikanRumus(medan, chip);
		}));
		dialog.appendChild(aksi);
		keadaan.panel.appendChild(dialog);
		keadaan.dialogRumus = dialog;
		geometriKeyboard();
		setTimeout(function () {
			try {
				medan.focus();
				if (chip) {
					medan.executeCommand('moveToMathfieldEnd');
				}
			} catch (e) {
			}
		}, 50);
	}

	function tutupDialogRumus() {
		var dialog = keadaan.dialogRumus;
		keadaan.dialogRumus = null;
		if (!dialog) {
			return;
		}
		sembunyikanKeyboardRumus();
		if (dialog.parentNode) {
			dialog.parentNode.removeChild(dialog);
		}
		geometriKeyboard();
	}

	/* Rumus selesai: masuk ke teks di posisi kursor, lalu kursor kembali ke kotak jawaban tepat setelah rumus. */
	function selesaikanRumus(medan, chip) {
		var latex = rapikanLatex(medan.value);
		if (chip) {
			if (latex === '') {
				tutupDialogRumus();
				return;
			}
			var cadangan = chip.getAttribute('data-latex');
			chip.setAttribute('data-latex', latex);
			if (susun().length > BATAS_KARAKTER) {
				chip.setAttribute('data-latex', cadangan);
				return;
			}
			var baru = buatChip(latex);
			chip.parentNode.replaceChild(baru, chip);
			keadaan.cuplikan = keadaan.editor.innerHTML;
			tutupDialogRumus();
			var r = document.createRange();
			r.setStartAfter(baru);
			r.collapse(true);
			letakkanKursor(r, true);
			jadwalkanSimpan();
			return;
		}
		if (latex === '') {
			tutupDialogRumus();
			letakkanKursor(rentangSisip(), true);
			return;
		}
		tutupDialogRumus();
		if (!sisipkanSimpul([buatChip(latex), document.createTextNode(PENANDA_KURSOR)], true)) {
			perbaruiHitung();
		}
	}

	function hapusChip(chip) {
		var r = document.createRange();
		r.setStartBefore(chip);
		r.collapse(true);
		var berikut = chip.nextSibling;
		chip.parentNode.removeChild(chip);
		if (berikut && berikut.nodeType === 3 && berikut.nodeValue.indexOf(PENANDA_KURSOR) === 0) {
			berikut.nodeValue = berikut.nodeValue.slice(1);
		}
		pastikanPenutup();
		keadaan.cuplikan = keadaan.editor.innerHTML;
		tutupDialogRumus();
		letakkanKursor(r, true);
		jadwalkanSimpan();
	}

	/* ---------- Papan huruf (Arab / aksara) ---------- */

	function tombolHuruf(item, font) {
		var label = item.tanda ? LINGKARAN_TANDA + item.nilai : item.nilai;
		var b = tombol('esai-huruf', label, item.label, function () {
			sisipkanTeks(item.nilai);
		});
		if (font) {
			b.style.fontFamily = '"' + font + '", sans-serif';
		}
		return b;
	}

	function tombolBantu(wadah) {
		var baris = el('div', 'esai-papan-bantu');
		baris.appendChild(tombol('esai-bantu', 'Spasi', 'Spasi', function () {
			sisipkanTeks(' ');
		}));
		baris.appendChild(tombol('esai-bantu', 'Baris baru', 'Baris baru', function () {
			sisipkanTeks('\n');
		}));
		baris.appendChild(tombol('esai-bantu', 'Hapus', 'Hapus satu huruf', hapusSatu));
		wadah.appendChild(baris);
	}

	function tombolHarakat(item) {
		var b = tombol('esai-huruf esai-harakat', '', item.label, function () {
			sisipkanTeks(item.nilai);
		});
		b.appendChild(el('i', '', ''));
		b.appendChild(el('b', item.letak, huruf(0x00A0) + item.nilai));
		return b;
	}

	function gambarPapanArab(wadah) {
		var grupHuruf = el('div', 'esai-papan-grup arab esai-papan-huruf');
		for (var i = 0; i < HURUF_ARAB.length; i++) {
			grupHuruf.appendChild(tombolHuruf(HURUF_ARAB[i], 'AZ Arab'));
		}
		wadah.appendChild(grupHuruf);
		var grupHarakat = el('div', 'esai-papan-grup arab esai-papan-harakat');
		for (var j = 0; j < HARAKAT_ARAB.length; j++) {
			grupHarakat.appendChild(tombolHarakat(HARAKAT_ARAB[j]));
		}
		wadah.appendChild(grupHarakat);
		tombolBantu(wadah);
	}

	function papanAksara(kunciSkrip) {
		var skrip = window.azAksaraKetik && window.azAksaraKetik.skrip ? window.azAksaraKetik.skrip[kunciSkrip] : null;
		var hasil = [];
		if (!skrip) {
			return hasil;
		}
		var dilihat = {};
		function kumpulkan(judul, data, tanda) {
			var isi = [];
			for (var kunci in data) {
				if (data.hasOwnProperty(kunci) && data[kunci] && !dilihat[data[kunci]]) {
					dilihat[data[kunci]] = true;
					isi.push({ label: kunci, nilai: data[kunci], tanda: !!tanda });
				}
			}
			if (isi.length) {
				hasil.push({ judul: judul, isi: isi });
			}
		}
		kumpulkan('Huruf', skrip.konsonan || {}, false);
		kumpulkan('Huruf vokal', skrip.vokalMandiri || {}, false);
		kumpulkan('Sandhangan vokal', skrip.vokal || {}, true);
		kumpulkan('Sisipan', skrip.sisipan || {}, true);
		kumpulkan('Konsonan akhir', skrip.akhir || {}, true);
		if (skrip.pangkon) {
			kumpulkan('Pemati huruf', { mati: skrip.pangkon }, true);
		}
		kumpulkan('Angka', skrip.angka || {}, false);
		kumpulkan('Tanda baca', skrip.tandaBaca || {}, false);
		return hasil;
	}

	function infoSkrip(kunciSkrip) {
		var skrip = window.azAksaraKetik && window.azAksaraKetik.skrip ? window.azAksaraKetik.skrip[kunciSkrip] : null;
		return skrip || { nama: 'Aksara', font: '' };
	}

	function gambarPapanAksara(wadah) {
		var kunciSkrip = keadaan.alat.aksara;
		var skrip = infoSkrip(kunciSkrip);
		wadah.appendChild(el('div', 'esai-papan-judul', skrip.nama + ': pilih huruf satu per satu'));
		tombolBantu(wadah);
		var grup = papanAksara(kunciSkrip);
		for (var g = 0; g < grup.length; g++) {
			wadah.appendChild(el('div', 'esai-papan-judul', grup[g].judul));
			var kotak = el('div', 'esai-papan-grup');
			for (var i = 0; i < grup[g].isi.length; i++) {
				kotak.appendChild(tombolHuruf(grup[g].isi[i], skrip.font));
			}
			wadah.appendChild(kotak);
		}
	}

	function bukaPapan(jenis) {
		var papan = keadaan.papan;
		if (keadaan.papanAktif === jenis) {
			keadaan.papanAktif = '';
			papan.style.display = 'none';
			papan.innerHTML = '';
			perbaruiTombolAlat();
			tandaiPapanTerbuka(false);
			return;
		}
		catatRentang();
		keadaan.papanAktif = jenis;
		papan.innerHTML = '';
		if (document.activeElement && document.activeElement.blur) {
			document.activeElement.blur();
		}
		if (jenis === 'arab') {
			gambarPapanArab(papan);
		} else {
			gambarPapanAksara(papan);
		}
		papan.style.display = 'block';
		papan.scrollTop = 0;
		perbaruiTombolAlat();
		tandaiPapanTerbuka(true);
		tampakkanKursor();
	}

	function tandaiPapanTerbuka(terbuka) {
		var badan = keadaan.panel ? keadaan.panel.querySelector('.esai-panel-badan') : null;
		if (badan) {
			badan.className = 'esai-panel-badan' + (terbuka ? ' papan-terbuka' : '');
		}
	}

	function perbaruiTombolAlat() {
		var semua = keadaan.panel ? keadaan.panel.querySelectorAll('[data-papan]') : [];
		for (var i = 0; i < semua.length; i++) {
			var nyala = semua[i].getAttribute('data-papan') === keadaan.papanAktif;
			semua[i].className = 'esai-alat-tombol' + (nyala ? ' aktif' : '');
			semua[i].setAttribute('aria-pressed', nyala ? 'true' : 'false');
		}
	}

	/* ---------- Panel ---------- */

	function fontTeks() {
		var font = ['"Open Sans"', '"AZ Arab"'];
		if (keadaan.alat.aksara) {
			var info = infoSkrip(keadaan.alat.aksara);
			if (info.font) {
				font.push('"' + info.font + '"');
			}
		}
		font.push('sans-serif');
		return font.join(', ');
	}

	function buatPanel() {
		var panel = el('div', 'esai-panel');
		panel.setAttribute('role', 'dialog');
		panel.setAttribute('aria-label', 'Tulis jawaban esai');
		var kepala = el('div', 'esai-panel-kepala');
		var judul = el('strong', 'esai-panel-judul', 'Jawaban soal ' + keadaan.opsi.nomor);
		keadaan.hitung = el('span', 'esai-hitung', '0/' + BATAS_KARAKTER);
		var tombolCiut = tombol('esai-panel-ciut', 'Lihat soal', 'Ciutkan panel untuk membaca soal', function () {
			aturCiut(!keadaan.ciut);
		});
		var tombolSelesai = tombol('esai-panel-selesai', 'Selesai', 'Simpan dan tutup panel', tutupPanel);
		kepala.appendChild(judul);
		kepala.appendChild(keadaan.hitung);
		kepala.appendChild(tombolCiut);
		kepala.appendChild(tombolSelesai);
		panel.appendChild(kepala);

		var badan = el('div', 'esai-panel-badan');
		keadaan.isi = el('div', 'esai-panel-isi');
		keadaan.editor = buatEditor();
		keadaan.isi.appendChild(keadaan.editor);
		badan.appendChild(keadaan.isi);

		var alat = el('div', 'esai-panel-alat');
		alat.addEventListener('mousedown', function (e) {
			e.preventDefault();
		});
		if (rumusTersedia()) {
			alat.appendChild(tombol('esai-alat-tombol', '\u221a Sisipkan rumus', 'Sisipkan rumus di posisi kursor', function () {
				bukaDialogRumus(null);
			}));
		}
		if (keadaan.alat.arab) {
			var bArab = tombol('esai-alat-tombol', '\u0639 Tulis Arab', 'Papan huruf Arab', function () {
				bukaPapan('arab');
			});
			bArab.setAttribute('data-papan', 'arab');
			alat.appendChild(bArab);
		}
		if (keadaan.alat.aksara) {
			var bAksara = tombol('esai-alat-tombol', 'Tulis ' + infoSkrip(keadaan.alat.aksara).nama, 'Tulis aksara daerah', function () {
				bukaPapan('aksara');
			});
			bAksara.setAttribute('data-papan', 'aksara');
			alat.appendChild(bAksara);
		}
		if (alat.childNodes.length) {
			badan.appendChild(alat);
		}
		keadaan.papan = el('div', 'esai-papan');
		keadaan.papan.style.display = 'none';
		badan.appendChild(keadaan.papan);
		panel.appendChild(badan);
		document.body.appendChild(panel);
		keadaan.panel = panel;
		perbaruiTombolAlat();
		pasangGeometri();
		pasangPantauSeleksi();
	}

	function aturCiut(ciut) {
		keadaan.ciut = ciut;
		if (!keadaan.panel) {
			return;
		}
		keadaan.panel.className = 'esai-panel' + (ciut ? ' ciut' : '');
		var b = keadaan.panel.querySelector('.esai-panel-ciut');
		if (b) {
			b.textContent = ciut ? 'Tulis lagi' : 'Lihat soal';
		}
		if (ciut) {
			tutupDialogRumus();
		}
		if (ciut && document.activeElement && document.activeElement.blur) {
			document.activeElement.blur();
		}
		aturRuangHalaman();
		kabarkanPanel(!ciut);
	}

	function kabarkanPanel(terbuka) {
		if (typeof window.azEsaiKetik.saatPanel !== 'function') {
			return;
		}
		try {
			window.azEsaiKetik.saatPanel(terbuka);
		} catch (e) {
		}
	}

	function aturRuangHalaman() {
		var tinggi = keadaan.terbuka && keadaan.panel ? keadaan.panel.offsetHeight : 0;
		document.body.style.paddingBottom = tinggi ? (tinggi + 16) + 'px' : '';
	}

	function geometriKeyboard() {
		if (!keadaan.panel) {
			return;
		}
		var bawah = 0;
		var vv = window.visualViewport;
		if (vv) {
			bawah = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
		}
		var mvk = window.mathVirtualKeyboard;
		if (mvk && mvk.visible && mvk.boundingRect) {
			bawah = Math.max(bawah, mvk.boundingRect.height);
		}
		keadaan.panel.style.bottom = bawah + 'px';
		if (keadaan.dialogRumus) {
			var tinggi = Math.max(240, Math.min(TINGGI_MAKS_RUMUS, window.innerHeight - bawah - 12));
			keadaan.panel.style.height = tinggi + 'px';
			keadaan.panel.style.maxHeight = tinggi + 'px';
		} else {
			keadaan.panel.style.height = '';
			keadaan.panel.style.maxHeight = '';
		}
		aturRuangHalaman();
	}

	var TINGGI_MAKS_RUMUS = 620;

	var geometriTerpasang = false;

	function pasangGeometri() {
		if (geometriTerpasang) {
			geometriKeyboard();
			return;
		}
		geometriTerpasang = true;
		if (window.visualViewport) {
			window.visualViewport.addEventListener('resize', geometriKeyboard);
			window.visualViewport.addEventListener('scroll', geometriKeyboard);
		}
		window.addEventListener('resize', geometriKeyboard);
		if (window.mathVirtualKeyboard && window.mathVirtualKeyboard.addEventListener) {
			window.mathVirtualKeyboard.addEventListener('geometrychange', geometriKeyboard);
		}
		geometriKeyboard();
	}

	function tampilkanPesan(teks) {
		var wadah = keadaan.opsi ? keadaan.opsi.wadah : null;
		if (!wadah) {
			return;
		}
		var lama = wadah.querySelector('.esai-pesan');
		if (lama) {
			lama.parentNode.removeChild(lama);
		}
		if (!teks) {
			return;
		}
		var pesan = el('div', 'esai-pesan', teks);
		pesan.setAttribute('role', 'alert');
		wadah.appendChild(pesan);
	}

	function bacaIzin(hasil) {
		if (typeof hasil === 'string') {
			try {
				hasil = JSON.parse(hasil);
			} catch (e) {
				hasil = null;
			}
		}
		return hasil && typeof hasil === 'object' ? hasil : { boleh: false, pesan: 'Panel jawaban tidak dapat dibuka. Coba lagi.' };
	}

	function bukaPanel() {
		if (!keadaan.opsi) {
			return;
		}
		if (keadaan.terbuka) {
			aturCiut(false);
			return;
		}
		var izin = window.azEsaiKetik.izinBuka;
		if (typeof izin !== 'function') {
			bukaPanelSekarang();
			return;
		}
		var opsi = keadaan.opsi;
		izin(function (hasil) {
			hasil = bacaIzin(hasil);
			if (keadaan.opsi !== opsi) {
				return;
			}
			if (!hasil.boleh) {
				tampilkanPesan(hasil.pesan || 'Panel jawaban belum bisa dibuka.');
				return;
			}
			tampilkanPesan('');
			bukaPanelSekarang();
		});
	}

	function bukaPanelSekarang() {
		if (!keadaan.opsi || keadaan.terbuka) {
			return;
		}
		keadaan.terbuka = true;
		keadaan.ciut = false;
		buatPanel();
		isiEditor(keadaan.teksTersimpan);
		perbaruiHitung();
		aturCiut(false);
		keadaan.rentang = null;
		setTimeout(function () {
			if (keadaan.editor) {
				letakkanKursor(rentangSisip(), true);
				tampakkanKursor();
			}
		}, 80);
	}

	function tutupPanel() {
		simpanSekarang();
		tutupDialogRumus();
		if (document.activeElement && document.activeElement.blur) {
			document.activeElement.blur();
		}
		if (keadaan.panel && keadaan.panel.parentNode) {
			keadaan.panel.parentNode.removeChild(keadaan.panel);
		}
		keadaan.panel = null;
		keadaan.isi = null;
		keadaan.editor = null;
		keadaan.rentang = null;
		keadaan.hitung = null;
		keadaan.papan = null;
		keadaan.papanAktif = '';
		keadaan.terbuka = false;
		keadaan.ciut = false;
		aturRuangHalaman();
		tampilkanPratinjau();
		kabarkanPanel(false);
	}

	/* ---------- API ---------- */

	function lepas() {
		if (keadaan.terbuka) {
			tutupPanel();
		} else {
			simpanSekarang();
		}
		keadaan.opsi = null;
		keadaan.pratinjau = null;
		keadaan.tombolBuka = null;
	}

	function pasang(opsi) {
		lepas();
		keadaan.opsi = opsi;
		keadaan.alat = bacaAlat(opsi.alat);
		keadaan.teksTersimpan = String(opsi.jawab || '');
		var wadah = opsi.wadah;
		while (wadah.firstChild) {
			wadah.removeChild(wadah.firstChild);
		}
		wadah.className = (wadah.className.replace(/\besai-ketik\b/g, '') + ' esai-ketik').replace(/^\s+/, '');
		wadah.appendChild(el('div', 'esai-label', 'Jawaban Anda'));
		keadaan.pratinjau = el('div', 'esai-pratinjau');
		keadaan.pratinjau.setAttribute('role', 'button');
		keadaan.pratinjau.setAttribute('tabindex', '0');
		keadaan.pratinjau.addEventListener('click', bukaPanel);
		wadah.appendChild(keadaan.pratinjau);
		keadaan.tombolBuka = tombol('esai-buka', 'Tulis jawaban', 'Tulis jawaban esai', bukaPanel);
		wadah.appendChild(keadaan.tombolBuka);
		tampilkanPratinjau();
		if (keadaan.alat.rumus) {
			muatMathlive(function () {
				if (keadaan.opsi === opsi) {
					tampilkanPratinjau();
				}
			});
		}
	}

	window.azEsaiKetik = {
		pasang: pasang,
		lepas: lepas,
		simpanSekarang: simpanSekarang,
		aktif: aktif,
		buka: bukaPanel,
		tutup: tutupPanel,
		saatTempel: null,
		izinBuka: null,
		saatPanel: null,
		BATAS_KARAKTER: BATAS_KARAKTER
	};
})();
