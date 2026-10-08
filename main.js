document.addEventListener('DOMContentLoaded', () => {
    
    // 1. アイコンの初期化
    if(typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. スプラッシュスクリーンの制御
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

    // 8. 背景アニメーション（ノイズゼロのウェーブ・波紋表現）
    const initBackgroundAnimation = () => {
        // --- A. コンテンツ背景のすりガラス化（維持） ---
        const bgElements = document.querySelectorAll('.bg-white, .bg-slate-50');
        bgElements.forEach(el => {
            if (el.tagName.toLowerCase() === 'footer' || el.closest('footer')) return;
            if (el.id === 'main-header' || el.closest('#main-header')) return;
            if (el.id === 'mobile-menu') return;
            
            el.classList.remove('bg-white');
            el.classList.remove('bg-slate-50');
            
            // ガラスの質感を高めるため、不透明度を調整
            el.style.backgroundColor = 'rgba(255, 255, 255, 0.82)';
            el.style.backdropFilter = 'blur(12px)';
            el.style.WebkitBackdropFilter = 'blur(12px)'; 
        });

        // --- B. Canvasの生成（ウェーブ描画用） ---
        const canvas = document.createElement('canvas');
        canvas.id = 'wave-bg';
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none';
        canvas.style.zIndex = '-1';
        canvas.style.transition = 'opacity 1.5s ease';
        canvas.style.opacity = '0';
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let width, height;
        let time = 0;

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        // --- C. ウェーブ（波）の設定 ---
        // フィルムが重なり合うように、速度・振幅・色の違う3つの波を定義
        const waves = [
            { 
                ampMultiplier: 1.0,  // 振幅の大きさ
                wavelength: 0.001,   // 波の長さ（小さいほど緩やか）
                speed: 0.004,        // 動くスピード
                color: 'rgba(2, 132, 199, 0.1)', // 奥の波（少し濃いSky）
                offsetY: 0.55        // 基準となる高さ（画面の55%の位置）
            },
            { 
                ampMultiplier: 1.3, 
                wavelength: 0.0015, 
                speed: 0.002, 
                color: 'rgba(14, 165, 233, 0.08)', // 中間の波
                offsetY: 0.65 
            },
            { 
                ampMultiplier: 0.8, 
                wavelength: 0.0008, 
                speed: 0.005, 
                color: 'rgba(56, 189, 248, 0.12)', // 手前の波
                offsetY: 0.75 
            }
        ];

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            // 全体の背景グラデーション（白 〜 極薄い水色）
            const gradient = ctx.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#f0f9ff'); 
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            time += 1;

            // 画面サイズに応じて波の高さを動的に調整
            const baseAmplitude = height * 0.12;

            // 3つの波を描画
            waves.forEach(wave => {
                ctx.beginPath();
                ctx.moveTo(0, height); // 左下からスタート
                
                // サインカーブ（曲線の計算）
                for (let x = 0; x <= width; x += 15) {
                    const y = (height * wave.offsetY) + Math.sin(x * wave.wavelength + time * wave.speed) * (baseAmplitude * wave.ampMultiplier);
                    ctx.lineTo(x, y);
                }
                
                ctx.lineTo(width, height); // 右下へ
                ctx.closePath();
                
                ctx.fillStyle = wave.color;
                ctx.fill();
            });

            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        
        resize();
        animate();

        setTimeout(() => {
            canvas.style.opacity = '1';
        }, 500);
    };

    initBackgroundAnimation();
});
