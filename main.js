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
    /* main.js の末尾に以下を追記 */

    /* STREAMING_CHUNK:PDF Viewer Control */
    // 7. ウェブカタログ (PDF.js) の制御
    const pdfModal = document.getElementById('pdf-modal');
    const pdfTrigger = document.getElementById('open-catalog-btn');
    const pdfClose = document.getElementById('pdf-close');
    const pdfCanvas = document.getElementById('pdf-canvas');
    const pdfLoading = document.getElementById('pdf-loading');
    const pdfCtx = pdfCanvas ? pdfCanvas.getContext('2d') : null;
    
    let pdfDoc = null;
    let pageNum = 1;
    let pageRendering = false;
    let pageNumPending = null;
    const scale = 1.5; // 画質調整（数値を上げると高画質になりますが重くなります）

    if(pdfTrigger && pdfModal && typeof pdfjsLib !== 'undefined') {
        // PDF.jsのWorkerを設定
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

        // ※注意※ 前回修正した英数字のファイル名を指定してください
        const url = 'catalog.pdf'; 

        // 指定されたページを描画する関数
        const renderPage = (num) => {
            pageRendering = true;
            pdfLoading.classList.remove('hidden'); // ローディング表示

            pdfDoc.getPage(num).then((page) => {
                const viewport = page.getViewport({scale: scale});
                pdfCanvas.height = viewport.height;
                pdfCanvas.width = viewport.width;

                const renderContext = {
                    canvasContext: pdfCtx,
                    viewport: viewport
                };
                const renderTask = page.render(renderContext);

                renderTask.promise.then(() => {
                    pageRendering = false;
                    pdfLoading.classList.add('hidden'); // ローディング非表示
                    if (pageNumPending !== null) {
                        renderPage(pageNumPending);
                        pageNumPending = null;
                    }
                });
            });
            document.getElementById('pdf-page-num').textContent = num;
        };

        const queueRenderPage = (num) => {
            if (pageRendering) {
                pageNumPending = num;
            } else {
                renderPage(num);
            }
        };

        // 前のページへ
        const onPrevPage = () => {
            if (pageNum <= 1) return;
            pageNum--;
            queueRenderPage(pageNum);
        };

        // 次のページへ
        const onNextPage = () => {
            if (pageNum >= pdfDoc.numPages) return;
            pageNum++;
            queueRenderPage(pageNum);
        };

        // クリックイベントの登録（画面の左右クリック）
        document.getElementById('pdf-prev-zone').addEventListener('click', onPrevPage);
        document.getElementById('pdf-next-zone').addEventListener('click', onNextPage);

        // モーダルを開く処理
        pdfTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            pdfModal.classList.remove('hidden');
            // アニメーション発火用のハック
            void pdfModal.offsetWidth;
            pdfModal.classList.add('opacity-100');

            // 初回のみPDFを読み込む（メモリ節約）
            if (!pdfDoc) {
                pdfjsLib.getDocument(url).promise.then((pdfDoc_) => {
                    pdfDoc = pdfDoc_;
                    document.getElementById('pdf-page-count').textContent = pdfDoc.numPages;
                    renderPage(pageNum);
                }).catch(err => {
                    console.error('PDF Load Error: ', err);
                    alert('カタログファイルの読み込みに失敗しました。ファイル名が間違っていないか確認してください。');
                    pdfLoading.classList.add('hidden');
                });
            }
        });

        // モーダルを閉じる処理
        const closeModal = () => {
            pdfModal.classList.remove('opacity-100');
            setTimeout(() => pdfModal.classList.add('hidden'), 300);
        };
        
        pdfClose.addEventListener('click', closeModal);
    }
});
