// Import the css
import "./style.css"

import { addUploadHandlers } from "./helpers/dom-management/add-upload-handlers"
import { registerSW } from "virtual:pwa-register"

// Register the service worker for offline support
registerSW({
	onOfflineReady() {
		console.log("Working in offline mode.")
	},
})

// Handle the images when they are uploaded
addUploadHandlers()
