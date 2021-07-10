// Import the css
import "./style.css"

import { findCropInImage } from "./helpers/find-crop"
import { createImageUploadCallback } from "./helpers/input-upload-handler"
import { handleErrors } from "./helpers/handle-errors"
import { loadImage } from "./helpers/load-image"
import { displayImage, overlayCrop } from "./helpers/display-image"

// Create places to store the images
const images = {
	sourceImage: null,
	crop: null,
}

const showImages = () => {
	// Display the crop
	const crop = images.crop.data[0]
	const cropCanvas = document.querySelector("#crop-image-canvas")

	displayImage({
		imageData: crop.data,
		width: crop.imageWidth,
		height: crop.imageLength,
		canvasElement: cropCanvas,
	})
}

const analyzeImages = () => {
	console.log(images)

	if (images.sourceImage == null || images.crop == null) return

	showImages()

	const useEveryXPixel = 5
	const useEveryXLayer = 50

	const { errors, result, positions, matches } = findCropInImage(
		images.sourceImage,
		images.crop,
		{ useEveryXPixel, useEveryXLayer }
	)

	handleErrors(errors)

	console.log(result)

	console.log(matches)

	const position = positions[0]

	const sourceCanvas = document.querySelector("#source-image-canvas")
	const sourceImage = images.sourceImage.data[position.z]

	displayImage({
		imageData: sourceImage.data,
		width: sourceImage.imageWidth,
		height: sourceImage.imageLength,
		canvasElement: sourceCanvas,
	})

	overlayCrop(sourceCanvas, position, {
		w: images.crop.data[0].imageWidth,
		h: images.crop.data[0].imageLength,
	})
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

document
	.querySelector("#default-images-button")
	.addEventListener("click", useDefaultImages)
