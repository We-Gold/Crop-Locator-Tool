// Import the css
import "./style.css"

import { findCropInImage } from "./helpers/find-crop"
import { createImageUploadCallback } from "./helpers/input-upload-handler"
import { handleErrors } from "./helpers/handle-errors"
import { displayImage, overlayCrop } from "./helpers/display-image"
import { isImageRotated } from "./helpers/detect-rotation"
import {
	calculateOriginalDimensionsForRotatedImage,
	calculateOriginalDimensionsForCroppedImage,
	correctImage,
	cropImage,
} from "./helpers/correct-image"

// Create places to store the images
const images = {
	sourceImage: null,
	crop: null,
}

const handleCrop = (isRotated, angle) => {
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
	else {
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
}

const showCropOverlay = ({isRotated, position, sourceCanvas}) => {
	if(isRotated) {
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

		images.crop.position = _position

		overlayCrop(sourceCanvas, _position, {
			w: width,
			h: height,
		})
	} else {
		const {
			position: _position,
			width,
			height,
		} = calculateOriginalDimensionsForCroppedImage(
			position,
			images.crop.dimensions
		)

		images.crop.position = _position

		overlayCrop(sourceCanvas, _position, {
			w: width,
			h: height,
		})
	}
}

const analyzeImages = () => {
	if (images.sourceImage == null || images.crop == null) return

	const { isRotated, angle } = isImageRotated(images.crop)

	handleCrop(isRotated, angle)

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

	const sourceImageLayer = images.sourceImage.data[position.z - 1]

	displayImage({
		imageData: sourceImageLayer.data,
		width: sourceImageLayer.imageWidth,
		height: sourceImageLayer.imageLength,
		canvasElement: sourceCanvas,
	})

	showCropOverlay({isRotated, position, sourceCanvas})

	outputResults()
}

const outputResults = () => {
	document.querySelector("#info-area").style.visibility = "visible"

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
