// ====================================
// QUADTREE GRID SYSTEM
// ====================================

// ====================================
// ANIMATION CONFIGURATION
// Tweak these values to customize the quadtree animation behavior
// ====================================
const QUADTREE_CONFIG = {
    // Subdivision behavior
    subdivision: {
        varianceStrength: 0.3,          // Organic variance in subdivision (0-1, higher = more irregular)
        depthThresholdReduction: 0.2,   // How much proximity threshold reduces per depth level (0-1)
        skipChanceBase: 0.2,            // Base probability of skipping subdivision (0-1)
        skipChancePerDepth: 0.1,        // Additional skip chance per depth level (0-1)
    },

    // Shape and gradient controls for refined regions
    shape: {
        // Shape type: 'circular', 'elliptical', 'rectangular', 'squircle'
        type: 'circular',

        // Elliptical shape parameters (only used if type is 'elliptical')
        aspectRatio: 1.5,               // Width/height ratio (1.0 = circular, >1 = wider, <1 = taller)
        rotation: 0,                    // Rotation in degrees (0-360)

        // Rectangular/Squircle parameters (used for 'rectangular' and 'squircle')
        cornerRadius: 0.3,              // How rounded the corners are (0-1, only for 'squircle')

        // Gradient/falloff type: 'linear', 'quadratic', 'exponential', 'smooth', 'inverse'
        gradient: 'smooth',

        // Gradient parameters
        gradientSteepness: 2.0,         // How quickly density falls off (>1 = steeper, <1 = gentler)
        innerRadius: 0.3,               // Core region with max density (0-1, proportion of threshold)
        outerRadius: 1.0,               // Edge of influence (0-2, proportion of threshold)
    },

    // Cell rendering
    rendering: {
        depthMultiplierMin: 0.25,       // Minimum opacity multiplier for cells (0-1)
        depthMultiplierMax: 0.35,       // Maximum opacity multiplier for cells (0-1)
        lineOpacityMin: 0.3,            // Minimum grid line opacity (0-1)
        lineOpacityMax: 0.4,            // Maximum grid line opacity (0-1)
    },

    // Animation & fade
    animation: {
        fadeRateBase: 0.015,            // Base fade rate for animated cells (0-0.1)
        fadeRateMultiplier: 0.015,      // Additional fade rate based on cell size (0-0.1)
        triggerProbability: 0.12,       // Chance to animate a cell each frame (0-1, 0.12 = 12%)
        mouseRange: 250,                // Maximum distance from mouse to trigger animation (pixels)
        densityWeightPower: 1.5,        // How much to favor smaller cells (>1 = more bias)
        distanceWeightPower: 2,         // How much distance affects selection (>1 = favor closer cells)
        distanceFalloffPower: 1.5,      // How quickly opacity fades with distance (>1 = faster falloff)
        colorIntensityMin: 0.5,         // Minimum color intensity in dense areas (0-1)
        colorIntensityMax: 0.7,         // Maximum color intensity in dense areas (0-1)
    },

    // Particle emitter system
    particles: {
        enabled: true,                  // Enable/disable particle emitter
        emissionRate: 2,                // Particles emitted per frame (can be fractional)
        maxParticles: 50,               // Maximum number of active particles
        lifetime: 120,                  // Particle lifetime in frames (60 = 1 second at 60fps)

        // Emission properties
        emissionSpeed: 2.0,             // Initial emission speed (pixels per frame)
        emissionSpread: 360,            // Emission angle spread in degrees (360 = all directions)

        // Orbital behavior
        orbitalPull: 0.015,             // Strength of pull towards mouse (0-0.1)
        orbitalVelocity: 0.05,          // Tangential velocity for orbiting (0-0.2)
        damping: 0.98,                  // Velocity damping (0.9-1.0, lower = more drag)

        // Influence on quadtree
        influenceRadius: 80,            // How far each particle influences the grid (pixels)
        influenceStrength: 0.6,         // Strength of particle influence (0-1, relative to main proximity)
    }
};

class QuadtreeGrid {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.cells = [];
        this.animatedCells = [];
        this.mousePos = { x: -1000, y: -1000 };
        this.elements = [];
        this.particles = [];
        this.particleAccumulator = 0;  // For fractional emission rates

        this.settings = CONFIG.gridSettings;

        this.setupCanvas();
        this.findInteractiveElements();
        this.generateGrid();
        this.animate();

        // Event listeners
        window.addEventListener('resize', () => this.handleResize());
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    }

    setupCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    handleResize() {
        this.setupCanvas();
        this.findInteractiveElements();
        this.generateGrid();
    }

    handleMouseMove(e) {
        this.mousePos = { x: e.clientX, y: e.clientY };
    }

    handleTouchMove(e) {
        if (e.touches.length > 0) {
            this.mousePos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
    }

    findInteractiveElements() {
        this.elements = [];
        const appLinks = document.querySelectorAll('.app-link');
        const header = document.querySelector('header');
        const statusMsg = document.querySelector('.status-message');

        appLinks.forEach(link => {
            const rect = link.getBoundingClientRect();
            this.elements.push({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                width: rect.width,
                height: rect.height,
                element: link
            });
        });

        if (header) {
            const rect = header.getBoundingClientRect();
            this.elements.push({
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                width: rect.width,
                height: rect.height
            });
        }
    }

    // Emit new particles from mouse position
    emitParticles() {
        if (!QUADTREE_CONFIG.particles.enabled) return;

        const config = QUADTREE_CONFIG.particles;

        // Use accumulator for fractional emission rates
        this.particleAccumulator += config.emissionRate;
        const particlesToEmit = Math.floor(this.particleAccumulator);
        this.particleAccumulator -= particlesToEmit;

        for (let i = 0; i < particlesToEmit; i++) {
            if (this.particles.length >= config.maxParticles) break;

            // Random emission angle
            const angleSpread = config.emissionSpread * Math.PI / 180;
            const angle = Math.random() * angleSpread - angleSpread / 2;

            // Random speed variation
            const speed = config.emissionSpeed * (0.7 + Math.random() * 0.6);

            this.particles.push({
                x: this.mousePos.x,
                y: this.mousePos.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                age: 0,
                lifetime: config.lifetime
            });
        }
    }

    // Update particle positions and physics
    updateParticles() {
        if (!QUADTREE_CONFIG.particles.enabled) {
            this.particles = [];
            return;
        }

        const config = QUADTREE_CONFIG.particles;

        // Update existing particles
        this.particles = this.particles.filter(particle => {
            // Age the particle
            particle.age++;
            if (particle.age > particle.lifetime) return false;

            // Calculate vector to mouse
            const dx = this.mousePos.x - particle.x;
            const dy = this.mousePos.y - particle.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 0) {
                // Normalize direction
                const ndx = dx / dist;
                const ndy = dy / dist;

                // Apply orbital pull (towards mouse)
                particle.vx += ndx * config.orbitalPull;
                particle.vy += ndy * config.orbitalPull;

                // Apply tangential velocity for orbiting
                // Perpendicular to direction towards mouse
                const tangentX = -ndy;
                const tangentY = ndx;
                particle.vx += tangentX * config.orbitalVelocity;
                particle.vy += tangentY * config.orbitalVelocity;
            }

            // Apply damping
            particle.vx *= config.damping;
            particle.vy *= config.damping;

            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;

            return true;
        });
    }

    generateGrid() {
        this.cells = [];
        const cols = Math.ceil(this.canvas.width / this.settings.baseGridSize);
        const rows = Math.ceil(this.canvas.height / this.settings.baseGridSize);

        for (let i = 0; i <= cols; i++) {
            for (let j = 0; j <= rows; j++) {
                const cell = {
                    x: i * this.settings.baseGridSize,
                    y: j * this.settings.baseGridSize,
                    size: this.settings.baseGridSize,
                    depth: 0
                };

                this.subdivideCellIfNeeded(cell);
            }
        }
    }

    subdivideCellIfNeeded(cell, depth = 0) {
        if (depth >= this.settings.maxDepth) {
            this.cells.push(cell);
            return;
        }

        const centerX = cell.x + cell.size / 2;
        const centerY = cell.y + cell.size / 2;

        // Check proximity to elements using shape-based distance
        let minDistance = Infinity;
        this.elements.forEach(elem => {
            const shapeDist = this.calculateShapeDistance(centerX, centerY, elem.x, elem.y);
            minDistance = Math.min(minDistance, shapeDist);
        });

        // Check proximity to mouse using shape-based distance
        const mouseShapeDist = this.calculateShapeDistance(centerX, centerY, this.mousePos.x, this.mousePos.y);
        minDistance = Math.min(minDistance, mouseShapeDist);

        // Check proximity to particles (if enabled)
        if (QUADTREE_CONFIG.particles.enabled && this.particles.length > 0) {
            const particleConfig = QUADTREE_CONFIG.particles;
            this.particles.forEach(particle => {
                const particleDist = this.calculateShapeDistance(centerX, centerY, particle.x, particle.y);
                // Scale particle influence by its strength and radius
                const effectiveParticleDist = particleDist / particleConfig.influenceStrength;
                // Only consider if within influence radius
                if (particleDist < particleConfig.influenceRadius) {
                    minDistance = Math.min(minDistance, effectiveParticleDist);
                }
            });
        }

        // Add organic variance to proximity threshold to break up circular pattern
        // Use position-based pseudo-randomness for consistent but varied patterns
        const variance = (Math.sin(centerX * 0.01) * Math.cos(centerY * 0.01)) * QUADTREE_CONFIG.subdivision.varianceStrength;
        const adjustedThreshold = this.settings.proximityThreshold * (1 - depth * QUADTREE_CONFIG.subdivision.depthThresholdReduction) * (1 + variance);

        // Apply gradient falloff to the minimum distance
        const effectiveDistance = this.applyGradientFalloff(minDistance, adjustedThreshold);

        // Determine if we should subdivide based on proximity
        const shouldSubdivide = effectiveDistance < adjustedThreshold;

        if (shouldSubdivide && depth < this.settings.maxDepth) {
            // Subdivide into 4 quadrants
            const halfSize = cell.size / 2;
            const quarters = [
                { x: cell.x, y: cell.y },
                { x: cell.x + halfSize, y: cell.y },
                { x: cell.x, y: cell.y + halfSize },
                { x: cell.x + halfSize, y: cell.y + halfSize }
            ];

            // More aggressive random skipping for organic, asymmetrical patterns
            quarters.forEach(q => {
                const skipChance = QUADTREE_CONFIG.subdivision.skipChanceBase + depth * QUADTREE_CONFIG.subdivision.skipChancePerDepth; // Increases with depth
                if (Math.random() > skipChance) {
                    this.subdivideCellIfNeeded({
                        x: q.x,
                        y: q.y,
                        size: halfSize,
                        depth: depth + 1
                    }, depth + 1);
                } else {
                    this.cells.push({
                        x: q.x,
                        y: q.y,
                        size: halfSize,
                        depth: depth + 1
                    });
                }
            });
        } else {
            this.cells.push(cell);
        }
    }

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    }

    // Calculate shape-based distance for different shape types
    calculateShapeDistance(cellX, cellY, targetX, targetY) {
        const dx = cellX - targetX;
        const dy = cellY - targetY;
        const shapeConfig = QUADTREE_CONFIG.shape;

        switch (shapeConfig.type) {
            case 'circular':
                return Math.sqrt(dx * dx + dy * dy);

            case 'elliptical': {
                // Rotate point to align with ellipse axes
                const angle = shapeConfig.rotation * Math.PI / 180;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const rotX = dx * cos - dy * sin;
                const rotY = dx * sin + dy * cos;

                // Scale by aspect ratio
                const scaledX = rotX / shapeConfig.aspectRatio;
                return Math.sqrt(scaledX * scaledX + rotY * rotY);
            }

            case 'rectangular': {
                // Manhattan distance (taxicab metric)
                return Math.max(Math.abs(dx), Math.abs(dy));
            }

            case 'squircle': {
                // Smooth interpolation between circle and square
                const r = shapeConfig.cornerRadius;
                const circDist = Math.sqrt(dx * dx + dy * dy);
                const rectDist = Math.max(Math.abs(dx), Math.abs(dy));
                return circDist * r + rectDist * (1 - r);
            }

            default:
                return Math.sqrt(dx * dx + dy * dy);
        }
    }

    // Apply gradient falloff to distance
    applyGradientFalloff(distance, threshold) {
        const shapeConfig = QUADTREE_CONFIG.shape;

        // Calculate inner and outer radius in absolute units
        const innerRadius = threshold * shapeConfig.innerRadius;
        const outerRadius = threshold * shapeConfig.outerRadius;

        // If within inner radius, always subdivide (return 0 distance)
        if (distance <= innerRadius) {
            return 0;
        }

        // If beyond outer radius, never subdivide (return large distance)
        if (distance >= outerRadius) {
            return threshold * 2;
        }

        // Normalize distance to 0-1 range between inner and outer radius
        const normalizedDist = (distance - innerRadius) / (outerRadius - innerRadius);

        // Apply gradient function
        let falloff;
        switch (shapeConfig.gradient) {
            case 'linear':
                falloff = normalizedDist;
                break;

            case 'quadratic':
                falloff = Math.pow(normalizedDist, shapeConfig.gradientSteepness);
                break;

            case 'exponential':
                falloff = (Math.exp(normalizedDist * shapeConfig.gradientSteepness) - 1) /
                         (Math.exp(shapeConfig.gradientSteepness) - 1);
                break;

            case 'smooth':
                // Smoothstep function
                const t = normalizedDist;
                falloff = t * t * (3 - 2 * t);
                // Apply steepness by compressing the curve
                falloff = Math.pow(falloff, shapeConfig.gradientSteepness);
                break;

            case 'inverse':
                // Inverse falloff (slower at start, faster at end)
                falloff = 1 - Math.pow(1 - normalizedDist, shapeConfig.gradientSteepness);
                break;

            default:
                falloff = normalizedDist;
        }

        // Map back to distance value
        return innerRadius + falloff * (outerRadius - innerRadius);
    }

    drawGrid() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        this.ctx.fillStyle = this.settings.bgColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw animated cells with color
        this.updateAnimatedCells();
        this.animatedCells.forEach(cell => {
            this.ctx.fillStyle = cell.color;

            // Higher density (smaller cells) get more intense rendering
            const depthMultiplier = cell.depth !== undefined
                ? QUADTREE_CONFIG.rendering.depthMultiplierMin + (cell.depth / this.settings.maxDepth) * QUADTREE_CONFIG.rendering.depthMultiplierMax
                : 0.3;

            this.ctx.globalAlpha = cell.alpha * depthMultiplier;
            this.ctx.fillRect(cell.x + 1, cell.y + 1, cell.size - 2, cell.size - 2);
        });

        // Reset alpha
        this.ctx.globalAlpha = 1;

        // Draw grid lines
        this.ctx.strokeStyle = this.settings.lineColor;
        this.ctx.lineWidth = 1;

        this.cells.forEach(cell => {
            // Vary line opacity based on depth
            const alpha = QUADTREE_CONFIG.rendering.lineOpacityMin + (cell.depth / this.settings.maxDepth) * QUADTREE_CONFIG.rendering.lineOpacityMax;
            this.ctx.globalAlpha = alpha;

            this.ctx.strokeRect(cell.x, cell.y, cell.size, cell.size);
        });

        this.ctx.globalAlpha = 1;
    }

    updateAnimatedCells() {
        // Remove faded cells with variable fade rate
        this.animatedCells = this.animatedCells.filter(cell => {
            // Smaller cells fade slower, creating lingering trails
            const fadeRate = QUADTREE_CONFIG.animation.fadeRateBase + (cell.size / this.settings.baseGridSize) * QUADTREE_CONFIG.animation.fadeRateMultiplier;
            cell.alpha -= fadeRate;
            return cell.alpha > 0;
        });

        // Reduced frequency for less intense flickering
        if (Math.random() < QUADTREE_CONFIG.animation.triggerProbability) {
            // Extended range with falloff for tail effect
            const maxRange = QUADTREE_CONFIG.animation.mouseRange;

            // Find cells within extended range
            const cellsWithDistance = this.cells
                .map(cell => {
                    const centerX = cell.x + cell.size / 2;
                    const centerY = cell.y + cell.size / 2;
                    const dist = this.distance(centerX, centerY, this.mousePos.x, this.mousePos.y);
                    return { cell, dist };
                })
                .filter(({ dist }) => dist < maxRange);

            if (cellsWithDistance.length > 0) {
                // Probability weighted by density (smaller cells) and distance
                const weightedCells = cellsWithDistance.map(({ cell, dist }) => {
                    // Density weight: smaller cells (higher depth) have higher weight
                    const densityWeight = Math.pow(QUADTREE_CONFIG.animation.densityWeightPower, cell.depth);

                    // Distance falloff: closer = higher weight
                    const distanceWeight = 1 - (dist / maxRange);

                    // Combined weight with stronger bias towards smaller cells
                    const weight = densityWeight * Math.pow(distanceWeight, QUADTREE_CONFIG.animation.distanceWeightPower);

                    return { cell, dist, weight };
                });

                // Pick cell based on weights
                const totalWeight = weightedCells.reduce((sum, { weight }) => sum + weight, 0);
                let random = Math.random() * totalWeight;
                let selectedCell = null;
                let selectedDist = 0;

                for (const { cell, dist, weight } of weightedCells) {
                    random -= weight;
                    if (random <= 0) {
                        selectedCell = cell;
                        selectedDist = dist;
                        break;
                    }
                }

                if (selectedCell) {
                    // Calculate alpha based on distance falloff and cell density
                    const distanceFalloff = 1 - (selectedDist / maxRange);

                    // Smaller cells (denser areas) get more intense colors
                    const densityMultiplier = QUADTREE_CONFIG.animation.colorIntensityMin + (selectedCell.depth / this.settings.maxDepth) * QUADTREE_CONFIG.animation.colorIntensityMax;

                    // Starting alpha with falloff
                    const startAlpha = Math.pow(distanceFalloff, QUADTREE_CONFIG.animation.distanceFalloffPower) * densityMultiplier;

                    // Color intensity also varies with density
                    const colorIndex = selectedCell.depth >= 2
                        ? Math.floor(Math.random() * this.settings.accentColors.length)
                        : Math.floor(Math.random() * Math.min(2, this.settings.accentColors.length));

                    const color = this.settings.accentColors[colorIndex];

                    this.animatedCells.push({
                        x: selectedCell.x,
                        y: selectedCell.y,
                        size: selectedCell.size,
                        color: color,
                        alpha: startAlpha,
                        depth: selectedCell.depth
                    });
                }
            }
        }
    }

    animate() {
        this.findInteractiveElements();
        this.updateParticles();
        this.emitParticles();
        this.generateGrid();
        this.drawGrid();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gridCanvas');
    if (canvas) {
        new QuadtreeGrid(canvas);
    }
});
