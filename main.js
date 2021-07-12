// Import the css
import "./style.css"

import { findCropInImage } from "./helpers/find-crop"
import { createImageUploadCallback } from "./helpers/input-upload-handler"
import { handleErrors } from "./helpers/handle-errors"
import { loadImage } from "./helpers/load-image"
import { displayImage, overlayCrop } from "./helpers/display-image"
import { isImageRotated } from "./helpers/detect-rotation"
import {
	calculateOriginalDimensionsForRotatedImage,
	correctImage,
} from "./helpers/correct-image"

// Create places to store the images
const images = {
	sourceImage: null,
	crop: null,
}

const analyzeImages = () => {
	if (images.sourceImage == null || images.crop == null) return

	console.log(images)

	const { isRotated, angle } = isImageRotated(images.crop)

	if (isRotated) {
		const crop = images.crop.data[0]

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
			isRotated,
		}
	}

	const { errors, bestPosition } = findCropInImage(
		images.sourceImage,
		images.crop,
		isRotated
	)

	handleErrors(errors)

	const sourceCanvas = document.querySelector("#source-image-canvas")

	const sourceImage = images.sourceImage.data[0]

	displayImage({
		imageData: sourceImage.data,
		width: sourceImage.imageWidth,
		height: sourceImage.imageLength,
		canvasElement: sourceCanvas,
	})

	// Don't show the overlay if the crop is not from the source image
	if (errors != undefined && errors.length > 0) return

	const position = {
		x: bestPosition.x,
		y: bestPosition.y,
		z: bestPosition.z + 1,
	}

	images.crop.position = position

	const sourceImageLayer = images.sourceImage.data[position.z]

	displayImage({
		imageData: sourceImageLayer.data,
		width: sourceImageLayer.imageWidth,
		height: sourceImageLayer.imageLength,
		canvasElement: sourceCanvas,
	})

	if (isRotated) {
		const currentDimensions = {
			width: images.crop.data[0].imageWidth,
			height: images.crop.data[0].imageLength,
		}

		const {
			position: _position,
			width,
			height,
		} = calculateOriginalDimensionsForRotatedImage(
			position,
			currentDimensions,
			images.crop.dimensions
		)

		overlayCrop(sourceCanvas, _position, {
			w: width,
			h: height,
		})

	} else {
		overlayCrop(sourceCanvas, position, {
			w: images.crop.data[0].imageWidth,
			h: images.crop.data[0].imageLength,
		})
	}

	outputResults()
}

const outputResults = () => {
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
		angle: images.crop.isRotated != null ? `${Math.round(images.crop.angle)}` : "",
	}

	const resultHTML = `Crop Position: <br> x - ${info.x}, y - ${info.y}, z - ${
		info.z
	} ${images.crop.isRotated != null ? `<br> Rotated - ${info.angle}°` : ""}`

	const cropInfo = document.querySelector("#crop-info")

	cropInfo.innerHTML = resultHTML
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
