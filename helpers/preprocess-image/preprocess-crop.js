import { images, makeImage } from "../images-manager"
import { correctRotatedImage } from "./correct-image"
import { isImageRotated } from "./detect-rotation"
import { cropImage } from "./crop-image"

export const preprocessCrop = () => {
	// Determine if the image has been rotated
	const { isRotated, angle } = isImageRotated(images.crop)

	// Preprocess the image
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

	// Straighten and crop the given image to extract a usable image
	const image = correctRotatedImage(
		crop.data,
		crop.imageWidth,
		crop.imageLength,
		angle,
		images.crop.data.length
	)

	// Update the crop object
	Object.assign(images.crop, { data: image, angle, isRotated: true })
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

	// Update the crop object
	Object.assign(images.crop, { data: crop })
}
