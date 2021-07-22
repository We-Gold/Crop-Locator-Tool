import { GPU } from "gpu.js"
import { countScansNeededForFullCheck } from "./count-scans-in-area"
import { sadKernelFunction } from "./sad-kernel-function"

const gpu = new GPU({ mode: "gpu" })

// Gets the index for the requested position in a given image
function getImageDataIndex(x, y, width) {
	return x + width * y
}

gpu.addFunction(getImageDataIndex)

/**
 * Creates a kernel for scanning the whole image
 */
export const createScanningKernel = (sourceImage, crop, useEveryXPixel) => {
	// Calculate the number of scans needed per axis
	const xAxisScans = Math.trunc(
		Math.abs(sourceImage.data[0].imageWidth - crop.data[0].imageWidth) /
			useEveryXPixel
	)
	const yAxisScans = Math.trunc(
		Math.abs(sourceImage.data[0].imageLength - crop.data[0].imageLength) /
			useEveryXPixel
	)

	return gpu
		.createKernel(sadKernelFunction)
		.setOutput([xAxisScans, yAxisScans])
		.setConstants({
			sourceImageLayerWidth: sourceImage.data[0].imageWidth,
			cropLayerWidth: crop.data[0].imageWidth,
			cropLayerLength: crop.data[0].imageLength,
			useEveryXPixel,
			originX: 0,
			originY: 0
		})
}

/**
 * Creates a kernel for scanning a specific area of the source image
 */
export const createConfirmingKernel = (
	sourceImage,
	crop,
	location,
	convertPosition,
	useEveryXPixel,
	originX,
	originY
) => {
	const { xAxisScans, yAxisScans } = countScansNeededForFullCheck(
		sourceImage,
		crop,
		location,
		convertPosition
	)

	return gpu
		.createKernel(sadKernelFunction)
		.setOutput([xAxisScans, yAxisScans])
		.setConstants({
			sourceImageLayerWidth: sourceImage.data[0].imageWidth,
			cropLayerWidth: crop.data[0].imageWidth,
			cropLayerLength: crop.data[0].imageLength,
			useEveryXPixel,
			originX,
			originY,
		})
}
