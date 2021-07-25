import { handleGuideTextToggle } from "./guide-text"
import { createUploadListeners } from "./create-upload-handlers"

export const addUploadHandlers = () => {
	const {
		replaceCropUploadHandler,
		sourceImageUploadHandler,
		cropImageUploadHandler,
	} = createUploadListeners()

	window.addEventListener("load", function () {
		document
			.querySelector("#new-crop-input")
			.addEventListener("change", replaceCropUploadHandler)

		document
			.querySelector("#source-image-input")
			.addEventListener("change", sourceImageUploadHandler)

		document
			.querySelector("#crop-image-input")
			.addEventListener("change", cropImageUploadHandler)

		document
			.querySelector("#toggle-guide-text")
			.addEventListener("click", handleGuideTextToggle)
	})
}
