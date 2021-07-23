import { validateSourceAndCroppedImages } from "./tiff-decoding/validate-images"
import { handleErrors } from "./handle-errors"
import {
	displayImage,
} from "./show-images/display-image"
import { setProgressBarToPercent } from "./dom-management/progress-bar"
import { isImageNested } from "./preprocess-image/image-is-nested"
import { images } from "./images-manager"
import { outputResults } from "./dom-management/output-results"
import {
	showNormalCropOverlay,
	showRotatedCropOverlay,
	showCropOnBlackBackground,
} from "./show-images/show-crops"
import { searchForCrop } from "./search-for-crop"

// For superusers:
// Disabling this will disable the image nesting feature
const isNesting = true

/**
 * Locates the crop and passes the information on to the web interface
 */
export const analyzeImages = async () => {
	if (images.sourceImage == null || images.crop == null) return

	document.querySelector("#replaced-crop-canvas").style.visibility = "hidden"

	document.querySelector("#info-area").style.visibility = "visible"

	document.querySelector("#warning-text").style.display = "none"

	const sourceCanvas = document.querySelector("#source-image-canvas")

	setProgressBarToPercent(0)

	const validationErrors = validateSourceAndCroppedImages(
		images.sourceImage,
		images.crop
	)

	handleErrors(validationErrors)

	if (validationErrors.length > 0) return

	const { errors, bestPosition, isRotated, reslicedDirection } =
		await searchForCrop()

	handleErrors(errors)

	if (errors != undefined && errors.length > 0) {
		const sourceImage = images.sourceImage.data[0]

		displayImage({
			imageData: sourceImage.data,
			width: sourceImage.imageWidth,
			height: sourceImage.imageLength,
			canvasElement: sourceCanvas,
		})

		return
	}

	const position = {
		x: bestPosition.x,
		y: bestPosition.y,
		z: bestPosition.z + 1,
	}

	images.crop.position = position
	images.crop.reslicedDirection = reslicedDirection

	if (images.mainCrop == null) images.mainCrop = images.crop

	const nested = isImageNested(
		{
			x: images.crop.position.x,
			y: images.crop.position.y,
			layer: images.crop.position.z,
			width: images.crop.dimensions.width,
			height: images.crop.dimensions.height,
		},
		{
			x: images.mainCrop.position.x,
			y: images.mainCrop.position.y,
			layer: images.mainCrop.position.z,
			width: images.mainCrop.dimensions.width,
			height: images.mainCrop.dimensions.height,
		}
	)

	if (isNesting && nested) {
		if (isRotated)
			showRotatedCropOverlay({ position, sourceCanvas, isNested: true })
		else showNormalCropOverlay({ position, sourceCanvas, isNested: true })
	} else {
		images.mainCrop = images.crop

		const sourceImageLayer = images.sourceImage.data[position.z - 1]

		displayImage({
			imageData: sourceImageLayer.data,
			width: sourceImageLayer.imageWidth,
			height: sourceImageLayer.imageLength,
			canvasElement: sourceCanvas,
		})

		if (isRotated) showRotatedCropOverlay({ position, sourceCanvas })
		else showNormalCropOverlay({ position, sourceCanvas })
	}

	outputResults()

	await showCropOnBlackBackground()
}
