/**
 * Creates an array that mimics the original tiff format
 * @param {Image} image
 * @param {number} layers
 * @returns {Array}
 */
export const polyfillForTiff = (image, layers) => {
	image.imageWidth = image.width
	image.imageLength = image.height

	// Return an array with layer copies of the image
	return Array.from({ length: layers }, (_) => image)
}