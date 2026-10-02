document.addEventListener('DOMContentLoaded', () => {
    
    /* STREAMING_CHUNK:Icon Initialization */
    // 1. アイコンの初期化 (Lucide VanillaJS)
    if(typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    /* STREAMING_CHUNK:Splash Screen Control */
    // 2. スプラッシュスクリーンの制御 (index.html用)
    const splash = document.getElementById('splash-screen');
    if(splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 800);
        }, 2500);
    }

    /* STREAMING_CHUNK:Scroll Animation Observer */
    // 3. スクロールアニメーション (Intersection Observer)
    const observerOptions = {
        threshold: 0.1, 
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    document.querySelectorAll('.animate-on-scroll:not(.visible)').forEach(el => {
        observer.observe(el);
    });

    /* STREAMING_CHUNK:Accordion UI Control */
    // 4. アコーディオンUIの制御
    document.querySelectorAll('.accordion-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if(e.target.tagName !== 'A') e.preventDefault();
            
            const content = btn.nextElementSibling;
            const icon = btn.querySelector('.chevron-icon');
            
            if(content && content.classList.contains('accordion-content')) {
                content.classList.toggle('hidden');
                if(icon) icon.classList.toggle('rotate-180');
            }
        });
    });

    /* STREAMING_CHUNK:Mobile Menu Control */
    // 5. モバイルメニューの制御
    const mobileBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    const iconOpen = document.getElementById('menu-icon-open');
    const iconClose = document.getElementById('menu-icon-close');

    if(mobileBtn && mobileMenu) {
        mobileBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
            
            if(iconOpen && iconClose) {
                iconOpen.classList.toggle('hidden');
                iconClose.classList.toggle('hidden');
            }
        });
    }

    /* STREAMING_CHUNK:Header Scroll Effect */
    // 6. ヘッダーのスクロール時のスタイル変更
    const header = document.getElementById('main-header');
    if(header) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 10) {
                header.classList.add('bg-white/95', 'backdrop-blur-sm', 'shadow-sm', 'border-slate-200');
                header.classList.remove('border-transparent');
            } else {
                header.classList.remove('bg-white/95', 'backdrop-blur-sm', 'shadow-sm', 'border-slate-200');
                header.classList.add('border-transparent');
            }
        });
   }
    /* main.js */

    /* STREAMING_CHUNK:PDF Viewer Control */
    // 7. ウェブカタログ (PDF.js) の制御（レスポンシブ・見開き対応版）
    const pdfModal = document.getElementById('pdf-modal');
    const pdfTrigger = document.getElementById('open-catalog-btn');
    const pdfClose = document.getElementById('pdf-close');
    const pdfContainer = document.getElementById('pdf-container');
    const pdfLoading = document.getElementById('pdf-loading');
    
    let pdfDoc = null;
    let layoutStates = []; 
    let currentStateIndex = 0;
    let pageRendering = false;
    let isMobile = false; // スマホ判定フラグ

    if(pdfTrigger && pdfModal && typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const url = 'catalog.pdf'; // ※ご自身のファイル名に合わせてください

        // 画面幅からスマホ（768px以下）かどうかを判定
        const checkMobile = () => window.matchMedia('(max-width: 768px)').matches;

        // スマホなら1ページごと、PCなら見開きでマップを生成
        const buildLayoutMap = (totalPages) => {
            layoutStates = [];
            isMobile = checkMobile();

            if (isMobile) {
                // スマホ：全ページを1枚ずつ表示
                for (let i = 1; i <= totalPages; i++) {
                    layoutStates.push([i]);
                }
            } else {
                // PC：表紙(1) + 見開き(2,3...) + 裏表紙
                layoutStates.push([1]); 
                for (let i = 2; i <= totalPages - 1; i += 2) {
                    if (i + 1 <= totalPages) {
                        layoutStates.push([i, i + 1]); 
                    } else {
                        layoutStates.push([i]);
                    }
                }
                if (totalPages > 1 && totalPages % 2 === 0) {
                    layoutStates.push([totalPages]);
                }
            }
        };

        const renderState = async (stateIndex) => {
            if (pageRendering) return;
            pageRendering = true;
            pdfLoading.classList.remove('hidden');
            
            pdfContainer.innerHTML = '';
            
            const pagesToRender = layoutStates[stateIndex];
            document.getElementById('pdf-page-num').textContent = pagesToRender.join(' - ');

            try {
                // スマホ時はメモリ負荷とクラッシュ防止のためスケールを1.5に最適化
                const currentScale = isMobile ? 1.5 : 2.5;

                for (let i = 0; i < pagesToRender.length; i++) {
                    const pageNum = pagesToRender[i];
                    const page = await pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: currentScale });
                    
                    const canvas = document.createElement('canvas');
                    const isSpread = pagesToRender.length === 2;
                    canvas.className = isSpread 
                        ? 'max-h-full w-auto max-w-[50%] object-contain bg-white shadow-md transition-opacity duration-500'
                        : 'max-h-full w-auto max-w-full object-contain bg-white shadow-md transition-opacity duration-500';
                    
                    // 見開きの左側（偶数ページ）のみ境界線をつける
                    if (isSpread && i === 0) {
                        canvas.classList.add('border-r', 'border-slate-300');
                    }

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    const ctx = canvas.getContext('2d');
                    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                    
                    pdfContainer.appendChild(canvas);
                }
            } catch (error) {
                console.error('Page rendering failed:', error);
            }

            pageRendering = false;
            pdfLoading.classList.add('hidden');
        };

        const onPrevPage = () => {
            if (currentStateIndex <= 0 || pageRendering) return;
            currentStateIndex--;
            renderState(currentStateIndex);
        };

        const onNextPage = () => {
            if (currentStateIndex >= layoutStates.length - 1 || pageRendering) return;
            currentStateIndex++;
            renderState(currentStateIndex);
        };

        document.getElementById('pdf-prev-zone').addEventListener('click', onPrevPage);
        document.getElementById('pdf-next-zone').addEventListener('click', onNextPage);

        // モーダルを開く
        pdfTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            pdfModal.classList.remove('hidden');
            void pdfModal.offsetWidth;
            pdfModal.classList.add('opacity-100');
            document.body.style.overflow = 'hidden'; 

            if (!pdfDoc) {
                const loadingTask = pdfjsLib.getDocument({
                    url: url,
                    cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
                    cMapPacked: true
                });

                loadingTask.promise.then((pdfDoc_) => {
                    pdfDoc = pdfDoc_;
                    document.getElementById('pdf-page-count').textContent = pdfDoc.numPages;
                    buildLayoutMap(pdfDoc.numPages);
                    renderState(currentStateIndex);
                }).catch(err => {
                    console.error('PDF Load Error: ', err);
                    alert('カタログの読み込みに失敗しました。');
                    pdfLoading.classList.add('hidden');
                });
            } else {
                // 2回目以降開く時、画面サイズが変わっていたら再計算して1ページ目に戻す
                const wasMobile = isMobile;
                buildLayoutMap(pdfDoc.numPages);
                if (wasMobile !== isMobile) {
                    currentStateIndex = 0;
                }
                renderState(currentStateIndex);
            }
        });

        // 画面リサイズ（スマホの横持ち切り替えなど）時の再描画ロジック
        window.addEventListener('resize', () => {
            if (!pdfModal.classList.contains('hidden') && pdfDoc && !pageRendering) {
                const wasMobile = isMobile;
                buildLayoutMap(pdfDoc.numPages);
                // PC⇔スマホのブレイクポイントを跨いだ時だけ再描画を実行
                if (wasMobile !== isMobile) {
                    currentStateIndex = 0;
                    renderState(currentStateIndex);
                }
            }
        });

        const closeModal = () => {
            pdfModal.classList.remove('opacity-100');
            document.body.style.overflow = ''; 
            setTimeout(() => pdfModal.classList.add('hidden'), 300);
        };
        
        pdfClose.addEventListener('click', closeModal);
    }
           });
