import Image from "image-js"

/**
 * Matches the new dimensions of a rotated image to its original dimensions
 * @param {Object} position
 * @param {Object} currentDimensions
 * @param {Object} oldDimensions
 * @returns {Object} The original dimensions of the image
 */
export const calculateOriginalDimensionsForRotatedImage = (
	position,
	currentDimensions,
	oldDimensions
) => {
	const x =
		position.x -
		Math.round((oldDimensions.width - currentDimensions.width) / 2)
	const y =
		position.y -
		Math.round((oldDimensions.height - currentDimensions.height) / 2)
	const z = position.z

	return {
		position: { x, y, z },
		width: oldDimensions.width,
		height: oldDimensions.height,
	}
}

/**
 * Matches the new dimensions of a cropped image to its original dimensions
 * @param {Object} position
 * @param {Object} oldDimensions
 * @returns {Object} The original dimensions of the image
 */
export const calculateOriginalDimensionsForCroppedImage = (
	position,
	oldDimensions
) => {
	const x = position.x
	const y = position.y
	const z = position.z

	return {
		position: { x, y, z },
		width: oldDimensions.width,
		height: oldDimensions.height,
	}
}

/**
 * Corrects a rotated image into a usable crop
 * @param {ArrayBuffer} imageData
 * @param {number} width
 * @param {number} height
 * @param {number} angle
 * @param {number} layers
 * @returns A array that mimics the original tiff data
 */
export const correctImage = (imageData, width, height, angle, layers = 1) => {
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
	const oldSideLength = image.parent.width

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

// Convert angle to radians
export const radians = (angle) => (angle * Math.PI) / 180

/**
 * Creates an array that mimics the original tiff format
 * @param {Image} image
 * @param {number} layers
 * @returns {Array}
 */
const polyfillForTiff = (image, layers) => {
	image.imageWidth = image.width
	image.imageLength = image.height

	// Return an array with layer copies of the image
	return Array.from({ length: layers }, (_) => image)
}

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

	// Creates the object with all of the data needed to replace the original crop
	const newCrop = {
		data: polyfillForTiff(
			transposeImage(pixelArray, dimensions.width, dimensions.height),
			dimensions.length
		),
		original: image.data,
		dimensions,
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
