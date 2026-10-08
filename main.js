document.addEventListener('DOMContentLoaded', () => {
    
    // 1. アイコンの初期化
    if(typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. スプラッシュスクリーン（元の純白のまま。曇りバグは完全に解消）
    const splash = document.getElementById('splash-screen');
    if(splash) {
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => {
                if (splash.parentNode) splash.remove();
                document.body.style.overflow = '';
            }, 800);
        }, 2000); 
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
        header.style.zIndex = '50';
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
        pdfModal.style.zIndex = '9999'; 
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

    // 8. 背景アニメーション（ハニカム幾何学・レイアウト完全保持）
    const initBackgroundAnimation = () => {
        
        // A. Bodyの全画面背景を透明化し、一番奥にアニメーションを敷く準備
        document.body.classList.remove('bg-slate-50', 'bg-white');
        document.body.style.backgroundColor = 'transparent';

        // B. セクションの全幅背景を、中央のコンテンツ枠に移動させる（根本解決）
        // これにより、レイアウトやカードの中身を崩すことなく、左右の余白にだけアニメーションが露出します。
        const mainSections = document.querySelectorAll('main > section');
        mainSections.forEach(sec => {
            // 画像背景や暗い背景のセクションはそのまま維持
            if (sec.classList.contains('bg-slate-900') || sec.classList.contains('bg-sky-900')) return;

            const hasBgWhite = sec.classList.contains('bg-white');
            const hasBgSlate = sec.classList.contains('bg-slate-50');

            if (hasBgWhite || hasBgSlate) {
                // セクションの全幅背景と境界線を削除
                sec.classList.remove('bg-white', 'bg-slate-50', 'border-t', 'border-slate-200');
                sec.style.backgroundColor = 'transparent';

                // 直下の中央寄せコンテナを取得
                const container = sec.querySelector('.max-w-7xl, .max-w-4xl, .max-w-3xl, .max-w-5xl');
                if (container) {
                    // 背景色をコンテナ側に移す
                    if (hasBgWhite) container.classList.add('bg-white');
                    if (hasBgSlate) container.classList.add('bg-slate-50');
                    
                    // コンテナに背景が付くため、内側に余白を持たせてレイアウトを美しく保つ
                    container.classList.add('py-12', 'px-6', 'sm:px-10', 'rounded-md', 'shadow-sm');
                    
                    // セクション側の無駄に広すぎた余白を削り、シャープに整える
                    sec.classList.remove('py-20', 'py-24');
                    sec.classList.add('py-12');
                }
            }
        });

        // 念のためメインコンテンツを手前に固定
        const main = document.querySelector('main');
        if (main) {
            main.style.position = 'relative';
            main.style.zIndex = '10';
        }
        const footer = document.querySelector('footer');
        if (footer) {
            footer.style.position = 'relative';
            footer.style.zIndex = '10';
        }

        // C. Canvas背景の生成
        const canvas = document.createElement('canvas');
        canvas.id = 'geometric-bg';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-1'; 
        
        document.body.prepend(canvas); 

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

            // Canvas自体の背景色（清潔感のあるごく僅かなライトグレー）
            ctx.fillStyle = '#f8fafc'; 
            ctx.fillRect(0, 0, width, height);

            // 六角形グリッドの移動速度
            cameraX += 0.4;
            cameraY += 0.2;

            // 六角形のサイズ（視覚的にハッキリ認識できる大きさ）
            const r = 50; 
            const xSpacing = r * 1.5;
            const ySpacing = Math.sqrt(3) * r;

            const startCol = Math.floor(cameraX / xSpacing) - 1;
            const endCol = startCol + Math.ceil(width / xSpacing) + 2;
            const startRow = Math.floor(cameraY / ySpacing) - 1;
            const endRow = startRow + Math.ceil(height / ySpacing) + 2;

            ctx.beginPath();
            for (let col = startCol; col <= endCol; col++) {
                for (let row = startRow; row <= endRow; row++) {
                    let x = col * xSpacing - cameraX;
                    let y = row * ySpacing - cameraY;
                    
                    if (col % 2 !== 0) y += ySpacing / 2;

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
            
            // はっきりと見えるスカイブルーの線
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.3)';
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
