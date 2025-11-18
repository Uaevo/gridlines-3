# Quadtree Grid Dashboard

A beautiful, interactive dashboard for accessing self-hosted applications with a dynamic quadtree grid background effect.

## Features

- **Dynamic Quadtree Grid**: Hierarchical grid that adapts to proximity of interactive elements
- **Decoding Text Effect**: Hover over links to see a cool "decoding" animation
- **Colored Grid Animations**: Moving elements create colorful trails in the grid
- **Easy Configuration**: Simple config file to add/remove/edit applications
- **Mobile Responsive**: Works seamlessly on desktop, tablet, and mobile devices
- **Status Message**: Display custom status messages
- **Accessibility**: Keyboard navigation and reduced motion support

## Files Structure

```
├── index.html      # Main HTML structure
├── config.js       # Configuration file (edit this to customize!)
├── quadtree.js     # Quadtree grid logic and animations
├── styles.css      # All styling and responsive design
└── README.md       # This file
```

## Deployment on Synology NAS WebStation

### Prerequisites

1. Your Synology NAS with DSM installed
2. Web Station package installed
3. SSH access to your NAS (optional, but helpful)

### Deployment Steps

#### Method 1: Using File Station (Easiest)

1. **Open File Station** on your Synology NAS
2. Navigate to the **web** folder (usually `/volume1/web` or `/web`)
3. Create a new folder called `dashboard` (or any name you prefer)
4. Upload all files from this project into the folder:
   - index.html
   - config.js
   - quadtree.js
   - styles.css
5. **Access your dashboard** at: `http://YOUR_NAS_IP/dashboard`

#### Method 2: Using SSH

1. **Connect to your NAS via SSH**:
   ```bash
   ssh your-username@YOUR_NAS_IP
   ```

2. **Navigate to the web directory**:
   ```bash
   cd /volume1/web
   ```

3. **Create a dashboard folder**:
   ```bash
   sudo mkdir dashboard
   cd dashboard
   ```

4. **Upload files** using SCP from your local machine:
   ```bash
   scp index.html config.js quadtree.js styles.css your-username@YOUR_NAS_IP:/volume1/web/dashboard/
   ```

5. **Set proper permissions**:
   ```bash
   sudo chmod -R 755 /volume1/web/dashboard
   ```

6. **Access your dashboard** at: `http://YOUR_NAS_IP/dashboard`

### Web Station Configuration

1. Open **Web Station** in DSM
2. Go to **General Settings**
3. Ensure HTTP back-end server is set to **Nginx** or **Apache**
4. Your dashboard should now be accessible

## Customization

### Adding/Removing Applications

Edit the `config.js` file and modify the `applications` array:

```javascript
applications: [
    {
        name: "Plex",                          // Application name
        url: "http://192.168.1.100:32400",     // URL to your application
        icon: "🎬",                             // Emoji icon
        description: "Media Server"            // Short description
    },
    // Add more applications here...
]
```

### Changing Status Message

In `config.js`, modify:

```javascript
statusMessage: "Your Custom Status Message"
```

### Adjusting Grid Settings

In `config.js`, modify the `gridSettings` object:

```javascript
gridSettings: {
    baseGridSize: 80,          // Base size of grid cells (larger = bigger cells)
    maxDepth: 4,               // Maximum subdivision levels (higher = more detail)
    proximityThreshold: 200,   // Distance at which grid subdivides (pixels)
    animationSpeed: 0.5,       // Speed of animations
    lineColor: "#ffffff",      // Color of grid lines
    bgColor: "#000000",        // Background color
    accentColors: [           // Colors for animated cells
        "#00ffff",  // Cyan
        "#ff00ff",  // Magenta
        "#ffff00",  // Yellow
        "#00ff00",  // Green
        "#ff0066"   // Pink
    ]
}
```

## Mobile Access

The dashboard is fully responsive and works great on mobile devices. Simply access the same URL from your phone or tablet when connected to your local network.

## Recommended Setup

### For Internal Network Access

1. Set a static IP for your NAS
2. Access dashboard at: `http://192.168.1.XXX/dashboard`
3. Bookmark on all devices for quick access

### For External Access (Advanced)

1. Set up **Reverse Proxy** in DSM
2. Configure **SSL/TLS** certificates
3. Use **QuickConnect** or **DDNS**
4. Enable **port forwarding** on your router (be security conscious!)

## Troubleshooting

### Dashboard doesn't load

1. Check that Web Station is running
2. Verify all files are in the correct directory
3. Check file permissions (should be 755 for folders, 644 for files)
4. Clear browser cache

### Links don't work

1. Verify the URLs in `config.js` are correct
2. Ensure the applications are running
3. Check that you're on the same network as your NAS

### Grid animations are slow

1. Reduce `maxDepth` in gridSettings
2. Increase `baseGridSize` for fewer cells
3. Try on a device with better performance

### Mobile display issues

1. Clear mobile browser cache
2. Try different mobile browser
3. Check viewport settings (should auto-adjust)

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support

## Performance Tips

- For slower devices, reduce `maxDepth` to 3
- Increase `baseGridSize` to 100 for fewer cells
- Reduce number of `accentColors` for simpler animations

## Security Notes

- This dashboard is designed for **internal network use only**
- Always use **HTTPS** if exposing to the internet
- Keep your NAS firmware updated
- Use strong passwords for all services
- Consider using a VPN for external access instead of port forwarding

## License

Free to use and modify for personal use.

## Credits

Created with love for self-hosted enthusiasts.

---

Enjoy your new dashboard! Feel free to customize it to match your setup.
