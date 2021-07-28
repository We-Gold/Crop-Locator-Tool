import { handleGuideTextToggle } from "./guide-text"
import { createUploadListeners } from "./create-upload-handlers"

export const addUploadHandlers = () => {
	const {
		replaceCropUploadHandler,
		sourceImageUploadHandler,
		cropImageUploadHandler,
	} = createUploadListeners()

	window.addEventListener("load", function () {
		// Handle the source image being uploaded
		document
			.querySelector("#source-image-input")
			.addEventListener("change", sourceImageUploadHandler)

		// Handle the crop being uploaded
		document
			.querySelector("#crop-image-input")
			.addEventListener("change", cropImageUploadHandler)

		// Handles whenever an image is uploaded to replace the crop
		// Note: this is a secondary feature that appears at the bottom
		// of the page
		document
			.querySelector("#new-crop-input")
			.addEventListener("change", replaceCropUploadHandler)

		// Manages the usage guide toggle button
		document
			.querySelector("#toggle-guide-text")
			.addEventListener("click", handleGuideTextToggle)
	})
}
