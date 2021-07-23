/**
 * Checks to make sure the images given are valid
 * @param {Object} sourceImage
 * @param {Object} crop
 * @returns {Array} Any errors found
 */
export const validateSourceAndCroppedImages = (sourceImage, crop) => {
	const errors = []

	// Confirm that the images are defined
	if (sourceImage == null || sourceImage == undefined)
		errors.push("The source image provided is not defined")
	if (crop == null || crop == undefined)
		errors.push("The cropped image provided is not defined")

	// Make sure the source image is larger than the crop made from it
	if (
		sourceImage.data.length < crop.data.length ||
		sourceImage.dimensions.width < crop.dimensions.width ||
		sourceImage.dimensions.height < crop.dimensions.height
	)
		errors.push(
			"The source image provided is smaller than the cropped image"
		)

	// Make sure the crop uploaded is not the same as the source image
	if (
		sourceImage.data.length == crop.data.length &&
		sourceImage.dimensions.width == crop.dimensions.width &&
		sourceImage.dimensions.height == crop.dimensions.height
	)
		errors.push("The crop provided is the same size as the source image")

	return errors
}
