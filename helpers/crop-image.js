import Image from "image-js"
import { polyfillForTiff } from "./polyfill-for-tiff"

/**
 * Crops an image to the given dimensions, from the top left corner
 * @param {ArrayBuffer} imageData
 * @param {number} imageWidth
 * @param {number} imageHeight
 * @param {number} layers
 * @param {Object} dimensions The width and height of the crop (will not be used if the image is smaller)
 * @returns
 */
 export const cropImage = (
	imageData,
	imageWidth,
	imageHeight,
	layers,
	{ width = 150, height = 150 } = {}
) => {
	let image = new Image(imageWidth, imageHeight, imageData, { kind: "GREY" })

	const cropWidth = Math.min(width, imageWidth)
	const cropHeight = Math.min(height, imageHeight)

	image = image.crop({
		x: 0,
		y: 0,
		width: cropWidth,
		height: cropHeight,
	})

	return polyfillForTiff(image, layers)
}