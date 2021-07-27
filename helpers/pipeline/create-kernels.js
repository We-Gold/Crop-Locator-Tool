import { GPU } from "gpu.js"
import { countScansNeededForFullCheck } from "./count-scans-in-area"

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

	// Runs the sum of absolute differences algorithm with the crop,
	// over the entire source image layer.
	// 
	// Algorithm:
	// 		Each gpu thread corresponds to a coordinate (x, y)
	//
	//		Using that coordinate as the top left corner of the crop,
	// 		we take the absolute value of the difference between each pixel
	//		of the crop and the area of the source image (starting at the given coordinate).
	//
	//		Each of these differences are summed, and that is the return value of this kernel
	// 		for each thread.

	const sadKernelFunction = function (sourceImageLayer, cropLayer) {
		// Determine where to compare the crop to the source image for this thread
		const sourceX =
				this.thread.x * this.constants.useEveryXPixel +
				this.constants.originX,
			sourceY =
				this.thread.y * this.constants.useEveryXPixel +
				this.constants.originY
	
		let sum = 0
	
		// March through the source image
		// and compare each of the pixels in the area to the crop
		for (
			let _x = 0;
			_x < this.constants.cropLayerWidth;
			_x += this.constants.useEveryXPixel
		) {
			const x = sourceX + _x
	
			for (
				let _y = 0;
				_y < this.constants.cropLayerLength;
				_y += this.constants.useEveryXPixel
			) {
				const y = sourceY + _y
	
				// Get the array indices for the pixels
				const sourceImageLayerIndex = getImageDataIndex(
					x,
					y,
					this.constants.sourceImageLayerWidth
				)
				const cropLayerIndex = getImageDataIndex(
					x - sourceX,
					y - sourceY,
					this.constants.cropLayerWidth
				)
	
				// Get the pixel values at the given locations
				const sourceImageLayerPixel =
					sourceImageLayer[sourceImageLayerIndex]
				const cropLayerPixel = cropLayer[cropLayerIndex]
	
				// Calculate the absolute difference of the pixels
				const pixelDifference = Math.abs(
					sourceImageLayerPixel - cropLayerPixel
				)
	
				sum += pixelDifference
			}
		}
	
		return sum
	}

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
	// Calculate how many scans to make per axis
	const { xAxisScans, yAxisScans } = countScansNeededForFullCheck(
		sourceImage,
		crop,
		location,
		convertPosition
	)

	// Runs the sum of absolute differences algorithm with the crop,
	// over the entire source image layer.
	// 
	// Algorithm:
	// 		Each gpu thread corresponds to a coordinate (x, y)
	//
	//		Using that coordinate as the top left corner of the crop,
	// 		we take the absolute value of the difference between each pixel
	//		of the crop and the area of the source image (starting at the given coordinate).
	//
	//		Each of these differences are summed, and that is the return value of this kernel
	// 		for each thread.

	const sadKernelFunction = function (sourceImageLayer, cropLayer) {
		// Determine where to compare the crop to the source image for this thread
		const sourceX =
				this.thread.x * this.constants.useEveryXPixel +
				this.constants.originX,
			sourceY =
				this.thread.y * this.constants.useEveryXPixel +
				this.constants.originY
	
		let sum = 0
	
		// March through the source image
		// and compare each of the pixels in the area to the crop
		for (
			let _x = 0;
			_x < this.constants.cropLayerWidth;
			_x += this.constants.useEveryXPixel
		) {
			const x = sourceX + _x
	
			for (
				let _y = 0;
				_y < this.constants.cropLayerLength;
				_y += this.constants.useEveryXPixel
			) {
				const y = sourceY + _y
	
				// Get the array indices for the pixels
				const sourceImageLayerIndex = getImageDataIndex(
					x,
					y,
					this.constants.sourceImageLayerWidth
				)
				const cropLayerIndex = getImageDataIndex(
					x - sourceX,
					y - sourceY,
					this.constants.cropLayerWidth
				)
	
				// Get the pixel values at the given locations
				const sourceImageLayerPixel =
					sourceImageLayer[sourceImageLayerIndex]
				const cropLayerPixel = cropLayer[cropLayerIndex]
	
				// Calculate the absolute difference of the pixels
				const pixelDifference = Math.abs(
					sourceImageLayerPixel - cropLayerPixel
				)
	
				sum += pixelDifference
			}
		}
	
		return sum
	}

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
