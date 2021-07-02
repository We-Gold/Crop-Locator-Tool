import { GPU } from "gpu.js"

const gpu = new GPU({ mode: "gpu" })

// Gets the index for the requested position in a given image
gpu.addFunction(function getImageDataIndex(x, y, width) {
	return x + width * y
})

gpu.addFunction(function calculateAbsoluteDifferenceSum(
	sourceImageLayer,
	cropLayer,
	sourceX,
	sourceY,
	sourceImageLayerWidth,
	cropLayerWidth,
	cropLayerLength
) {
	let sum = 0

	for (let x = sourceX; x <= sourceX + cropLayerWidth; x++) {
		for (let y = sourceY; y <= sourceY + cropLayerLength; y++) {
			const sourceImageLayerIndex = getImageDataIndex(
				x,
				y,
				sourceImageLayerWidth
			)
			const cropLayerIndex = getImageDataIndex(
				x - sourceX,
				y - sourceY,
				cropLayerWidth
			)

			const sourceImageLayerPixel =
				sourceImageLayer[sourceImageLayerIndex]
			const cropLayerPixel = cropLayer[cropLayerIndex]

			const pixelDifference = Math.abs(
				sourceImageLayerPixel - cropLayerPixel
			)

			sum += pixelDifference
		}
	}

	return sum
})

const createScanningKernel = (sourceImage, crop) => {
	// Calculate the number of scans needed per axis
	const xAxisScans = Math.abs(
		sourceImage.data[0].imageWidth - crop.data[0].imageWidth
	)
	const yAxisScans = Math.abs(
		sourceImage.data[0].imageLength - crop.data[0].imageLength
	)

	const kernelFunction = function (sourceImageLayer, cropLayer, dimensions) {
		const x = this.thread.x,
			y = this.thread.y

		const [sourceImageLayerWidth, cropLayerWidth, cropLayerLength] =
			dimensions

		return calculateAbsoluteDifferenceSum(
			sourceImageLayer,
			cropLayer,
			x,
			y,
			sourceImageLayerWidth,
			cropLayerWidth,
			cropLayerLength
		)
	}

	return gpu.createKernel(kernelFunction).setOutput([xAxisScans, yAxisScans])
}

const validateSourceAndCroppedImages = (sourceImage, crop) => {
	const errors = []

	// Confirm that the images are defined
	if (sourceImage == null || sourceImage == undefined)
		errors.push("The source image provided is not defined")
	if (crop == null || crop == undefined)
		errors.push("The cropped image provided is not defined")

	// Make sure the source image is larger than the crop made from it
	if (
		sourceImage.data.length < crop.data.length ||
		sourceImage.data[0].imageWidth < crop.data[0].imageWidth ||
		sourceImage.data[0].imageLength < crop.data[0].imageLength
	)
		errors.push(
			"The source image provided is smaller than the cropped image"
		)

	return errors
}

const calculateDimensionsForScanningKernel = (sourceImage, crop) => {
	// Use the first layers of the images as samples
	const sourceImageLayer = sourceImage.data[0]
	const cropLayer = crop.data[0]

	return [
		sourceImageLayer.imageWidth,
		cropLayer.imageWidth,
		cropLayer.imageLength,
	]
}

export const findCropInImage = (sourceImage, crop) => {
	const errors = validateSourceAndCroppedImages(sourceImage, crop)

	if (errors.length > 0) return { errors }

	const scanningKernel = createScanningKernel(sourceImage, crop)

	// Group the image dimensions together to bypass the argument limit of the gpu kernel
	const dimensions = calculateDimensionsForScanningKernel(sourceImage, crop)

	const zAxisScans = Math.abs(sourceImage.data.length - crop.data.length)

	let result = []

	const layersToSkip = 200

	console.time("full-scan")
	for (let layer = 0; layer <= zAxisScans; layer += layersToSkip) {
		const sourceImageLayer = sourceImage.data[layer]
		const cropLayer = crop.data[0]

		result.push(
			scanningKernel(sourceImageLayer.data, cropLayer.data, dimensions)
		)
	}
	console.timeEnd("full-scan")

	return { result }
}
