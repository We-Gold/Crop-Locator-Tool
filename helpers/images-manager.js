export const images = {
	sourceImage: null,
	crop: null,
	mainCrop: null,
}

// Creates a new image object
// Note: while this is not necessary,
// having a standard image object
// keeps the code consistent
export const makeImage = ({
	data = [],
	dimensions = null,
	original = null,
	originalDimensions = null,
	angle = null,
	isRotated = null,
	reslicedDirection = null,
	position = null,
}) => {
	// Attempt to get the dimensions from the image data provided
	dimensions = dimensions ?? getDimensionsFromImageData(data)

	// Use the data and dimensions as default values
	original = original ?? data
	originalDimensions = originalDimensions ?? dimensions

	return {
		data,
		dimensions,
		original,
		originalDimensions,
		angle,
		isRotated,
		reslicedDirection,
		position,
	}
}

const getDimensionsFromImageData = (data) => {
	let dimensions = {}

	const dataIsEmpty = data.length == 0

	if (dataIsEmpty || imageHasNoDimensions(data))
		dimensions = { width: 0, height: 0 }
	else dimensions = getImageDimensions(data)

	return dimensions
}

const imageHasNoDimensions = (data) =>
	data[0].imageWidth == undefined || data[0].imageLength == undefined

const getImageDimensions = (data) => ({
	width: data[0].imageWidth,
	height: data[0].imageLength,
})
