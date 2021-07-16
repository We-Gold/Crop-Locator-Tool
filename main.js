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
} from "./helpers/display-image"
import { isImageRotated } from "./helpers/detect-rotation"
import {
	calculateOriginalDimensionsForRotatedImage,
	calculateOriginalDimensionsForCroppedImage,
	correctImage,
	cropImage,
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
		dimensions: images.crop.dimensions,
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
		dimensions: images.crop.dimensions,
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

/**
 * Locates the crop and passes the information on to the web interface
 */
const analyzeImages = async () => {
	if (images.sourceImage == null || images.crop == null) return

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

	const { isRotated, angle } = isImageRotated(images.crop)

	if (isRotated) handleRotatedCrop(angle)
	else handleNormalCrop()

	const { errors, bestPosition } = await findCropInImage(
		images.sourceImage,
		images.crop,
		{ isRotated, pipelineLayerCompleteCallback }
	)

	handleErrors(errors)

	// Don't show the overlay if the crop is not from the source image
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
