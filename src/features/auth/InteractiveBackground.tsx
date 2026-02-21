import React, { useRef, useEffect } from 'react';

const InteractiveBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !containerRef.current) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;

        let width: number, height: number;
        let mouse: { x: number | null, y: number | null } = { x: null, y: null };

        // Configuration
        const particleCount = 40;
        const connectionDistance = 150;
        const mouseDistance = 200;
        const color = '#0bc16a'; // Primary Green

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            baseSize: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5;
                this.size = Math.random() * 2 + 1;
                this.baseSize = this.size;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                // Bounce off edges
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Mouse interaction
                if (mouse.x != null && mouse.y != null) {
                    let dx = mouse.x - this.x;
                    let dy = mouse.y - this.y;
                    let distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseDistance) {
                        const forceDirectionX = dx / distance;
                        const forceDirectionY = dy / distance;
                        const force = (mouseDistance - distance) / mouseDistance;
                        const directionX = forceDirectionX * force * 3; // Push strength
                        const directionY = forceDirectionY * force * 3;

                        this.vx -= directionX * 0.05;
                        this.vy -= directionY * 0.05;
                    }
                }
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.6;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        let particles: Particle[] = [];

        const init = () => {
            resize();
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const resize = () => {
            if (!containerRef.current || !canvas) return;
            width = containerRef.current.clientWidth;
            height = containerRef.current.clientHeight;
            canvas.width = width;
            canvas.height = height;
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                // Draw connections
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.globalAlpha = 1 - (distance / connectionDistance);
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }

                // Draw mouse connections (duplication effect simulation)
                if (mouse.x != null && mouse.y != null) {
                    const dx = particles[i].x - mouse.x;
                    const dy = particles[i].y - mouse.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.globalAlpha = (1 - (distance / mouseDistance)) * 0.5;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouse.x, mouse.y); // Connect to mouse cursor
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!canvas) return;
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const handleMouseLeave = () => {
            mouse.x = null;
            mouse.y = null;
        };

        window.addEventListener('resize', resize);
        // Canvas interactions
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', handleMouseLeave);

        init();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            if (canvas) {
                canvas.removeEventListener('mousemove', handleMouseMove);
                canvas.removeEventListener('mouseleave', handleMouseLeave);
            }
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div ref={containerRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}>
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    pointerEvents: 'auto'
                }}
            />
        </div>
    );
};

const InteractiveBackgroundFixed = () => {
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
        const particleCount = 60;
        const connectionDistance = 140;
        const mouseDistance = 180;
        const color = '#0bc16a';

        canvas.width = width;
        canvas.height = height;

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 1;
                this.vy = (Math.random() - 0.5) * 1;
                this.size = Math.random() * 2 + 1;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Mouse Repel/Attract Effect
                if (mouse.x != null && mouse.y != null) {
                    const dx = mouse.x - this.x;
                    const dy = mouse.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseDistance) {
                        // Logic handled in draw loop
                    }
                }
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        let particles: Particle[] = [];

        const init = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            // Draw particles and connections
            for (let i = 0; i < particles.length; i++) {
                particles[i].update();
                particles[i].draw();

                // Connections
                for (let j = i; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < connectionDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.globalAlpha = 1 - (distance / connectionDistance);
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }

                // Interactive "Duplication/Web" effect on hover
                if (mouse.x != null && mouse.y != null) {
                    const dx = particles[i].x - mouse.x;
                    const dy = particles[i].y - mouse.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < mouseDistance) {
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.globalAlpha = 0.2;
                        ctx.lineWidth = 1;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(mouse.x, mouse.y);
                        ctx.stroke();

                        // "Duplicate" effect 
                        ctx.beginPath();
                        ctx.strokeStyle = color;
                        ctx.globalAlpha = 0.1;
                        ctx.arc(particles[i].x, particles[i].y, particles[i].size * 4, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        const handleResize = () => {
            if (!canvas) return;
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
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 0,
                pointerEvents: 'none',
                background: 'transparent'
            }}
        />
    );
};

export default InteractiveBackgroundFixed;

