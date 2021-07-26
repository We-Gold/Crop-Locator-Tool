import Image from "image-js"
import { polyfillForTiff } from "../tiff-decoding/polyfill-for-tiff"

/**
 * Reslice an image
 * @param {Object} image
 * @param {string} axis "left", "top"
 */
export const resliceImage = (image, axis = "left", layer = 0) => {
	const dimensions = calculateReslicedDimensions(image, axis)

	const pixelArray =
		axis == "top"
			? makeReslicedImageTop(image, dimensions, layer)
			: makeReslicedImageLeft(image, dimensions, layer)

	const reslicedImage = transposeImage(pixelArray, dimensions.width, dimensions.height)

	// Creates the object with all of the data needed to replace the original crop
	const newCrop = {
		data: polyfillForTiff(
			reslicedImage,
			dimensions.length
		),
		original: image.data,
		dimensions: {width: reslicedImage.width, height: reslicedImage.height},
		originalDimensions: image.dimensions,
	}

	return newCrop
}

/**
 * Reslices an image from the top axis
 * @param {Object} image
 * @param {Object} dimensions
 * @param {Object} layerIndex
 * @returns Typed array of the resulting resliced layer
 */
const makeReslicedImageTop = (image, dimensions, layerIndex = 0) => {
	const outputFormat = { x: dimensions.width, y: dimensions.height }

	const imageWidth = image.dimensions.width

	const output = []

	for (let y = 0; y < outputFormat.y; y++) {
		for (let x = 0; x < outputFormat.x; x++) {
			const layer = image.data[y]

			const pixel = layer.data[x + layerIndex * imageWidth]

			output.push(pixel)
		}
	}

	return new Uint8Array(output)
}

/**
 * Reslices an image from the left axis
 * @param {Object} image
 * @param {Object} dimensions
 * @param {Object} layerIndex
 * @returns Typed array of the resulting resliced layer
 */
const makeReslicedImageLeft = (image, dimensions, layerIndex = 0) => {
	const outputFormat = { x: dimensions.width, y: dimensions.height }

	const imageWidth = image.dimensions.width

	const output = []

	for (let y = 0; y < outputFormat.y; y++) {
		for (let x = 0; x < outputFormat.x; x++) {
			const layer = image.data[y]

			const pixel = layer.data[layerIndex + x * imageWidth]

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
	if (axis == "left") {
		return {
			width: image.dimensions.height,
			height: image.data.length,
			length: image.dimensions.width,
		}
	}
	if (axis == "top") {
		return {
			width: image.dimensions.width,
			height: image.data.length,
			length: image.dimensions.height,
		}
	}
}

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
