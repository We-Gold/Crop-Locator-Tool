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

	const imageRotatedInfo = preprocessCrop()

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