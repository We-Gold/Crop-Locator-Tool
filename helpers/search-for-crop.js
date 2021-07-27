import { images } from "./images-manager"
import { findCropInImage } from "./find-crop"
import { preprocessCrop } from "./preprocess-image/preprocess-crop"
import { resliceAndScanFromAxis } from "./reslice-and-scan"
import { pipelineLayerCompleteCallback } from "./dom-management/progress-bar"

export const searchForCrop = async () => {
	let reslicedDirection = null

	// Preprocess the crop before searching for it
	let imageRotatedInfo = preprocessCrop()

	// Attempt to locate the crop in the source image
	let results = await findCropInImage(images.sourceImage, images.crop, {
		isRotated: imageRotatedInfo.isRotated,
		pipelineLayerCompleteCallback,
	})

	// If the normal search didn't locate the crop,
	// try reslicing the image from the top
	if (results.errors != undefined && results.errors.length > 0) {
		const scanResults = await resliceAndScanFromAxis("top")

		imageRotatedInfo = scanResults.imageRotatedInfo
		results = scanResults.results
		reslicedDirection = scanResults.reslicedDirection
	}

	// If the search from the top didn't locate the crop,
	// try reslicing the image from the left
	if (results.errors != undefined && results.errors.length > 0) {
		const scanResults = await resliceAndScanFromAxis("left")

		imageRotatedInfo = scanResults.imageRotatedInfo
		results = scanResults.results
		reslicedDirection = scanResults.reslicedDirection
	}

	return {
		errors: results.errors,
		bestPosition: results.bestPosition,
		isRotated: imageRotatedInfo.isRotated,
		reslicedDirection,
	}
}