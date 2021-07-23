/**
 * Determines if one image is inside the other
 * @param {Object} childImage Props: x, y, width, height, layer
 * @param {Object} parentImage Props: x, y, width, height, layer
 */
export const isImageNested = (childImage, parentImage) => {
    if(childImage.layer != parentImage.layer) return false

	const topLeftIsInside =
		parentImage.x < childImage.x && parentImage.y < childImage.y

	const widthIsValid =
		parentImage.x + parentImage.width > childImage.x + childImage.width
	const heightIsValid =
		parentImage.y + parentImage.height > childImage.y + childImage.height

    return topLeftIsInside && widthIsValid && heightIsValid
}
