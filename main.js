document.addEventListener('DOMContentLoaded', () => {
    
    // 1. アイコンの初期化 (Lucide VanillaJS)
    if(typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // 2. スプラッシュスクリーンの制御 (index.html用)
    const splash = document.getElementById('splash-screen');
    if(splash) {
        // スプラッシュ表示中はスクロールを完全にロック
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            splash.classList.add('fade-out');
            setTimeout(() => {
                splash.remove();
                // スプラッシュ終了と同時にスクロールロックを解除
                document.body.style.overflow = '';
            }, 800);
        }, 2200); // 体感速度を上げるため、少しだけ待機時間を短縮
    }

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
    let isMobile = false; 

    if(pdfTrigger && pdfModal && typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        
        const url = 'catalog.pdf'; // ※ご自身のファイル名に合わせてください

        const checkMobile = () => window.matchMedia('(max-width: 768px)').matches;

        const buildLayoutMap = (totalPages) => {
            layoutStates = [];
            isMobile = checkMobile();

            if (isMobile) {
                for (let i = 1; i <= totalPages; i++) {
                    layoutStates.push([i]);
                }
            } else {
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
                const currentScale = isMobile ? 1.5 : 2.5;

                for (let i = 0; i < pagesToRender.length; i++) {
                    const pageNum = pagesToRender[i];
                    const page = await pdfDoc.getPage(pageNum);
                    const viewport = page.getViewport({ scale: currentScale });
                    
                    const isSpread = pagesToRender.length === 2;
                    
                    const wrapper = document.createElement('div');
                    if (isSpread) {
                        wrapper.className = (i === 0)
                            ? 'w-1/2 h-full flex justify-end items-center'
                            : 'w-1/2 h-full flex justify-start items-center';
                    } else {
                        wrapper.className = 'w-full h-full flex justify-center items-center';
                    }

                    const canvas = document.createElement('canvas');
                    canvas.className = 'max-w-full max-h-full object-contain bg-white shadow-xl transition-opacity duration-500';
                    
                    if (isSpread && i === 0) {
                        canvas.classList.add('border-r', 'border-slate-300');
                    }

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
                if (wasMobile !== isMobile) {
                    currentStateIndex = 0;
                }
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

    // 8. 背景アニメーション（ポリマー・ネットワーク風）
    const initBackgroundAnimation = () => {
        const canvas = document.createElement('canvas');
        canvas.id = 'network-bg';
        
        // 【修正】Tailwind CDNに依存せず、インラインスタイルで確実に付与する
        // これにより、画面の操作がブロックされる（フリーズする）バグを完全に回避します
        canvas.style.position = 'fixed';
        canvas.style.top = '0';
        canvas.style.left = '0';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.pointerEvents = 'none'; // 【重要】これでクリックやスクロールを貫通させます
        canvas.style.zIndex = '0';           // 白い背景の下（奥）に配置
        canvas.style.transition = 'opacity 1s ease';
        canvas.style.opacity = '0';
        
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        // サイトのテーマカラーに合わせた設定
        const particleColor = 'rgba(14, 165, 233, 0.2)'; // sky-500
        const lineColor = 'rgba(148, 163, 184, 0.15)';   // slate-400
        const connectionDistance = 150; 

        const resize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = (Math.random() - 0.5) * 0.3;
                this.radius = Math.random() * 1.5 + 0.5;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = particleColor;
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            const particleCount = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 25000), 80);
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();
                
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist < connectionDistance) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        const opacity = 1 - (dist / connectionDistance);
                        ctx.strokeStyle = lineColor.replace('0.15', (0.15 * opacity).toFixed(2));
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', () => {
            resize();
            initParticles();
        });

        resize();
        initParticles();
        animate();

        setTimeout(() => {
            canvas.style.opacity = '1';
        }, 300);
    };

    // 実行
    initBackgroundAnimation();
});
