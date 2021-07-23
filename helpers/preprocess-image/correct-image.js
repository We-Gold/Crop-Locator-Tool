import Image from "image-js"
import { polyfillForTiff } from "../tiff-decoding/polyfill-for-tiff"

/**
 * Corrects a rotated image into a usable crop
 * @param {ArrayBuffer} imageData
 * @param {number} width
 * @param {number} height
 * @param {number} angle
 * @param {number} layers
 * @returns A array that mimics the original tiff data
 */
export const correctRotatedImage = (imageData, width, height, angle, layers = 1) => {
	let image = rotateImage(imageData, width, height, angle)

	image = cropImageFromAngle(image, angle)

	return polyfillForTiff(image, layers)
}

/**
 * Rotates an image to correct for a known prior rotation
 * @param {ArrayBuffer} imageData
 * @param {number} width
 * @param {number} height
 * @param {number} angle
 * @returns
 */
const rotateImage = (imageData, width, height, angle) => {
	let image = new Image(width, height, imageData, { kind: "GREY" })

	image = image.rotate(-angle, { interpolation: "bilinear" })

	return image
}

/**
 * Takes a crop from a rotated iamge to extract a usable section of it
 * @param {Image} image
 * @param {number} angle
 * @returns {Image}
 */
const cropImageFromAngle = (image, angle) => {
	const oldSideLength = Math.max(image.parent.width, image.parent.height)

	const triangleHeight = Math.abs(oldSideLength * Math.sin(radians(angle)))
	const triangleWidth = Math.abs(oldSideLength * Math.cos(radians(angle)))

	const interceptPercentage =
		triangleHeight / (triangleWidth + triangleHeight)

	const smallHypotenuse = interceptPercentage * oldSideLength

	const x = Math.trunc(smallHypotenuse * Math.cos(radians(angle)))
	const y = Math.trunc(
		triangleHeight - smallHypotenuse * Math.sin(radians(angle))
	)

	const width = image.width - y - x
	const height = image.height - x - y

	image = image.crop({ x, y, width, height })

	return image
}

// Convert angle to radians
export const radians = (angle) => (angle * Math.PI) / 180