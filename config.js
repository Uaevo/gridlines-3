// ====================================
// DASHBOARD CONFIGURATION
// ====================================
// Edit this file to customize your dashboard

const CONFIG = {
    // Status message displayed at the top
    statusMessage: "All Systems Online",

    // Application links
    // Add, remove, or edit entries as needed
    applications: [
        {
            name: "Plex",
            url: "http://192.168.1.100:32400",
            icon: "🎬",
            description: "Media Server"
        },
        {
            name: "Jellyfin",
            url: "http://192.168.1.100:8096",
            icon: "📺",
            description: "Alternative Media Server"
        },
        {
            name: "Nextcloud",
            url: "http://192.168.1.100:8080",
            icon: "☁️",
            description: "Cloud Storage"
        },
        {
            name: "Home Assistant",
            url: "http://192.168.1.100:8123",
            icon: "🏠",
            description: "Home Automation"
        },
        {
            name: "Pi-hole",
            url: "http://192.168.1.100:80/admin",
            icon: "🛡️",
            description: "Network Ad Blocker"
        },
        {
            name: "Portainer",
            url: "http://192.168.1.100:9000",
            icon: "🐳",
            description: "Docker Management"
        },
        {
            name: "Sonarr",
            url: "http://192.168.1.100:8989",
            icon: "📡",
            description: "TV Show Manager"
        },
        {
            name: "Radarr",
            url: "http://192.168.1.100:7878",
            icon: "🎥",
            description: "Movie Manager"
        },
        {
            name: "qBittorrent",
            url: "http://192.168.1.100:8081",
            icon: "⬇️",
            description: "Torrent Client"
        },
        {
            name: "Grafana",
            url: "http://192.168.1.100:3000",
            icon: "📊",
            description: "Monitoring Dashboard"
        }
    ],

    // Grid animation settings
    gridSettings: {
        baseGridSize: 80,          // Base size of largest grid cells
        maxDepth: 4,               // Maximum quadtree subdivision depth
        proximityThreshold: 200,   // Distance at which grid subdivides
        animationSpeed: 0.5,       // Speed of grid animations
        lineColor: "#ffffff",      // White lines
        bgColor: "#000000",        // Black background
        accentColors: [           // Colors for animated cells
            "#00ffff",  // Cyan
            "#ff00ff",  // Magenta
            "#ffff00",  // Yellow
            "#00ff00",  // Green
            "#ff0066"   // Pink
        ]
    }
};

// Initialize the dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeDashboard();
});

function initializeDashboard() {
    // Set status message
    const statusElement = document.getElementById('statusMessage');
    if (statusElement) {
        statusElement.textContent = CONFIG.statusMessage;
    }

    // Generate application links
    const appGrid = document.getElementById('appGrid');
    if (appGrid) {
        appGrid.innerHTML = CONFIG.applications.map(app => `
            <a href="${app.url}" class="app-link" data-text="${app.name}">
                <div class="app-icon">${app.icon}</div>
                <div class="app-name">${app.name}</div>
                <div class="app-description">${app.description}</div>
            </a>
        `).join('');

        // Add decoding effect to all app links
        setupDecodingEffect();
    }
}

function setupDecodingEffect() {
    const appLinks = document.querySelectorAll('.app-link');

    appLinks.forEach(link => {
        const nameElement = link.querySelector('.app-name');
        const originalText = nameElement.textContent;
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';

        let animationFrame;
        let iteration = 0;

        link.addEventListener('mouseenter', () => {
            clearInterval(animationFrame);
            iteration = 0;

            animationFrame = setInterval(() => {
                nameElement.textContent = originalText
                    .split('')
                    .map((char, index) => {
                        if (index < iteration) {
                            return originalText[index];
                        }
                        return chars[Math.floor(Math.random() * chars.length)];
                    })
                    .join('');

                iteration += 1 / 3;

                if (iteration >= originalText.length) {
                    clearInterval(animationFrame);
                    nameElement.textContent = originalText;
                }
            }, 30);
        });

        link.addEventListener('mouseleave', () => {
            clearInterval(animationFrame);
            nameElement.textContent = originalText;
        });
    });
}
