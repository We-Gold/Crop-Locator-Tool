// Import the css
import "./style.css"

import {
	findCropInImage,
	validateSourceAndCroppedImages,
} from "./helpers/find-crop"
import { createImageUploadCallback } from "./helpers/input-upload-handler"
import { handleErrors } from "./helpers/handle-errors"
import {
	displayImage,
	overlayCrop,
	showCroppedAreaOnImage,
	replaceCropInSourceImage,
} from "./helpers/display-image"
import { isImageRotated } from "./helpers/detect-rotation"
import {
	calculateOriginalDimensionsForRotatedImage,
	calculateOriginalDimensionsForCroppedImage,
	correctImage,
	cropImage,
	resliceImage,
} from "./helpers/correct-image"
import { handleGuideTextToggle } from "./helpers/guide-text"
import { setProgressBarToPercent } from "./helpers/progress-bar"

// Create places to store the images
const images = {
	sourceImage: null,
	crop: null,
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

const replaceCropUploadHandler = createImageUploadCallback({
	callback: (image) => {
		if (images.crop == null || images.crop.position == null) return
		if (
			images.crop.dimensions.width != image.dimensions.width ||
			images.crop.dimensions.height != image.dimensions.height
		)
			return

		const replacedCropCanvas = document.querySelector(
			"#replaced-crop-canvas"
		)

		const sourceImageLayer =
			images.sourceImage.data[images.crop.position.z - 1]

		replaceCropInSourceImage({
			imageData: sourceImageLayer.data,
			width: sourceImageLayer.imageWidth,
			height: sourceImageLayer.imageLength,
			canvasElement: replacedCropCanvas,
			cropPosition: images.crop.position,
			cropDimensions: images.crop.dimensions,
			angle: images.crop.isRotated ? images.crop.angle : null,
			newCrop: image,
		})
	},
})

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

/**
 * Converts a rotated image to a usable image
 * @param {number} angle
 */
const handleRotatedCrop = (angle) => {
	const crop = images.crop.data[0]

	// Rotate and crop the given image to extract a usable image
	const image = correctImage(
		crop.data,
		crop.imageWidth,
		crop.imageLength,
		angle,
		images.crop.data.length
	)

	images.crop = {
		data: image,
		original: images.crop.original,
		dimensions: images.crop.dimensions,
		originalDimensions: images.crop.originalDimensions,
		angle,
		isRotated: true,
	}
}

/**
 * Crops the given crop image to a smaller size to improve performance
 */
const handleNormalCrop = () => {
	// Crop the image to 150 x 150 or less
	const crop = cropImage(
		images.crop.data[0].data,
		images.crop.dimensions.width,
		images.crop.dimensions.height,
		images.crop.data.length,
		{ width: 150, height: 150 }
	)

	images.crop = {
		data: crop,
		original: images.crop.original,
		dimensions: images.crop.dimensions,
		originalDimensions: images.crop.originalDimensions,
	}
}

/**
 * Displays an overlay of the crop on the original image
 */
const showRotatedCropOverlay = ({ position, sourceCanvas }) => {
	// Record the current dimensions of the crop
	const currentDimensions = {
		width: images.crop.data[0].imageWidth,
		height: images.crop.data[0].imageLength,
	}

	// Determine the dimensions of the overlay
	const { position: _position } = calculateOriginalDimensionsForRotatedImage(
		position,
		currentDimensions,
		images.crop.dimensions
	)

	images.crop.position = _position

	overlayCrop(sourceCanvas, _position, {
		w: images.crop.dimensions.width,
		h: images.crop.dimensions.height,
	})
}

/**
 * Displays an overlay of the crop on the original image
 */
const showNormalCropOverlay = ({ position, sourceCanvas }) => {
	// Determine the dimensions of the overlay
	const { position: _position } = calculateOriginalDimensionsForCroppedImage(
		position,
		images.crop.dimensions
	)

	images.crop.position = _position

	overlayCrop(sourceCanvas, _position, {
		w: images.crop.dimensions.width,
		h: images.crop.dimensions.height,
	})
}

const pipelineLayerCompleteCallback = ({ layers, layerFinished }) => {
	setProgressBarToPercent(layerFinished / layers)
}

const resliceCrop = (axis, layer = 0) => {
	images.crop = resliceImage(images.crop, axis, layer)
}

const resliceAndScanFromAxis = async (axis) => {
	// Reset the crop
	images.crop.data = images.crop.original
	images.crop.dimensions = images.crop.originalDimensions

	resliceCrop(axis)

	const imageRotatedInfo = isImageRotated(images.crop)

	if (imageRotatedInfo.isRotated) handleRotatedCrop(imageRotatedInfo.angle)
	else handleNormalCrop()

	const results = await findCropInImage(images.sourceImage, images.crop, {
		isRotated: imageRotatedInfo.isRotated,
		isResliced: true,
		pipelineLayerCompleteCallback,
	})

	return { imageRotatedInfo, results }
}

const searchForCrop = async () => {
	let imageRotatedInfo = isImageRotated(images.crop)

	if (imageRotatedInfo.isRotated) handleRotatedCrop(imageRotatedInfo.angle)
	else handleNormalCrop()

	let results = await findCropInImage(images.sourceImage, images.crop, {
		isRotated: imageRotatedInfo.isRotated,
		pipelineLayerCompleteCallback,
	})

	// Try reslicing the image from the top
	if (results.errors != undefined && results.errors.length > 0) {
		const scanResults = await resliceAndScanFromAxis("top")

		imageRotatedInfo = scanResults.imageRotatedInfo
		results = scanResults.results
	}

	// Try reslicing the image from the left
	if (results.errors != undefined && results.errors.length > 0) {
		const scanResults = await resliceAndScanFromAxis("left")

		imageRotatedInfo = scanResults.imageRotatedInfo
		results = scanResults.results
	}

	return {
		errors: results.errors,
		bestPosition: results.bestPosition,
		isRotated: imageRotatedInfo.isRotated,
	}
}

/**
 * Locates the crop and passes the information on to the web interface
 */
const analyzeImages = async () => {
	if (images.sourceImage == null || images.crop == null) return

	document.querySelector("#replaced-crop-canvas").style.visibility = "hidden"

	document.querySelector("#info-area").style.visibility = "visible"

	setProgressBarToPercent(0)

	const sourceCanvas = document.querySelector("#source-image-canvas")

	const sourceImage = images.sourceImage.data[0]

	displayImage({
		imageData: sourceImage.data,
		width: sourceImage.imageWidth,
		height: sourceImage.imageLength,
		canvasElement: sourceCanvas,
	})

	const validationErrors = validateSourceAndCroppedImages(
		images.sourceImage,
		images.crop
	)

	handleErrors(validationErrors)

	if (validationErrors.length > 0) return

	const { errors, bestPosition, isRotated } = await searchForCrop()

	handleErrors(errors)

	if (errors != undefined && errors.length > 0) return

	const position = {
		x: bestPosition.x,
		y: bestPosition.y,
		z: bestPosition.z + 1,
	}

	images.crop.position = position

	const sourceImageLayer = images.sourceImage.data[position.z - 1]

	displayImage({
		imageData: sourceImageLayer.data,
		width: sourceImageLayer.imageWidth,
		height: sourceImageLayer.imageLength,
		canvasElement: sourceCanvas,
	})

	if (isRotated) showRotatedCropOverlay({ position, sourceCanvas })
	else showNormalCropOverlay({ position, sourceCanvas })

	outputResults()

	await showCropOnBlackBackground()
}

/**
 * Outputs information that was found through scanning the images
 */
const outputResults = () => {
	// Collect all the ouput information
	const info = {
		x: `${images.crop.position.x}-${
			images.crop.position.x + images.crop.dimensions.width
		}`,
		y: `${images.crop.position.y}-${
			images.crop.position.y + images.crop.dimensions.height
		}`,
		z: `${images.crop.position.z}-${
			images.crop.position.z + images.crop.data.length
		}`,
		angle:
			images.crop.isRotated != null
				? `${Math.round(images.crop.angle)}`
				: "",
	}

	// Generate html to show the crop's position
	const resultHTML = `Crop Position: <br> x - ${info.x}, y - ${info.y}, z - ${
		info.z
	} ${images.crop.isRotated != null ? `<br> Rotated - ${info.angle}°` : ""}`

	const cropInfo = document.querySelector("#crop-info")

	cropInfo.innerHTML = resultHTML
}

const showCropOnBlackBackground = () => {
	const cropCanvas = document.querySelector("#crop-canvas")

	const sourceImageLayer = images.sourceImage.data[images.crop.position.z - 1]

	showCroppedAreaOnImage({
		imageData: sourceImageLayer.data,
		width: sourceImageLayer.imageWidth,
		height: sourceImageLayer.imageLength,
		canvasElement: cropCanvas,
		cropPosition: images.crop.position,
		cropDimensions: images.crop.dimensions,
		angle: images.crop.isRotated ? images.crop.angle : null,
	})
}
