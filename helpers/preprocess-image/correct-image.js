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
export const correctRotatedImage = (
	imageData,
	width,
	height,
	angle,
	layers = 1
) => {
	// Rotate the image to correct for its original rotation
	const rotatedImage = rotateImage(imageData, width, height, angle)

	// Crop a usable area from the rotated image
	// Note: rotated images have large areas of black and white;
	// 		 that is the reason for cropping the image afterwards.
	const croppedImage = cropImageFromAngle(rotatedImage, angle)

	return polyfillForTiff(croppedImage, layers)
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
	const image = new Image(width, height, imageData, { kind: "GREY" })

	// Rotate the image to correct for the original rotation
	const rotatedImage = image.rotate(-angle, { interpolation: "bilinear" })

	return rotatedImage
}

/**
 * Takes a crop from a rotated iamge to extract a usable section of it
 * @param {Image} image
 * @param {number} angle
 * @returns {Image}
 */
const cropImageFromAngle = (image, angle) => {
	const { x, y } = calculateTopLeftCornerOfCrop(image, angle)

	const width = image.width - y - x
	const height = image.height - x - y

	image = image.crop({ x, y, width, height })

	return image
}

const calculateTopLeftCornerOfCrop = (image, angle) => {
	// Context: After a rotated image has been rotated back to straighten it,
	// it has "white triangles" surrounding it, where there is no data.
	//
	// These triangles can be used to calculate the position for the top 
	// left corner of the crop.
	//
	// Algorithm:
	// 		The side length of the original image equivalent to the 
	// 		hypotenuse of the top left white triangle, so that is stored.
	//
	// 		Next, the triangle's width and height are calculated.
	//
	// 		Using the width and height, we can calculate how far along the image's
	// 		edge we should start the crop.
	//
	// 		Finally, that is converted to cartesian coordinates.

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

	return { x, y }
}

// Convert angle to radians
export const radians = (angle) => (angle * Math.PI) / 180
