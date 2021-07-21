import { createScanningKernel, createConfirmingKernel } from "./kernels"

const constrainNumber = (number, min, max) =>
	Math.min(Math.max(number, min), max)

/**
 * Calculates where to scan given a previous scan
 * @param {Object} sourceImage Tiff image
 * @param {Object} crop Tiff-like image
 * @param {Object} location
 * @param {Function} convertPosition
 * @returns
 */
export const countScansNeededForFullCheck = (
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

/**
 * Runs a scan of the entire original image to identify potential locations of the given crop
 * @param {Object} sourceImage
 * @param {Object} crop
 * @param {Object} config How many layers to skip and how many pixels to skip in the scan
 * @returns The result of the scan and a function to turn indices of the results into positions on the image
 */
const runOptimizedScan = (
	sourceImage,
	crop,
	{ useEveryXLayer, useEveryXPixel }
) => {
	// Create a kernel on the gpu
	const scanningKernel = createScanningKernel(
		sourceImage,
		crop,
		useEveryXPixel
	)

	const zAxisScans = Math.abs(sourceImage.data.length - crop.data.length)

	let result = []

	// Scan each layer of the source image on the gpu
	for (let layer = 0; layer <= zAxisScans; layer += useEveryXLayer) {
		const sourceImageLayer = sourceImage.data[layer]
		const cropLayer = crop.data[0]

		result.push(scanningKernel(sourceImageLayer.data, cropLayer.data))
	}

	scanningKernel.destroy()

	// Converts the given index of the results to a true image coordinate
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

/**
 * Scans the areas around the given positions to see how well they match
 * @param {Object} sourceImage
 * @param {Object} crop
 * @param {Array} positions
 * @param {Function} convertPosition
 * @param {Object} config How many layers to skip and how many pixels to skip in the scan
 * @returns The result of the scan and a function to turn indices of the results into positions on the image
 */
const confirmMatches = (
	sourceImage,
	crop,
	positions,
	convertPosition,
	{ useEveryXLayer, useEveryXPixel }
) => {
	// Creates a gpu kernel for each given position
	const kernels = positions.map((location, index) => {
		// Calculate where the scan should start
		const { xScanStart, yScanStart } = countScansNeededForFullCheck(
			sourceImage,
			crop,
			positions[index],
			convertPosition
		)

		// Creates the gpu kernel
		return createConfirmingKernel(
			sourceImage,
			crop,
			location,
			convertPosition,
			useEveryXPixel,
			xScanStart,
			yScanStart
		)
	})

	// Runs all of the kernels and stores their results
	const matchesToBeScanned = kernels.map((kernel, index) => {
		const { zScanStart, zAxisScans } = countScansNeededForFullCheck(
			sourceImage,
			crop,
			positions[index],
			convertPosition
		)

		let result = []

		// March through and scan the layers of each location
		for (
			let layer = zScanStart;
			layer <= zScanStart + zAxisScans;
			layer += useEveryXLayer
		) {
			const sourceImageLayer = sourceImage.data[layer]
			const cropLayer = crop.data[0]

			result.push(kernel(sourceImageLayer.data, cropLayer.data))
		}

		kernel.destroy()

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

/**
 * Calculates the threshold for an image to be a match
 * @param {Object} config
 * @returns {number}
 */
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

/**
 * Identify the best matches found by the scan
 * @param {Object} config
 * @returns {Array}
 */
const findAllCloseMatches = ({
	result,
	crop,
	convertPosition,
	threshold = 0.1,
}) => {
	const { useEveryXPixel, useEveryXLayer } = convertPosition()

	// Calculate the threshold for an image to be a match
	const cropMatchThreshold = calculateCropMatchThreshold({
		threshold,
		cropWidth: crop.data[0].imageWidth,
		cropHeight: crop.data[0].imageLength,
		useEveryXPixel,
		useEveryXLayer,
	})

	const relativeMatches = []

	// March through the results of the scan and find all of the scans that are within the threshold
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

	// Converts the indices into true image coordinates
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

// Performs a scan of the full image
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

// Performs a scan of all given locations
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

/**
 * Runs through a given scanning pipeline
 * @param {Object} sourceImage
 * @param {Object} crop
 * @param {Object} layersConfig
 * @returns {Object} The results of the pipeline
 */
const runPipeline = (
	sourceImage,
	crop,
	layersConfig,
	layerCompleteCallback = null
) => {
	const pipeline = []

	let i = 0

	return new Promise((resolve) => {
		const interval = setInterval(() => {
			if (i == layersConfig.length) {
				clearInterval(interval)

				if (pipeline[pipeline.length - 1][0][0] == null) {
					resolve({ errors: ["No match found"] })

					return
				}

				resolve({
					pipeline,
					bestPosition: determineBestCandidate(
						pipeline[pipeline.length - 1][0]
					),
				})

				return
			}

			if (i > pipeline.length) return

			const { useEveryXPixel, useEveryXLayer, threshold } =
				layersConfig[i]

			// Scan the whole image initially
			if (i === 0) {
				const [positions, convertPosition, result] = optimizedScan(
					sourceImage,
					crop,
					{ useEveryXPixel, useEveryXLayer, threshold }
				)

				pipeline.push([positions, convertPosition, result])

				if (layerCompleteCallback != null)
					layerCompleteCallback({
						layers: layersConfig.length,
						layerFinished: i + 1,
					})

				i++

				return
			}

			// Check to make sure the previous scan found a match
			if (pipeline[i - 1][0] == null || pipeline[i - 1][0].length === 0) {
				clearInterval(interval)

				resolve({ errors: ["No match found"] })

				return
			}

			// Check to make sure the elements of the positions from the previous scan are not null
			if (!pipeline[i - 1][0].some((p) => p != null)) {
				clearInterval(interval)

				resolve({ errors: ["No match found"] })

				return
			}

			const positions = [determineBestCandidate(pipeline[i - 1][0])]

			// Scan the best match from the previous scan
			const [matchPositions, convertPosition, matches] = matchesScan(
				sourceImage,
				crop,
				positions,
				pipeline[i - 1][1],
				{ useEveryXPixel, useEveryXLayer, threshold }
			)

			pipeline.push([matchPositions, convertPosition, matches])

			if (layerCompleteCallback != null)
				layerCompleteCallback({
					layers: layersConfig.length,
					layerFinished: i + 1,
				})

			i++
		}, 0)
	})
}

/**
 * Scans the source image and the crop to determine the original location of the crop
 * @param {Object} sourceImage
 * @param {Object} crop
 * @param {boolean} isRotated
 * @param {Function} pipelineLayerCompleteCallback Runs on the completion of a layer of the pipeline
 * @returns The results of the scans
 */
export const findCropInImage = async (
	sourceImage,
	crop,
	{ isRotated = false, pipelineLayerCompleteCallback = null } = {}
) => {
	const useEveryXPixel = selectHowManyPixelsToSkip(crop)

	const defaultLayersConfig = [
		{ useEveryXPixel, useEveryXLayer: 50, threshold: 0.1 },
		{ useEveryXPixel, useEveryXLayer: 5, threshold: 0.12 },
		{
			useEveryXPixel: 1,
			useEveryXLayer: 1,
			threshold: 0.01,
		},
	]

	const rotatedLayersConfig = [
		{ useEveryXPixel, useEveryXLayer: 50, threshold: 0.1 },
		{ useEveryXPixel, useEveryXLayer: 5, threshold: 0.12 },
		{
			useEveryXPixel: 1,
			useEveryXLayer: 1,
			threshold: 0.03,
		},
	]

	const {
		errors: pipelineErrors,
		pipeline,
		bestPosition,
	} = await runPipeline(
		sourceImage,
		crop,
		isRotated ? rotatedLayersConfig : defaultLayersConfig,
		pipelineLayerCompleteCallback
	)

	return { errors: pipelineErrors, pipeline, bestPosition }
}

/**
 * @param {Object} crop
 */
const selectHowManyPixelsToSkip = (crop) => {
	const referenceDimension = Math.min(crop.data[0].imageWidth, crop.data[0].imageLength)

	if (referenceDimension <= 50) return 1
	if (referenceDimension < 100) return 4

	return 10
}
