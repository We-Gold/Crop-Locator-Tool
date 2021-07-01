const validateSourceAndCroppedImages = (sourceImage, crop) => {
	const errors = []

	// Confirm that the images are defined
	if (sourceImage == null || sourceImage == undefined)
		errors.push("The source image provided is not defined")
	if (crop == null || crop == undefined)
		errors.push("The cropped image provided is not defined")

	// Make sure the source image is larger than the crop made from it
	if (sourceImage.length < crop.length)
		errors.push(
			"The source image provided is smaller than the cropped image"
		)

	return errors
}

export const findCropInImage = (sourceImage, crop) => {
	const errors = validateSourceAndCroppedImages(sourceImage, crop)

	if (errors.length > 0) return { errors }

	console.log(sourceImage)
	console.log(crop)

    return {}
}
