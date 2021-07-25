import { images } from "../images-manager"
import {
	calculateOriginalDimensionsForRotatedImage,
	calculateOriginalDimensionsForCroppedImage,
} from "../preprocess-image/calculate-original-dimensions"
import { overlayCrop } from "./display-image"
import { showCroppedAreaOnImage } from "./display-image"
import { sourceCanvas } from "../dom-management/source-canvas"

/**
 * Displays an overlay of the crop on the original image
 */
export const showRotatedCropOverlay = ({
	position,
	isNested = false,
}) => {
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

	overlayCrop(
		sourceCanvas,
		_position,
		{
			w: images.crop.dimensions.width,
			h: images.crop.dimensions.height,
		},
		{ isNested }
	)
}

/**
 * Displays an overlay of the crop on the original image
 */
export const showNormalCropOverlay = ({
	position,
	isNested = false,
}) => {
	// Determine the dimensions of the overlay
	const { position: _position } = calculateOriginalDimensionsForCroppedImage(
		position,
		images.crop.dimensions
	)

	images.crop.position = _position

	overlayCrop(
		sourceCanvas,
		_position,
		{
			w: images.crop.dimensions.width,
			h: images.crop.dimensions.height,
		},
		{ isNested }
	)
}

export const showCropOnBlackBackground = () => {
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