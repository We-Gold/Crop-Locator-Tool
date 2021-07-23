import { images } from "../images-manager"
import { correctRotatedImage } from "./correct-image"
import { isImageRotated } from "./detect-rotation"
import { cropImage } from "./crop-image"

export const preprocessCrop = () => {
	const { isRotated, angle } = isImageRotated(images.crop)

	if (isRotated) preprocessRotatedCrop(angle)
	else preprocessNormalCrop()

	return { isRotated, angle }
}

/**
 * Converts a rotated image to a usable image
 * @param {number} angle
 */
const preprocessRotatedCrop = (angle) => {
	const crop = images.crop.data[0]

	// Rotate and crop the given image to extract a usable image
	const image = correctRotatedImage(
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
const preprocessNormalCrop = () => {
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
