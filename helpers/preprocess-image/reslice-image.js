import Image from "image-js"
import { polyfillForTiff } from "../tiff-decoding/polyfill-for-tiff"

/**
 * Reslice an image
 * @param {Object} image
 * @param {string} axis "left", "top"
 */
export const resliceImage = (image, axis = "left", layer = 0) => {
	// Swap the dimensions of the image to match the reslicing algorithm
	const dimensions = calculateReslicedDimensions(image, axis)

	const convertToReslicedPosition =
		axis == "top"
			? convertPositionToTopResliced
			: convertPositionToLeftResliced

	// Reslice the image
	const pixelArray = makeReslicedImage(
		image,
		dimensions,
		convertToReslicedPosition,
		layer
	)

	// Transpose the image (mirror over diagonal axis)
	// Note: this corrects the orientation of the resliced image,
	// which does not intially align with the source image
	const reslicedImage = transposeImage(
		pixelArray,
		dimensions.width,
		dimensions.height
	)

	// Creates the object with all of the data needed to replace the original crop
	const newCrop = {
		data: polyfillForTiff(reslicedImage, dimensions.length),
		original: image.data,
		dimensions: {
			width: reslicedImage.width,
			height: reslicedImage.height,
		},
		originalDimensions: image.dimensions,
	}

	return newCrop
}

const convertPositionToTopResliced = (x, layerIndex, imageWidth) =>
	x + layerIndex * imageWidth
const convertPositionToLeftResliced = (x, layerIndex, imageWidth) =>
	layerIndex + x * imageWidth

/**
 * Reslices an image from the top axis
 * @param {Object} image
 * @param {Object} dimensions
 * @param {Object} layerIndex
 * @returns Typed array of the resulting resliced layer
 */
const makeReslicedImage = (
	image,
	dimensions,
	convertToReslicedPosition,
	layerIndex = 0
) => {
	const outputFormat = { x: dimensions.width, y: dimensions.height }

	const imageWidth = image.dimensions.width

	const output = []

	// March through the given image's pixels,
	// but using the indices for the resliced image.
	// This results in the pixels being in a resliced order.
	for (let y = 0; y < outputFormat.y; y++) {
		for (let x = 0; x < outputFormat.x; x++) {
			const layer = image.data[y]

			const pixel =
				layer.data[convertToReslicedPosition(x, layerIndex, imageWidth)]

			output.push(pixel)
		}
	}

	return new Uint8Array(output)
}

/**
 * Calculates the dimensions the image will have after being resliced
 * @param {Object} image
 * @param {string} axis
 * @returns The new dimensions of the imaage
 */
const calculateReslicedDimensions = (image, axis) => {
	let dimensions = {}

	const currentDimensions = {
		width: image.dimensions.width,
		height: image.dimensions.height,
		length: image.data.length,
	}

	// Swaps the dimensions of the image to match
	// it when it is resliced
	if (axis == "left") dimensions = resliceDimensionsLeft(currentDimensions)
	if (axis == "top") dimensions = resliceDimensionsTop(currentDimensions)

	return dimensions
}

const resliceDimensionsLeft = ({ width, height, length }) => ({
	width: height,
	height: length,
	length: width,
})

const resliceDimensionsTop = ({ width, height, length }) => ({
	width,
	height: length,
	length: height,
})

/**
 * Mirrors the image diagonally
 * @param {Object} imageData
 * @param {Number} imageWidth
 * @param {Number} imageHeight
 * @returns The resulting image
 */
const transposeImage = (imageData, imageWidth, imageHeight) => {
	const image = new Image(imageWidth, imageHeight, imageData, {
		kind: "GREY",
	})

	// Rotate the image 90 degrees to the right
	const rotated = image.rotateRight()

	// Flip the x axis of the image
	const flipped = rotated.flipX()

	return flipped
}
