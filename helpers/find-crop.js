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
	cropLayerLength,
	useEveryXPixel
) {
	let sum = 0

	for (let x = sourceX; x <= sourceX + cropLayerWidth; x += useEveryXPixel) {
		for (
			let y = sourceY;
			y <= sourceY + cropLayerLength;
			y += useEveryXPixel
		) {
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

const createScanningKernel = (sourceImage, crop, useEveryXPixel = 5) => {
	// Calculate the number of scans needed per axis
	const xAxisScans = Math.trunc(
		Math.abs(sourceImage.data[0].imageWidth - crop.data[0].imageWidth) /
			useEveryXPixel
	)
	const yAxisScans = Math.trunc(
		Math.abs(sourceImage.data[0].imageLength - crop.data[0].imageLength) /
			useEveryXPixel
	)

	const kernelFunction = function (sourceImageLayer, cropLayer, dimensions) {
		const [
			sourceImageLayerWidth,
			cropLayerWidth,
			cropLayerLength,
			useEveryXPixel,
		] = dimensions

		const x = this.thread.x * useEveryXPixel,
			y = this.thread.y * useEveryXPixel

		return calculateAbsoluteDifferenceSum(
			sourceImageLayer,
			cropLayer,
			x,
			y,
			sourceImageLayerWidth,
			cropLayerWidth,
			cropLayerLength,
			useEveryXPixel
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

const calculateDimensionsForScanningKernel = (
	sourceImage,
	crop,
	useEveryXPixel
) => {
	// Use the first layers of the images as samples
	const sourceImageLayer = sourceImage.data[0]
	const cropLayer = crop.data[0]

	return [
		sourceImageLayer.imageWidth,
		cropLayer.imageWidth,
		cropLayer.imageLength,
		useEveryXPixel,
	]
}

export const findCropInImage = (
	sourceImage,
	crop,
	{ useEveryXLayers = 50, useEveryXPixel = 1 } = {}
) => {
	const errors = validateSourceAndCroppedImages(sourceImage, crop)

	if (errors.length > 0) return { errors }

	const scanningKernel = createScanningKernel(
		sourceImage,
		crop,
		useEveryXPixel
	)

	// Group the image dimensions together to bypass the argument limit of the gpu kernel
	const dimensions = calculateDimensionsForScanningKernel(
		sourceImage,
		crop,
		useEveryXPixel
	)

	const zAxisScans = Math.abs(sourceImage.data.length - crop.data.length)

	let result = []

	console.time("full-scan")
	for (let layer = 0; layer <= zAxisScans; layer += useEveryXLayers) {
		const sourceImageLayer = sourceImage.data[layer]
		const cropLayer = crop.data[0]

		result.push(
			scanningKernel(sourceImageLayer.data, cropLayer.data, dimensions)
		)
	}
	console.timeEnd("full-scan")

	return { result }
}

export const calculateCropMatchThreshold = ({
	threshold = 0.1,
	cropWidth,
	cropHeight,
	range = [0, 255],
	useEveryXPixel,
}) => {
	const maxDifference = Math.abs(range[0] - range[1])
	const totalPixels = Math.trunc(
		((cropWidth / useEveryXPixel) * cropHeight) / useEveryXPixel
	)

	return threshold * maxDifference * totalPixels
}
