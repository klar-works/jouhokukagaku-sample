document.addEventListener('DOMContentLoaded', () => {
    
    // 1. アイコンの初期化
    if(typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. スプラッシュスクリーンの制御（★元のアニメーションに完全復旧）
    const splash = document.getElementById('splash-screen');
    if(splash) {
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => splash.remove(), 800);
        }, 2500);
    }

    // 3. スクロールアニメーション
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

    // 4. アコーディオンUI
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

    // 5. モバイルメニュー
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

    // 7. ウェブカタログ (PDF.js)
    const pdfModal = document.getElementById('pdf-modal');
    const pdfTrigger = document.getElementById('open-catalog-btn');
    const pdfClose = document.getElementById('pdf-close');
    const pdfContainer = document.getElementById('pdf-container');
    const pdfLoading = document.getElementById('pdf-loading');
    
    let pdfDoc = null;
    let layoutStates = []; 
    let currentStateIndex = 0;
    let pageRendering = false;
    let isMobile = false; 

    if(pdfTrigger && pdfModal && typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const url = 'catalog.pdf'; 

        const checkMobile = () => window.matchMedia('(max-width: 768px)').matches;

        const buildLayoutMap = (totalPages) => {
            layoutStates = [];
            isMobile = checkMobile();
            if (isMobile) {
                for (let i = 1; i <= totalPages; i++) layoutStates.push([i]);
            } else {
                layoutStates.push([1]); 
                for (let i = 2; i <= totalPages - 1; i += 2) {
                    if (i + 1 <= totalPages) layoutStates.push([i, i + 1]); 
                    else layoutStates.push([i]);
                }
                if (totalPages > 1 && totalPages % 2 === 0) layoutStates.push([totalPages]);
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
                const currentScale = isMobile ? 1.5 : 2.5;
                for (let i = 0; i < pagesToRender.length; i++) {
                    const pageNum = pagesToRender[i];
                    const page = await pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: currentScale });
                    const isSpread = pagesToRender.length === 2;
                    
                    const wrapper = document.createElement('div');
                    wrapper.className = isSpread 
                        ? (i === 0 ? 'w-1/2 h-full flex justify-end items-center' : 'w-1/2 h-full flex justify-start items-center') 
                        : 'w-full h-full flex justify-center items-center';

                    const canvas = document.createElement('canvas');
                    canvas.className = 'max-w-full max-h-full object-contain bg-white shadow-xl transition-opacity duration-500';
                    if (isSpread && i === 0) canvas.classList.add('border-r', 'border-slate-300');

                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    const ctx = canvas.getContext('2d');
                    await page.render({ canvasContext: ctx, viewport: viewport }).promise;
                    
                    wrapper.appendChild(canvas);
                    pdfContainer.appendChild(wrapper);
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
                const wasMobile = isMobile;
                buildLayoutMap(pdfDoc.numPages);
                if (wasMobile !== isMobile) currentStateIndex = 0;
                renderState(currentStateIndex);
            }
        });

        window.addEventListener('resize', () => {
            if (!pdfModal.classList.contains('hidden') && pdfDoc && !pageRendering) {
                const wasMobile = isMobile;
                buildLayoutMap(pdfDoc.numPages);
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

    // 8. 背景アニメーション（六角形の幾何学・分子構造グリッド）
    const initBackgroundAnimation = () => {
        // --- A. スプラッシュを壊さない安全な透過処理 ---
        // mainタグ直下のsectionのみを対象にし、オープニング画面(#splash-screen)やヘッダーを厳密に除外
        const bgElements = document.querySelectorAll('main > section.bg-white, main > section.bg-slate-50');
        bgElements.forEach(el => {
            el.classList.remove('bg-white', 'bg-slate-50');
            el.style.backgroundColor = 'rgba(255, 255, 255, 0.92)'; // 92%の不透明度で非常に読みやすく
            el.style.backdropFilter = 'blur(4px)'; 
            el.style.WebkitBackdropFilter = 'blur(4px)';
        });

        // --- B. Canvasの生成 ---
        const canvas = document.createElement('canvas');
        canvas.id = 'geometric-bg';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-1';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let width, height;
        let cameraX = 0;
        let cameraY = 0;

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // 背景は純粋でクリーンな「白」
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, width, height);

            // カメラ（視点）を斜めにゆっくり移動させる
            cameraX += 0.4;
            cameraY += 0.2;

            // 六角形のサイズ設定
            const r = 45; 
            const xSpacing = r * 1.5;
            const ySpacing = Math.sqrt(3) * r;

            // 画面に映る範囲のみを計算して描画（パフォーマンス最適化）
            const startCol = Math.floor(cameraX / xSpacing) - 1;
            const endCol = startCol + Math.ceil(width / xSpacing) + 2;
            const startRow = Math.floor(cameraY / ySpacing) - 1;
            const endRow = startRow + Math.ceil(height / ySpacing) + 2;

            ctx.beginPath();
            for (let col = startCol; col <= endCol; col++) {
                for (let row = startRow; row <= endRow; row++) {
                    let x = col * xSpacing - cameraX;
                    let y = row * ySpacing - cameraY;
                    
                    // 列ごとに高さをずらしてハニカム構造を作る
                    if (col % 2 !== 0) y += ySpacing / 2;

                    // 六角形を1つ描く
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * 60) * Math.PI / 180;
                        const px = x + r * Math.cos(angle);
                        const py = y + r * Math.sin(angle);
                        if (i === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.closePath();
                }
            }
            
            // 視覚的にはっきりと認識できる色（スカイブルー、少し濃いめ）
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();
    };

    initBackgroundAnimation();
});
