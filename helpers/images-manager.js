export const images = {
	sourceImage: null,
	crop: null,
	mainCrop: null,
}

export const resetCrop = () => {
	if (images.crop == null) return

	images.crop.data = images.crop.original
	images.crop.dimensions = images.crop.originalDimensions
}
