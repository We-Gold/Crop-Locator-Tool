import { defineConfig } from "vite"
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
	base: "./",
	mode: "production",
	plugins: [
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				"theme_color": "#66ad6f",
				"background_color": "#333",
				"display": "standalone",
				"scope": "/",
				"start_url": "/",
				"name": "Crop Locator Tool",
				"short_name": "Crop Locator",
				"description": "A tool that locates crops taken from medical images (tiffs), including rotated and resliced crops.",
				"icons": [
					{
						"src": "/icon-192x192.png",
						"sizes": "192x192",
						"type": "image/png"
					},
					{
						"src": "/icon-256x256.png",
						"sizes": "256x256",
						"type": "image/png"
					},
					{
						"src": "/icon-384x384.png",
						"sizes": "384x384",
						"type": "image/png"
					},
					{
						"src": "/icon-512x512.png",
						"sizes": "512x512",
						"type": "image/png"
					}
				]
			}
		})
	]
})
