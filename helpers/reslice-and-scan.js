import { images } from "./images-manager"
import { preprocessCrop } from "./preprocess-image/preprocess-crop"
import { findCropInImage } from "./find-crop"
import { resliceImage } from "./preprocess-image/reslice-image"
import { pipelineLayerCompleteCallback } from "./dom-management/progress-bar"

export const resliceAndScanFromAxis = async (axis) => {
	// Reset the crop
	images.crop.data = images.crop.original
	images.crop.dimensions = images.crop.originalDimensions

	resliceCrop(axis)

	// Preprocess the crop before searching for it
	const imageRotatedInfo = preprocessCrop()

	// Attempt to locate the crop in the source image
	const results = await findCropInImage(images.sourceImage, images.crop, {
		isRotated: imageRotatedInfo.isRotated,
		isResliced: true,
		pipelineLayerCompleteCallback,
	})

	return { imageRotatedInfo, results, reslicedDirection: axis }
}

const resliceCrop = (axis, layer = 0) => {
	images.crop = resliceImage(images.crop, axis, layer)
}