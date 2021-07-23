// Import the css
import "./style.css"

import { addUploadHandlers } from "./helpers/dom-management/add-upload-handlers"

// Register the service worker for offline support
import { registerSW } from "virtual:pwa-register"

registerSW({
	onOfflineReady() {
		console.log("Working in offline mode.")
	},
})

addUploadHandlers()


