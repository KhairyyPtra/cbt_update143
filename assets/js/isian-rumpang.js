/*
 * Isian Rumpang (soal tipe 8): kotak jawaban di dalam kalimat soal.
 * Server mengganti tanda [[n]] menjadi <input class="az-rumpang" data-no="n">; skrip ini mengisi
 * jawaban tersimpan dan mengirim jawaban baru sebagai JSON ["jawaban 1","jawaban 2",...] ('' bila semua kosong).
 * Salinan identik dipakai di aplikasi Android (app/src/main/assets/js/isian-rumpang.js).
 */
(function () {
	'use strict';

	var GAYA =
		'input.az-rumpang{display:inline-block;width:9.5em;max-width:70vw;margin:2px 4px;padding:2px 8px;' +
		'font:inherit;font-size:0.95em;line-height:1.6;color:inherit;background:rgba(29,111,66,0.06);' +
		'border:0;border-bottom:2px solid #1d6f42;border-radius:4px 4px 0 0;vertical-align:baseline;box-sizing:border-box;}' +
		'input.az-rumpang:focus{outline:none;background:rgba(29,111,66,0.14);border-bottom-color:#13512f;}' +
		'input.az-rumpang::placeholder{color:#9aa5b1;font-size:0.85em;text-align:center;}' +
		'input.az-rumpang.terisi{background:rgba(29,111,66,0.12);}' +
		'.dark input.az-rumpang{background:rgba(120,200,150,0.10);border-bottom-color:#5fc48a;}';

	function pasangGaya() {
		if (document.getElementById('az-rumpang-gaya')) {
			return;
		}
		var gaya = document.createElement('style');
		gaya.id = 'az-rumpang-gaya';
		gaya.appendChild(document.createTextNode(GAYA));
		(document.head || document.documentElement).appendChild(gaya);
	}

	function daftarJawaban(jawab) {
		if (Array.isArray(jawab)) {
			return jawab;
		}
		var teks = jawab == null ? '' : String(jawab);
		if (teks === '') {
			return [];
		}
		try {
			var hasil = JSON.parse(teks);
			if (Array.isArray(hasil)) {
				return hasil;
			}
		} catch (galat) {
		}
		return [teks];
	}

	function kotakDi(akar) {
		if (!akar || !akar.querySelectorAll) {
			return [];
		}
		return Array.prototype.slice.call(akar.querySelectorAll('input.az-rumpang'));
	}

	function susun(akar) {
		var hasil = [];
		var adaIsi = false;
		kotakDi(akar).forEach(function (kotak) {
			var nomor = parseInt(kotak.getAttribute('data-no'), 10);
			if (!(nomor >= 1)) {
				return;
			}
			while (hasil.length < nomor) {
				hasil.push('');
			}
			var isi = kotak.value.replace(/\s+/g, ' ').replace(/^\s+|\s+$/g, '');
			hasil[nomor - 1] = isi;
			if (isi !== '') {
				adaIsi = true;
			}
		});
		return adaIsi ? JSON.stringify(hasil) : '';
	}

	function pasang(akar, jawab, simpan) {
		pasangGaya();
		var daftar = daftarJawaban(jawab);
		var kotak = kotakDi(akar);
		kotak.forEach(function (isian) {
			var nomor = parseInt(isian.getAttribute('data-no'), 10);
			var nilai = daftar[nomor - 1];
			isian.value = nilai == null ? '' : String(nilai);
			isian.classList.toggle('terisi', isian.value !== '');
			isian.oninput = function () {
				isian.classList.toggle('terisi', isian.value !== '');
				if (typeof simpan === 'function') {
					simpan(susun(akar));
				}
			};
			isian.onkeydown = function (kejadian) {
				if (kejadian.key !== 'Enter') {
					return;
				}
				kejadian.preventDefault();
				var berikut = kotak[kotak.indexOf(isian) + 1];
				if (berikut) {
					berikut.focus();
				} else {
					isian.blur();
				}
			};
		});
		return kotak.length;
	}

	window.azRumpang = {
		pasang: pasang,
		susun: susun,
		daftarJawaban: daftarJawaban
	};

	var MAKS_ARAB = 15;
	var POLA_HARAKAT = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640]/g;
	var HURUF_ARAB = [
		'\u0627', '\u0628', '\u062A', '\u062B', '\u062C', '\u062D', '\u062E', '\u062F', '\u0630', '\u0631',
		'\u0632', '\u0633', '\u0634', '\u0635', '\u0636', '\u0637', '\u0638', '\u0639', '\u063A', '\u0641',
		'\u0642', '\u0643', '\u0644', '\u0645', '\u0646', '\u0647', '\u0648', '\u064A', '\u0621', '\u0623',
		'\u0625', '\u0622', '\u0624', '\u0626', '\u0629', '\u0649', '\u0644\u0627'
	];
	var HARAKAT_ARAB = [
		{ teks: '\u064E', nama: 'Fathah', letak: 'atas' },
		{ teks: '\u0650', nama: 'Kasrah', letak: 'bawah' },
		{ teks: '\u064F', nama: 'Dammah', letak: 'atas' },
		{ teks: '\u064B', nama: 'Fathatain', letak: 'atas' },
		{ teks: '\u064D', nama: 'Kasratain', letak: 'bawah' },
		{ teks: '\u064C', nama: 'Dammatain', letak: 'atas' },
		{ teks: '\u0652', nama: 'Sukun', letak: 'atas' },
		{ teks: '\u0651', nama: 'Syaddah', letak: 'atas' }
	];
	var GAYA_ARAB =
		'input.az-isian-arab{direction:rtl;text-align:right;font-family:"AZ Arab","AZ Arab Pegon","Traditional Arabic",serif !important;font-size:1.25em;line-height:1.7;}' +
		'.az-arab-tombol{display:inline-flex;align-items:center;gap:6px;margin:6px 4px;padding:5px 12px;border:1px solid #1d6f42;border-radius:6px;background:#fff;color:#1d6f42;font:600 14px/1.2 sans-serif;cursor:pointer;}' +
		'.az-arab-tombol b{font-family:"AZ Arab",serif;font-size:18px;font-weight:400;}' +
		'.az-arab-papan{position:fixed;left:0;right:0;bottom:0;z-index:2147483000;background:#f4f7f5;border-top:2px solid #1d6f42;box-shadow:0 -4px 16px rgba(0,0,0,.18);padding:8px 8px 10px;max-height:46vh;overflow-y:auto;}' +
		'.az-arab-papan-kepala{display:flex;align-items:center;justify-content:space-between;margin:0 2px 6px;font:600 13px/1.2 sans-serif;color:#1d6f42;}' +
		'.az-arab-papan-baris{display:flex;flex-wrap:wrap;direction:rtl;gap:5px;justify-content:center;margin-bottom:6px;}' +
		'.az-arab-papan button{min-width:40px;height:42px;padding:0 8px;border:1px solid #c9d6ce;border-radius:6px;background:#fff;color:#1b2b22;font-family:"AZ Arab","AZ Arab Pegon",serif;font-size:22px;line-height:1;cursor:pointer;touch-action:manipulation;}' +
		'.az-arab-papan button:active{background:#dcefe3;}' +
		'.az-arab-papan button.az-arab-harakat{position:relative;width:42px;padding:0;}' +
		'.az-arab-papan button.az-arab-harakat i{position:absolute;left:50%;top:50%;width:16px;height:16px;margin:-7px 0 0 -8px;border:1.6px dotted #66707a;border-radius:50%;box-sizing:border-box;}' +
		'.az-arab-papan button.az-arab-harakat b{position:absolute;left:0;right:0;text-align:center;font:400 26px/1 "AZ Arab","AZ Arab Pegon",serif;}' +
		'.az-arab-papan button.az-arab-harakat b.atas{top:6px;}.az-arab-papan button.az-arab-harakat b.bawah{top:0;}' +
		'.az-arab-papan button.az-arab-aksi{font:600 13px/1 sans-serif;min-width:64px;background:#e8efe9;}' +
		'.az-arab-papan button.az-arab-tutup{min-width:0;height:32px;font:600 13px/1 sans-serif;background:#1d6f42;color:#fff;border-color:#1d6f42;}' +
		'.dark .az-arab-papan{background:#1f2a24;}.dark .az-arab-papan button{background:#2b3a31;color:#eef4ef;border-color:#3c4f43;}';
	var papanAktif = null;
	var tombolAktif = null;
	var kotakTerakhir = null;

	function pasangGayaArab() {
		if (document.getElementById('az-isian-arab-gaya')) {
			return;
		}
		var gaya = document.createElement('style');
		gaya.id = 'az-isian-arab-gaya';
		gaya.appendChild(document.createTextNode(GAYA_ARAB));
		(document.head || document.documentElement).appendChild(gaya);
	}

	function panjangArab(teks) {
		return String(teks || '').replace(POLA_HARAKAT, '').length;
	}

	function potongArab(teks) {
		var hasil = '';
		var jumlah = 0;
		var daftar = String(teks || '');
		for (var i = 0; i < daftar.length; i++) {
			var huruf = daftar.charAt(i);
			POLA_HARAKAT.lastIndex = 0;
			var harakat = POLA_HARAKAT.test(huruf);
			POLA_HARAKAT.lastIndex = 0;
			if (!harakat) {
				if (jumlah >= MAKS_ARAB) {
					break;
				}
				jumlah++;
			}
			hasil += huruf;
		}
		return hasil;
	}

	function kabari(kotak) {
		var jenis = ['input', 'keyup', 'change'];
		for (var i = 0; i < jenis.length; i++) {
			var kejadian;
			try {
				kejadian = new Event(jenis[i], { bubbles: true });
			} catch (galat) {
				kejadian = document.createEvent('Event');
				kejadian.initEvent(jenis[i], true, true);
			}
			kotak.dispatchEvent(kejadian);
		}
	}

	function sisipkan(kotak, teks) {
		var awal = typeof kotak.selectionStart === 'number' ? kotak.selectionStart : kotak.value.length;
		var akhir = typeof kotak.selectionEnd === 'number' ? kotak.selectionEnd : kotak.value.length;
		var baru = kotak.value.slice(0, awal) + teks + kotak.value.slice(akhir);
		if (panjangArab(baru) > MAKS_ARAB) {
			return;
		}
		kotak.value = baru;
		var posisi = awal + teks.length;
		try {
			kotak.setSelectionRange(posisi, posisi);
		} catch (galat) {
		}
		kabari(kotak);
	}

	function hapusSatu(kotak) {
		var awal = typeof kotak.selectionStart === 'number' ? kotak.selectionStart : kotak.value.length;
		var akhir = typeof kotak.selectionEnd === 'number' ? kotak.selectionEnd : kotak.value.length;
		if (awal === akhir && awal > 0) {
			awal = awal - 1;
		}
		kotak.value = kotak.value.slice(0, awal) + kotak.value.slice(akhir);
		try {
			kotak.setSelectionRange(awal, awal);
		} catch (galat) {
		}
		kabari(kotak);
	}

	function tutupPapan() {
		if (papanAktif && papanAktif.parentNode) {
			papanAktif.parentNode.removeChild(papanAktif);
		}
		papanAktif = null;
		if (tombolAktif) {
			tombolAktif.setAttribute('aria-expanded', 'false');
		}
		var daftar = document.querySelectorAll('input.az-isian-arab');
		for (var i = 0; i < daftar.length; i++) {
			daftar[i].removeAttribute('inputmode');
		}
		document.body.style.paddingBottom = '';
	}

	function tombolHuruf(teks, label, kelas, aksi) {
		var tombol = document.createElement('button');
		tombol.type = 'button';
		tombol.textContent = teks;
		tombol.setAttribute('aria-label', label);
		if (kelas) {
			tombol.className = kelas;
		}
		tombol.addEventListener('mousedown', function (kejadian) {
			kejadian.preventDefault();
		});
		tombol.addEventListener('click', function (kejadian) {
			kejadian.preventDefault();
			aksi();
		});
		return tombol;
	}

	function bukaPapan(daftarKotak) {
		tutupPapan();
		var sasaran = function () {
			if (kotakTerakhir && daftarKotak.indexOf(kotakTerakhir) >= 0) {
				return kotakTerakhir;
			}
			return daftarKotak[0];
		};
		daftarKotak.forEach(function (kotak) {
			kotak.setAttribute('inputmode', 'none');
		});
		var papan = document.createElement('div');
		papan.className = 'az-arab-papan';
		papan.setAttribute('role', 'dialog');
		papan.setAttribute('aria-label', 'Papan huruf Arab');
		var kepala = document.createElement('div');
		kepala.className = 'az-arab-papan-kepala';
		var judul = document.createElement('span');
		judul.textContent = 'Papan huruf Arab (maks. ' + MAKS_ARAB + ' huruf, harakat tidak dihitung)';
		kepala.appendChild(judul);
		kepala.appendChild(tombolHuruf('Tutup', 'Tutup papan huruf Arab', 'az-arab-tutup', tutupPapan));
		papan.appendChild(kepala);
		var barisHuruf = document.createElement('div');
		barisHuruf.className = 'az-arab-papan-baris';
		HURUF_ARAB.forEach(function (huruf) {
			barisHuruf.appendChild(tombolHuruf(huruf, 'Huruf ' + huruf, '', function () {
				sisipkan(sasaran(), huruf);
			}));
		});
		papan.appendChild(barisHuruf);
		var barisHarakat = document.createElement('div');
		barisHarakat.className = 'az-arab-papan-baris';
		HARAKAT_ARAB.forEach(function (harakat) {
			var tombol = tombolHuruf('', harakat.nama, 'az-arab-harakat', function () {
				sisipkan(sasaran(), harakat.teks);
			});
			var lingkaran = document.createElement('i');
			var tanda = document.createElement('b');
			tanda.className = harakat.letak;
			tanda.textContent = '\u00A0' + harakat.teks;
			tombol.appendChild(lingkaran);
			tombol.appendChild(tanda);
			tombol.title = harakat.nama;
			barisHarakat.appendChild(tombol);
		});
		barisHarakat.appendChild(tombolHuruf('Spasi', 'Spasi', 'az-arab-aksi', function () {
			sisipkan(sasaran(), ' ');
		}));
		barisHarakat.appendChild(tombolHuruf('\u232B Hapus', 'Hapus satu huruf', 'az-arab-aksi', function () {
			hapusSatu(sasaran());
		}));
		papan.appendChild(barisHarakat);
		document.body.appendChild(papan);
		papanAktif = papan;
		document.body.style.paddingBottom = papan.offsetHeight + 'px';
		if (tombolAktif) {
			tombolAktif.setAttribute('aria-expanded', 'true');
		}
		var kotak = sasaran();
		if (kotak) {
			kotak.focus();
			try {
				kotak.scrollIntoView({ block: 'center' });
			} catch (galat) {
			}
		}
	}

	function siapkanKotakArab(kotak) {
		kotak.classList.add('az-isian-arab');
		kotak.setAttribute('dir', 'rtl');
		kotak.setAttribute('lang', 'ar');
		kotak.setAttribute('data-arab', '1');
		kotak.removeAttribute('maxlength');
		if (kotak.getAttribute('data-arab-siap') === '1') {
			return;
		}
		kotak.setAttribute('data-arab-siap', '1');
		kotak.addEventListener('focus', function () {
			kotakTerakhir = kotak;
		});
		kotak.addEventListener('beforeinput', function (kejadian) {
			var data = kejadian.data || '';
			if (!data || kejadian.inputType.indexOf('insert') !== 0) {
				return;
			}
			var awal = typeof kotak.selectionStart === 'number' ? kotak.selectionStart : kotak.value.length;
			var akhir = typeof kotak.selectionEnd === 'number' ? kotak.selectionEnd : kotak.value.length;
			var depan = kotak.value.slice(0, awal);
			var belakang = kotak.value.slice(akhir);
			if (panjangArab(depan + data + belakang) <= MAKS_ARAB) {
				return;
			}
			kejadian.preventDefault();
			var sisaRuang = MAKS_ARAB - panjangArab(depan + belakang);
			if (sisaRuang <= 0) {
				return;
			}
			var tambahan = data;
			var potongan = '';
			var dihitung = 0;
			for (var i = 0; i < tambahan.length; i++) {
				var huruf = tambahan.charAt(i);
				POLA_HARAKAT.lastIndex = 0;
				var harakat = POLA_HARAKAT.test(huruf);
				POLA_HARAKAT.lastIndex = 0;
				if (!harakat) {
					if (dihitung >= sisaRuang) {
						break;
					}
					dihitung++;
				}
				potongan += huruf;
			}
			kotak.value = depan + potongan + belakang;
			var posisi = depan.length + potongan.length;
			try {
				kotak.setSelectionRange(posisi, posisi);
			} catch (galat) {
			}
			kabari(kotak);
		});
		kotak.addEventListener('input', function () {
			if (panjangArab(kotak.value) > MAKS_ARAB) {
				kotak.value = potongArab(kotak.value);
				kabari(kotak);
			}
		});
	}

	function kotakIsianBiasa(akar) {
		var hasil = [];
		var daftar = akar.querySelectorAll('#optionS, .isian-input input, .isian-table input[type="text"]');
		for (var i = 0; i < daftar.length; i++) {
			if (hasil.indexOf(daftar[i]) < 0) {
				hasil.push(daftar[i]);
			}
		}
		return hasil;
	}

	function pasangArab(akar, opsi) {
		opsi = opsi || {};
		tutupPapan();
		if (tombolAktif && tombolAktif.parentNode) {
			tombolAktif.parentNode.removeChild(tombolAktif);
		}
		tombolAktif = null;
		kotakTerakhir = null;
		if (!akar || !akar.querySelectorAll) {
			return 0;
		}
		var daftarKotak = [];
		if (opsi.kotak) {
			daftarKotak = Array.prototype.slice.call(opsi.kotak);
		} else {
			daftarKotak = Array.prototype.slice.call(akar.querySelectorAll('input.az-rumpang[data-arab]'));
			if (akar.querySelector('.az-isian-arab-tanda')) {
				daftarKotak = daftarKotak.concat(kotakIsianBiasa(akar));
			}
		}
		if (!daftarKotak.length) {
			return 0;
		}
		pasangGayaArab();
		daftarKotak.forEach(siapkanKotakArab);
		var tombol = document.createElement('button');
		tombol.type = 'button';
		tombol.className = 'az-arab-tombol';
		tombol.setAttribute('aria-expanded', 'false');
		tombol.innerHTML = '<b>\u0639</b> Papan huruf Arab';
		tombol.addEventListener('mousedown', function (kejadian) {
			kejadian.preventDefault();
		});
		tombol.addEventListener('click', function () {
			if (papanAktif) {
				tutupPapan();
			} else {
				bukaPapan(daftarKotak);
			}
		});
		var acuan = opsi.setelah || daftarKotak[daftarKotak.length - 1];
		var wadahTombol = acuan.closest ? (acuan.closest('table') || acuan) : acuan;
		if (opsi.setelah) {
			wadahTombol = opsi.setelah;
		} else if (acuan.classList.contains('az-rumpang')) {
			var paragraf = acuan.closest ? acuan.closest('p, div, td, li') : null;
			wadahTombol = paragraf || acuan;
		}
		if (wadahTombol.parentNode) {
			wadahTombol.parentNode.insertBefore(tombol, wadahTombol.nextSibling);
		}
		tombolAktif = tombol;
		return daftarKotak.length;
	}

	window.azIsianArab = {
		pasang: pasangArab,
		tutup: tutupPapan,
		panjang: panjangArab,
		potong: potongArab,
		MAKS: MAKS_ARAB
	};
})();
