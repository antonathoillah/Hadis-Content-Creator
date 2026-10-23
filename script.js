
        const $ = id => document.getElementById(id);
        // ID internal takhrij/sanad/matan dipertahankan agar penyimpanan draf lama tetap kompatibel.
        const ids = ['student', 'topic', 'arabic', 'translation', 'source', 'message', 'takhrij', 'sanad', 'matan', 'context', 'url', 'feedback'];
        const weights = [['Ketepatan matan, terjemahan, dan takhrij hadis', 35], ['Ketepatan syarah hadis dan kontekstualisasi', 25], ['Kreativitas narasi dan visual', 20], ['Kualitas teknis produksi', 10], ['Etika digital dan transparansi AI', 10]];
        let frames = [], frame = 0, timer = null;

        /* ===== Accordion hasil skenario (dipicu tombol) ===== */
        function setScenariosOpen(open) {
            const content = $('produksi-content');
            const btn = $('generateBtn');
            const label = $('generateBtnLabel');
            const chevron = $('generateBtnChevron');
            if (open) {
                content.classList.remove('collapsed');
                content.setAttribute('aria-hidden', 'false');
                btn.setAttribute('aria-expanded', 'true');
                label.textContent = 'Sembunyikan Skenario';
                chevron.classList.add('up');
            } else {
                content.classList.add('collapsed');
                content.setAttribute('aria-hidden', 'true');
                btn.setAttribute('aria-expanded', 'false');
                label.textContent = 'Susun Skenario dari Hadis';
                chevron.classList.remove('up');
            }
        }

        /* Tombol utama = toggle sekaligus generator */
        function toggleScenarios() {
            const isCollapsed = $('produksi-content').classList.contains('collapsed');
            if (isCollapsed) {
                // Buka + susun skenario
                if (generate()) {
                    setScenariosOpen(true);
                }
            } else {
                // Tutup
                setScenariosOpen(false);
            }
        }

        function escapeHTML(s) {
            return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
        }

        function loadExample() {
            const v = { topic: 'Niat: Landasan Amal dan Keikhlasan', arabic: 'إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى', translation: 'Sesungguhnya setiap amal bergantung pada niatnya, dan setiap orang memperoleh sesuai dengan apa yang diniatkannya.', source: 'Ṣaḥīḥ al-Bukhārī, hadis no. 1 (permulaan wahyu); juga diriwayatkan Muslim.', message: 'Niat menentukan orientasi dan nilai amal. Keikhlasan dan tujuan yang benar perlu menyertai tindakan sehari-hari.' };
            Object.entries(v).forEach(([k, val]) => $(k).value = val);
            $('verified').checked = false;
            frames = []; renderScenes(); showFrame(); setScenariosOpen(false);
        }

        function clearMaterials() {
            if (!confirm('Kosongkan bahan ayat dan catatan verifikasi?')) return;
            ['topic', 'arabic', 'translation', 'source', 'message', 'takhrij', 'sanad', 'matan', 'context', 'url'].forEach(k => $(k).value = '');
            $('verified').checked = false;
            frames = [];
            renderScenes();
            showFrame();
            setScenariosOpen(false);
        }

        // Skenario diambil dari narasi file Word (Niat dan rutinitas bekerja) yang dialokasikan ke 6 adegan
        const NIAT_SCENES = [
            {
                title:'Penentu Utama',
                visual:'Adegan-1',
                caption:'Niat mengubah nilai tindakan.',
                narration:'Niat adalah penentu utama setiap amal. Tapi bagaimana sebuah niat bisa mengubah drastis nilai tindakan kita? Sayang banget kan kalau lelahnya kita tiap hari menguap begitu saja.'
            },
            {
                title:'Rutinitas Netral',
                visual:'Adegan-2',
                caption:'Bekerja 8 jam: blok aktivitas fisik.',
                narration:'Contohnya bangun pagi dan memeras keringat bekerja 8 jam. Dalam perhitungan spiritual rutinitas ini masuk ke jalur persimpangan sebagai satu blok aktivitas fisik yang sepenuhnya netral.'
            },
            {
                title:'Tanpa Pengarah',
                visual:'Adegan-3',
                caption:'Hanya mengisi wadah duniawi.',
                narration:'Tanpa pengarah, blok ini meluncur dan murni hanya jatuh ke wadah materi duniawi berupa gaji. Sementara timbangan bekal spiritual kita tetap kosong melompong.'
            },
            {
                title:'Tombol Pengalih',
                visual:'Adegan-4',
                caption:'Niat mencari rida Tuhan.',
                narration:'Di sinilah niat hadir sebagai tombol pengalih arah yang aktif saat kita bekerja demi mencari rida Tuhan.'
            },
            {
                title:'Jalur Bercabang',
                visual:'Adegan-5',
                caption:'Duniawi terisi, spiritual menyala.',
                narration:'Dengan tombol niat menyala, blok aktivitas fisik yang sama persis kini melintasi jalur yang berbeda. Alirannya bercabang. Ia tetap mengisi wadah duniawi, namun juga memancarkan cahaya dan mengisi penuh timbangan spiritual.'
            },
            {
                title:'Ibadah Berpahala',
                visual:'Adegan-6',
                caption:'Rutinitas terekam utuh sebagai ibadah.',
                narration:'Lewat satu pengalih arah kecil di hati, rutinitas bekerja 8 jam itu kini terekam utuh sebagai ibadah yang berpahala.'
            }
        ];

        function generate() {
            const topic = $('topic').value.trim(), ar = $('arabic').value.trim(), tr = $('translation').value.trim(), msg = $('message').value.trim();
            if (!ar || !tr || !msg) { alert('Isi teks Arab, terjemahan, dan pesan utama terlebih dahulu.'); return false; }
            const isNiat = ar.includes('الْأَعْمَالُ') && ar.includes('النِّيَّاتِ');
            if (isNiat) frames = NIAT_SCENES.map(f=>({...f}));
            else {
                const titles=['Pembuka','Persoalan','Teks Sumber','Makna dan Konteks','Penerapan','Penutup dan Rujukan'];
                // Visual diganti menjadi Adegan-1, dst agar generik
                const visuals=['Adegan-1','Adegan-2','Adegan-3','Adegan-4','Adegan-5','Adegan-6'];
                const captions=[topic||'Tema pilihan','Mengapa tema ini penting?',tr,msg,'Contoh nyata yang relevan',$('source').value.trim()||'Sumber belum diisi'];
                const narrations=[`Mari memahami ${topic||'tema pilihan'} berdasarkan sumber yang dapat diperiksa.`, 'Apa persoalan yang hendak dijawab oleh teks ini?', `Bacaan dan terjemahannya: ${tr}`, `Pesan utamanya: ${msg}`, 'Berikan contoh yang sesuai dengan konteks dan batasan makna sumber.', `Periksa kembali rujukan: ${$('source').value.trim()||'belum diisi'}.`];
                frames=titles.map((title,i)=>({title,visual:visuals[i],caption:captions[i],narration:narrations[i]}));
            }
            frame=0; renderScenes(); showFrame();
            $('saveStatus').textContent=isNiat?'Enam adegan merupakan adaptasi tematik hadis, bukan transkrip persis video. Cocokkan dengan audio dan visual niat.mp4.':'Enam adegan disusun dari bahan pilihan. Periksa dan sunting sebelum publikasi.';
            return true;
        }

        function renderScenes() {
            if (!frames.length) {
                $('scenes').innerHTML = '<p class="small">Belum ada skenario. Isi bahan dan klik generator.</p>';
                return;
            }
            // Hanya teks visual (Adegan-X) tanpa emoji/durasi, label pill tetap menampilkan durasi
            $('scenes').innerHTML = frames.map((f, i) => `<div class="scene"><div class="visual"><span>${escapeHTML(f.visual)}</span></div><div class="body"><span class="pill">${i * 10}–${(i + 1) * 10} detik</span><label>Judul</label><input aria-label="Judul adegan ${i + 1}" value="${escapeHTML(f.title)}" oninput="editFrame(${i},'title',this.value)"><label>Teks layar</label><textarea class="arabic-text" dir="auto" aria-label="Teks layar adegan ${i + 1}" oninput="editFrame(${i},'caption',this.value)">${escapeHTML(f.caption)}</textarea><label>Narasi</label><textarea aria-label="Narasi adegan ${i + 1}" oninput="editFrame(${i},'narration',this.value)">${escapeHTML(f.narration)}</textarea></div></div>`).join('');
        }

        function editFrame(i, k, v) {
            frames[i][k] = v;
            if (i === frame) showFrame();
        }

        function showFrame() {
            const f = frames[frame];
            $('frameTime').textContent = f ? `ADEGAN ${frame + 1} · ${frame * 10}–${(frame + 1) * 10} DETIK (ESTIMASI)` : 'STORYBOARD · 00–10 DETIK';
            $('frameTitle').textContent = f ? f.title : ($('topic').value || 'Pratinjau Storyboard');
            $('frameArabic').textContent = f && frame === 2 ? $('arabic').value : (!f ? $('arabic').value : '');
            $('frameArabic').style.display = f && frame !== 2 ? 'none' : 'block';
            $('frameCaption').textContent = f ? f.caption : ($('translation').value || 'Masukkan bahan ayat untuk memulai.');
        }

        function nextFrame() {
            if (!frames.length) {
                alert('Susun skenario terlebih dahulu.');
                return;
            }
            frame = (frame + 1) % frames.length;
            showFrame();
        }

        function prevFrame() {
            if (!frames.length) return;
            frame = (frame + frames.length - 1) % frames.length;
            showFrame();
        }

        function togglePlay() {
            if (timer) {
                clearInterval(timer);
                timer = null;
                $('playButton').textContent = 'Putar Storyboard';
                return;
            }
            if (!frames.length) {
                alert('Susun skenario terlebih dahulu.');
                return;
            }
            timer = setInterval(nextFrame, 2500);
            $('playButton').textContent = 'Hentikan Pratinjau';
        }

        $('rubricRows').innerHTML = weights.map(([name, w], i) => `<tr><td>${name}</td><td>${w}%</td><td><input id="score${i}" type="number" min="0" max="100" value="0" oninput="calculate()" aria-label="Skor ${name}"></td></tr>`).join('');

        function calculate() {
            let sum = 0;
            weights.forEach(([, w], i) => {
                const el = $('score' + i);
                let x = Number(el.value);
                if (!Number.isFinite(x)) x = 0;
                x = Math.max(0, Math.min(100, x));
                sum += x * w / 100;
            });
            $('total').textContent = sum.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
            return sum;
        }

        function data() {
            const d = {};
            ids.forEach(k => d[k] = $(k).value);
            d.verified = $('verified').checked;
            d.frames = frames;
            d.scores = weights.map((_, i) => $('score' + i).value);
            return d;
        }

        function saveDraft() {
            try {
                localStorage.setItem('hcca-master-v1', JSON.stringify(data()));
                $('saveStatus').textContent = 'Draf tersimpan pada browser/perangkat ini.';
            } catch (e) {
                $('saveStatus').textContent = 'Penyimpanan browser tidak tersedia. Unduh laporan sebagai cadangan.';
            }
        }

        function restoreDraft() {
            try {
                const d = JSON.parse(localStorage.getItem('hcca-master-v1') || 'null');
                if (!d) {
                    alert('Belum ada draf tersimpan.');
                    return;
                }
                ids.forEach(k => $(k).value = d[k] || '');
                $('verified').checked = !!d.verified;
                frames = Array.isArray(d.frames) ? d.frames : [];
                (d.scores || []).forEach((v, i) => {
                    if ($('score' + i)) $('score' + i).value = v;
                });
                renderScenes();
                frame = 0;
                showFrame();
                calculate();
                $('saveStatus').textContent = 'Draf berhasil dimuat.';
                if (frames.length) setScenariosOpen(true);
            } catch (e) {
                alert('Draf tidak dapat dibaca.');
            }
        }

        function reportText() {
            const d = data();
            return `HADIS CONTENT CREATOR ACADEMY — LAPORAN PRAKTIKUM (STUDI HADIS)\nNama: ${d.student || '-'}\nTema: ${d.topic || '-'}\n\nMATAN ARAB\n${d.arabic}\n\nTERJEMAHAN\n${d.translation}\n\nRUJUKAN\n${d.source}\n\nPESAN\n${d.message}\n\nVERIFIKASI AKADEMIK\nTakhrij hadis: ${d.takhrij || '-'}\nKajian sanad: ${d.sanad || '-'}\nPemeriksaan redaksi: ${d.matan || '-'}\nKonteks: ${d.context || '-'}\nSumber diperiksa: ${d.url || '-'}\nPernyataan verifikasi: ${d.verified ? 'DICENTANG oleh mahasiswa' : 'BELUM DICENTANG'}\n\nSTORYBOARD\n${frames.map((f, i) => `Adegan ${i + 1} (${i * 10}-${(i + 1) * 10} detik): ${f.title}\nTeks layar: ${f.caption}\nNarasi: ${f.narration}`).join('\n\n') || 'Belum dibuat'}\n\nRUBRIK\n${weights.map(([n, w], i) => `${n} (${w}%): ${d.scores[i] || 0}/100`).join('\n')}\nNILAI AKHIR: ${calculate().toFixed(1)}/100\nCatatan: ${d.feedback || '-'}\n\nCatatan: Pemahaman hadis, rujukan syarah hadis, dan penilaian memerlukan pemeriksaan dosen.`;
        }

        function makeReport() {
            $('report').innerHTML = '<pre style="white-space:pre-wrap;overflow-wrap:anywhere;font:13px/1.6 Arial,sans-serif">' + escapeHTML(reportText()) + '</pre>';
        }

        function downloadReport() {
            const blob = new Blob([reportText()], { type: 'text/plain;charset=utf-8' }), url = URL.createObjectURL(blob), a = document.createElement('a');
            a.href = url;
            a.download = 'Laporan_Praktikum_Hadis.txt';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        showFrame();
        calculate();
        setScenariosOpen(false);
    