/**
 * Calculates the dimensions the image will have after being resliced
 * @param {Object} image
 * @param {string} axis
 * @returns The new dimensions of the imaage
 */
 export const calculateReslicedDimensions = (
	image,
	axis,
) => {
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

const resliceDimensionsTop = ({ width, height, length }) => ({
	width,
	height: length,
	length: height,
})

const resliceDimensionsLeft = ({ width, height, length }) => ({
	width: height,
	height: length,
	length: width,
})