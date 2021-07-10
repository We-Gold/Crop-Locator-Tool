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

const createScanningKernel = (sourceImage, crop, useEveryXPixel) => {
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

const constrainNumber = (number, min, max) =>
	Math.min(Math.max(number, min), max)

const countScansNeededForFullCheck = (
	sourceImage,
	crop,
	location,
	useEveryXPixel,
	useEveryXLayer
) => {
	const xAxisMax = Math.abs(
		sourceImage.data[0].imageWidth - crop.data[0].imageWidth
	)
	const xScanStart = constrainNumber(location.x - useEveryXPixel, 0, xAxisMax)
	const xScanEnd = constrainNumber(location.x + useEveryXPixel, 0, xAxisMax)
	const xAxisScans = xScanEnd - xScanStart

	const yAxisMax = Math.abs(
		sourceImage.data[0].imageLength - crop.data[0].imageLength
	)
	const yScanStart = constrainNumber(location.y - useEveryXPixel, 0, yAxisMax)
	const yScanEnd = constrainNumber(location.y + useEveryXPixel, 0, yAxisMax)
	const yAxisScans = yScanEnd - yScanStart

	const zAxisMax = Math.abs(sourceImage.data.length - crop.data.length)
	const zScanStart = constrainNumber(location.z - useEveryXLayer, 0, zAxisMax)
	const zScanEnd = constrainNumber(location.z + useEveryXLayer, 0, zAxisMax)
	const zAxisScans = zScanEnd - zScanStart

	return {
		xScanStart,
		xAxisScans,
		yScanStart,
		yAxisScans,
		zScanStart,
		zAxisScans,
	}
}

const createConfirmingKernel = (
	sourceImage,
	crop,
	location,
	useEveryXPixel,
	useEveryXLayer
) => {
	const { xAxisScans, yAxisScans } = countScansNeededForFullCheck(
		sourceImage,
		crop,
		location,
		useEveryXPixel,
		useEveryXLayer
	)

	const kernelFunction = function (sourceImageLayer, cropLayer, dimensions) {
		const [
			sourceImageLayerWidth,
			cropLayerWidth,
			cropLayerLength,
			_,
			originX,
			originY,
		] = dimensions

		const x = this.thread.x + originX,
			y = this.thread.y + originY

		const useEveryXPixel = 1

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
	useEveryXPixel,
	originX = 0,
	originY = 0
) => {
	// Use the first layers of the images as samples
	const sourceImageLayer = sourceImage.data[0]
	const cropLayer = crop.data[0]

	return [
		sourceImageLayer.imageWidth,
		cropLayer.imageWidth,
		cropLayer.imageLength,
		useEveryXPixel,
		originX,
		originY,
	]
}

const runOptimizedScan = (
	sourceImage,
	crop,
	{ useEveryXLayer = 50, useEveryXPixel = 5 } = {}
) => {
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

	console.time("optimized-scan")
	for (let layer = 0; layer <= zAxisScans; layer += useEveryXLayer) {
		const sourceImageLayer = sourceImage.data[layer]
		const cropLayer = crop.data[0]

		result.push(
			scanningKernel(sourceImageLayer.data, cropLayer.data, dimensions)
		)
	}
	console.timeEnd("optimized-scan")

	return result
}

const confirmMatches = (
	sourceImage,
	crop,
	positions,
	{ useEveryXLayer = 50, useEveryXPixel = 5 } = {}
) => {
	const adjustedXPixel = Math.trunc(useEveryXPixel/2)
	const adjustedXLayer = Math.trunc(useEveryXLayer/2)

	const kernels = positions.map((location) =>
		createConfirmingKernel(
			sourceImage,
			crop,
			location,
			adjustedXPixel,
			adjustedXLayer
		)
	)

	console.time("match-scan")
	const matchesToBeScanned = kernels.map((kernel, index) => {
		const { zScanStart, zAxisScans, xScanStart, yScanStart } = countScansNeededForFullCheck(
			sourceImage,
			crop,
			positions[index],
			adjustedXPixel,
			adjustedXLayer
		)

		// Group the image dimensions together to bypass the argument limit of the gpu kernel
		const dimensions = calculateDimensionsForScanningKernel(
			sourceImage,
			crop,
			useEveryXPixel,
			xScanStart,
			yScanStart
		)

		let result = []

		for (let layer = zScanStart; layer <= zScanStart + zAxisScans; layer += 1) {
			const sourceImageLayer = sourceImage.data[layer]
			const cropLayer = crop.data[0]

			result.push(
				kernel(sourceImageLayer.data, cropLayer.data, dimensions)
			)
		}

		return result
	})
	console.timeEnd("match-scan")

	return matchesToBeScanned
}

const calculateCropMatchThreshold = ({
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

const findAllCloseMatches = ({
	result,
	crop,
	useEveryXPixel,
	useEveryXLayer,
	threshold = 0.1,
}) => {
	const cropMatchThreshold = calculateCropMatchThreshold({
		threshold,
		cropWidth: crop.data[0].imageWidth,
		cropHeight: crop.data[0].imageLength,
		useEveryXPixel,
		useEveryXLayer,
	})

	const relativeMatches = []

	console.time("threshold")
	for (const [z, layer] of Object.entries(result)) {
		for (const [y, array] of Object.entries(layer)) {
			for (const [x, number] of Object.entries(array)) {
				if (number < cropMatchThreshold) {
					const index = [z, y, x].map((n) => parseInt(n))

					relativeMatches.push({ difference: number, index })
				}
			}
		}
	}
	console.timeEnd("threshold")

	if (relativeMatches.length == 0)
		return console.log("This crop is not from the image!")

	const positions = relativeMatches.map((match) => {
		const index = match.index

		return {
			x: index[2] * useEveryXPixel,
			y: index[1] * useEveryXPixel,
			z: index[0] * useEveryXLayer,
		}
	})

	console.log(positions)

	return positions
}

export const findCropInImage = (
	sourceImage,
	crop,
	{ useEveryXLayer = 50, useEveryXPixel = 5 } = {}
) => {
	const errors = validateSourceAndCroppedImages(sourceImage, crop)

	if (errors.length > 0) return { errors }

	const result = runOptimizedScan(sourceImage, crop, {
		useEveryXLayer,
		useEveryXPixel,
	})

	const positions = findAllCloseMatches({
		result,
		crop,
		useEveryXPixel,
		useEveryXLayer,
		threshold: 0.1,
	})

	const matches = confirmMatches(sourceImage, crop, positions, {
		useEveryXPixel,
		useEveryXLayer,
	})

	return { result, positions, matches }
}
