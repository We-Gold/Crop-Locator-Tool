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
