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

	for (let x = sourceX; x < sourceX + cropLayerWidth; x += useEveryXPixel) {
		for (
			let y = sourceY;
			y < sourceY + cropLayerLength;
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
	convertPosition
) => {
	const { useEveryXPixel, useEveryXLayer } = convertPosition()

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
	convertPosition
) => {
	const { xAxisScans, yAxisScans } = countScansNeededForFullCheck(
		sourceImage,
		crop,
		location,
		convertPosition
	)

	const kernelFunction = function (sourceImageLayer, cropLayer, dimensions) {
		const [
			sourceImageLayerWidth,
			cropLayerWidth,
			cropLayerLength,
			useEveryXPixel,
			originX,
			originY,
		] = dimensions

		const x = this.thread.x + originX,
			y = this.thread.y + originY

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
	{ useEveryXLayer, useEveryXPixel }
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

	for (let layer = 0; layer <= zAxisScans; layer += useEveryXLayer) {
		const sourceImageLayer = sourceImage.data[layer]
		const cropLayer = crop.data[0]

		result.push(
			scanningKernel(sourceImageLayer.data, cropLayer.data, dimensions)
		)
	}

	const convertPosition = (coordinate = null) => {
		if (coordinate == null) return { useEveryXPixel, useEveryXLayer }

		return {
			x: coordinate.x * useEveryXPixel,
			y: coordinate.y * useEveryXPixel,
			z: coordinate.z * useEveryXLayer,
		}
	}

	return [result, convertPosition]
}

const confirmMatches = (
	sourceImage,
	crop,
	positions,
	convertPosition,
	{ useEveryXLayer, useEveryXPixel }
) => {
	const kernels = positions.map((location) =>
		createConfirmingKernel(sourceImage, crop, location, convertPosition)
	)

	const matchesToBeScanned = kernels.map((kernel, index) => {
		const { zScanStart, zAxisScans, xScanStart, yScanStart } =
			countScansNeededForFullCheck(
				sourceImage,
				crop,
				positions[index],
				convertPosition
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

		for (
			let layer = zScanStart;
			layer <= zScanStart + zAxisScans;
			layer += useEveryXLayer
		) {
			const sourceImageLayer = sourceImage.data[layer]
			const cropLayer = crop.data[0]

			result.push(
				kernel(sourceImageLayer.data, cropLayer.data, dimensions)
			)
		}

		return result
	})

	const { zScanStart, xScanStart, yScanStart } = countScansNeededForFullCheck(
		sourceImage,
		crop,
		positions[0],
		convertPosition
	)

	const convertMatchPosition = (coordinate = null) => {
		if (coordinate == null) return { useEveryXPixel, useEveryXLayer }

		return {
			x: coordinate.x * useEveryXPixel + xScanStart,
			y: coordinate.y * useEveryXPixel + yScanStart,
			z: coordinate.z * useEveryXLayer + zScanStart,
		}
	}

	return [matchesToBeScanned, convertMatchPosition]
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
	convertPosition,
	threshold = 0.1,
}) => {
	const { useEveryXPixel, useEveryXLayer } = convertPosition()

	const cropMatchThreshold = calculateCropMatchThreshold({
		threshold,
		cropWidth: crop.data[0].imageWidth,
		cropHeight: crop.data[0].imageLength,
		useEveryXPixel,
		useEveryXLayer,
	})

	const relativeMatches = []

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

	if (relativeMatches.length == 0) return null

	const positions = relativeMatches.map((match) => {
		const index = match.index

		return Object.assign(
			convertPosition({ x: index[2], y: index[1], z: index[0] }),
			{ difference: match.difference }
		)
	})

	return positions
}

const flatten = (array) => {
	return array.reduce((a, b) => a.concat(b), [])
}

const optimizedScan = (
	sourceImage,
	crop,
	{ useEveryXPixel, useEveryXLayer, threshold }
) => {
	const [result, convertPosition] = runOptimizedScan(sourceImage, crop, {
		useEveryXPixel,
		useEveryXLayer,
	})

	const positions = findAllCloseMatches({
		result,
		crop,
		convertPosition,
		threshold,
	})

	return [positions, convertPosition, result]
}

const matchesScan = (
	sourceImage,
	crop,
	positions,
	convertPosition,
	{ useEveryXPixel, useEveryXLayer, threshold }
) => {
	const [matches, _convertPosition] = confirmMatches(
		sourceImage,
		crop,
		positions,
		convertPosition,
		{
			useEveryXPixel,
			useEveryXLayer,
		}
	)

	const matchPositions = flatten(
		matches.map((match) => {
			return findAllCloseMatches({
				result: match,
				crop,
				convertPosition: _convertPosition,
				threshold,
			})
		})
	)

	return [matchPositions, _convertPosition, matches]
}

// Determine the best candiate for a match
const determineBestCandidate = (positions) => {
	// Find the position with the smallest difference
	// and return that position
	return positions.reduce(
		(best, candidate) => {
			// Ignore the candidate if it is null
			if (candidate == null) return best

			if (candidate.difference < best.difference) {
				return candidate
			}

			return best
		},
		{ difference: Number.MAX_VALUE }
	)
}

const runPipeline = (sourceImage, crop, layersConfig) => {
	// Loop through all the layers in layersConfig
	// For the first layer, we run an optimized scan, and feed the result to the next layer
	// For all following layers, we run a match scan, and feed the result to the next layer
	// The result of the last layer is the final result
	const pipeline = []

	for (const [i, layerConfig] of layersConfig.entries()) {
		const { useEveryXPixel, useEveryXLayer, threshold } = layerConfig

		if (i === 0) {
			const [positions, convertPosition, result] = optimizedScan(
				sourceImage,
				crop,
				{ useEveryXPixel, useEveryXLayer, threshold }
			)

			pipeline.push([positions, convertPosition, result])

			continue
		}

		// Check to make sure the previous scan found a match
		if (pipeline[i - 1][0] == null) return { errors: ["No match found"] }

		const positions = [determineBestCandidate(pipeline[i - 1][0])]

		const [matchPositions, convertPosition, matches] = matchesScan(
			sourceImage,
			crop,
			positions,
			pipeline[i - 1][1],
			{ useEveryXPixel, useEveryXLayer, threshold }
		)

		pipeline.push([matchPositions, convertPosition, matches])
	}

	return {
		pipeline,
		positions: pipeline[pipeline.length - 1],
		bestPosition: determineBestCandidate(pipeline[pipeline.length - 1][0]),
	}
}

export const findCropInImage = (sourceImage, crop, isRotated = false) => {
	const errors = validateSourceAndCroppedImages(sourceImage, crop)

	if (errors.length > 0) return { errors }

	console.time("pipeline")
	const {
		errors: pipelineErrors,
		pipeline,
		positions,
		bestPosition,
	} = runPipeline(sourceImage, crop, [
		{ useEveryXPixel: 5, useEveryXLayer: 50, threshold: 0.1 },
		{ useEveryXPixel: 1, useEveryXLayer: 5, threshold: 0.06 },
		{
			useEveryXPixel: 1,
			useEveryXLayer: 1,
			threshold: isRotated ? 0.05 : 0.01,
		},
	])
	console.timeEnd("pipeline")

	return { errors: pipelineErrors, pipeline, positions, bestPosition }
}
