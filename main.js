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

    // 7. 六角形（ハニカム）背景アニメーション
    // HTML操作は一切行わず、Canvasを最背面(z-index: -1)に生成するだけです。
    const initBackgroundAnimation = () => {
        const canvas = document.createElement('canvas');
        canvas.id = 'geometric-bg';
        canvas.className = 'fixed inset-0 pointer-events-none z-[-1]';
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

            // 背景色（純白よりもごく僅かにグレーを入れて、コンテンツの白カードを目立たせる）
            ctx.fillStyle = '#f8fafc'; 
            ctx.fillRect(0, 0, width, height);

            // スクロール速度
            cameraX += 0.3;
            cameraY += 0.15;

            // 六角形のサイズ
            const r = 55; 
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
            
            // クッキリとしたスカイブルーの線
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
