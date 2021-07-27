import { createScanningKernel, createConfirmingKernel } from "./create-kernels"
import { countScansNeededForFullCheck } from "./count-scans-in-area"

/**
 * Runs a scan of the entire original image to identify potential locations of the given crop
 * @param {Object} sourceImage
 * @param {Object} crop
 * @param {Object} config How many layers to skip and how many pixels to skip in the scan
 * @returns The result of the scan and a function to turn indices of the results into positions on the image
 */
export const runOptimizedScan = (
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

	// Determine the range of layers to scan
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
export const confirmMatches = (
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

		// Create a gpu kernel for the given position
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
		// Calculate the region of the image to scan
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
