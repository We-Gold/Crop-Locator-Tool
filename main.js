// Import the css
import "./style.css"

import { findCropInImage } from "./helpers/find-crop"
import { createImageUploadCallback } from "./helpers/input-upload-handler"
import { handleErrors } from "./helpers/handle-errors"

// Create places to store the images
const images = {
	sourceImage: null,
	crop: null,
}

const analyzeImages = () => {
	if (images.sourceImage == null || images.crop == null) return

	const { errors } = findCropInImage(images.sourceImage, images.crop)

    handleErrors(errors)
}

const sourceImageUploadHandler = createImageUploadCallback({
	callback: (data) => {
		images.sourceImage = data

		analyzeImages()
	},
})

const cropImageUploadHandler = createImageUploadCallback({
	callback: (data) => {
		images.crop = data

		analyzeImages()
	},
})

document
	.querySelector("#source-image-input")
	.addEventListener("change", sourceImageUploadHandler)

document
	.querySelector("#crop-image-input")
	.addEventListener("change", cropImageUploadHandler)
