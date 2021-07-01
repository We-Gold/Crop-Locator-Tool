// Import the css
import "./style.css"

import { findCropInImage } from "./helpers/find-crop"
import { createImageUploadCallback } from "./helpers/input-upload-handler"
import { handleErrors } from "./helpers/handle-errors"
import { loadImage } from "./helpers/load-image"

// Create places to store the images
const images = {
	sourceImage: null,
	crop: null,
}

const analyzeImages = () => {
	console.log(images)

	if (images.sourceImage == null || images.crop == null) return

	const { errors, result } = findCropInImage(images.sourceImage, images.crop)

	handleErrors(errors)

	console.log(result)
}

// For testing purposes, auto load the default images
const useDefaultImages = async () => {
	const { data: sourceImage, errors: errors1 } = await loadImage({
		imagePath: "/samples/5dpf_1_8bit.tif",
	})
	const { data: crop, errors: errors2 } = await loadImage({
		imagePath:
			"/samples/Training Crops/5dpf_1_8bit_x_200-500_y_250-550_z_350-650.tif",
	})

	// Handle any errors that arise
	handleErrors(errors1)
	handleErrors(errors2)

	images.sourceImage = { data: sourceImage }
	images.crop = { data: crop }

	analyzeImages()
}

useDefaultImages()

const sourceImageUploadHandler = createImageUploadCallback({
	callback: (image) => {
		images.sourceImage = image

		analyzeImages()
	},
})

const cropImageUploadHandler = createImageUploadCallback({
	callback: (image) => {
		images.crop = image

		analyzeImages()
	},
})

document
	.querySelector("#source-image-input")
	.addEventListener("change", sourceImageUploadHandler)

document
	.querySelector("#crop-image-input")
	.addEventListener("change", cropImageUploadHandler)
