import React, { useRef, useEffect } from 'react';

const InteractiveBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        let mouse: { x: number | null, y: number | null } = { x: null, y: null };
        let animationFrameId: number;

        // Configuration
        const shardCount = 25;
        const connectionDistance = 250;
        const mouseDistance = 300;
        // Brand Primary Color: #d97757
        const primaryColor = '#d97757';

        canvas.width = width;
        canvas.height = height;

        class Shard {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            rotation: number;
            rotationSpeed: number;
            opacity: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
                this.size = Math.random() * 20 + 10;
                this.rotation = Math.random() * Math.PI * 2;
                this.rotationSpeed = (Math.random() - 0.5) * 0.01;
                this.opacity = Math.random() * 0.3 + 0.1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;
                this.rotation += this.rotationSpeed;

                // Bounce with smoothness
                if (this.x < -this.size) this.x = width + this.size;
                if (this.x > width + this.size) this.x = -this.size;
                if (this.y < -this.size) this.y = height + this.size;
                if (this.y > height + this.size) this.y = -this.size;

                // Mouse Repel
                if (mouse.x != null && mouse.y != null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseDistance) {
                        const force = (mouseDistance - distance) / mouseDistance;
                        this.vx -= (dx / distance) * force * 0.02;
                        this.vy -= (dy / distance) * force * 0.02;
                    }
                }
                
                // Max speed cap
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (speed > 2) {
                    this.vx *= 0.99;
                    this.vy *= 0.99;
                }
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                
                ctx.fillStyle = primaryColor;
                ctx.globalAlpha = this.opacity;
                
                // Draw a Sharp Rectangle (Shard)
                ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size * 0.6);
                
                // Stroke for some shards
                if (this.size > 20) {
                    ctx.strokeStyle = primaryColor;
                    ctx.globalAlpha = this.opacity * 0.5;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(-this.size/2, -this.size/2, this.size, this.size * 0.6);
                }
                
                ctx.restore();
            }
        }

        let shards: Shard[] = [];

        const init = () => {
            shards = [];
            for (let i = 0; i < shardCount; i++) {
                shards.push(new Shard());
            }
        };

        const drawGrid = () => {
            if (!ctx) return;
            const gridSize = 80;
            ctx.beginPath();
            ctx.strokeStyle = primaryColor;
            ctx.lineWidth = 0.5;
            
            // Adjust opacity based on theme but we'll use a very low constant for subtle feel
            ctx.globalAlpha = 0.03;

            // Vertical lines
            for (let x = 0; x <= width; x += gridSize) {
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height);
            }

            // Horizontal lines
            for (let y = 0; y <= height; y += gridSize) {
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
            }
            ctx.stroke();
            
            // Small dots at intersections
            ctx.globalAlpha = 0.1;
            for (let x = 0; x <= width; x += gridSize) {
                for (let y = 0; y <= height; y += gridSize) {
                    ctx.fillRect(x - 1, y - 1, 2, 2);
                }
            }
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            drawGrid();

            // Connections
            for (let i = 0; i < shards.length; i++) {
                shards[i].update();
                shards[i].draw();

                for (let j = i + 1; j < shards.length; j++) {
                    const dx = shards[i].x - shards[j].x;
                    const dy = shards[i].y - shards[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = primaryColor;
                        // Use higher alpha for connections to look like structure
                        ctx.globalAlpha = (1 - (distance / connectionDistance)) * 0.15;
                        ctx.lineWidth = 0.8;
                        ctx.moveTo(shards[i].x, shards[i].y);
                        ctx.lineTo(shards[j].x, shards[j].y);
                        ctx.stroke();
                    }
                }
                
                // Interact with mouse
                if (mouse.x != null && mouse.y != null) {
                    const dx = shards[i].x - mouse.x;
                    const dy = shards[i].y - mouse.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = primaryColor;
                        ctx.globalAlpha = (1 - (distance / mouseDistance)) * 0.08;
                        ctx.moveTo(shards[i].x, shards[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            init();
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);

        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            zIndex: 0, 
            pointerEvents: 'none',
            overflow: 'hidden'
        }}>
            {/* Grain Overlay */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                opacity: 0.04,
                zIndex: 1,
                pointerEvents: 'none'
            }} />
            
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    background: 'transparent'
                }}
            />
        </div>
    );
};

export default InteractiveBackground;

