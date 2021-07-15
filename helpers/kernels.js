import { GPU } from "gpu.js"
import { countScansNeededForFullCheck } from "./find-crop"

const gpu = new GPU({ mode: "gpu" })

// Gets the index for the requested position in a given image
function getImageDataIndex(x, y, width) {
	return x + width * y
}

gpu.addFunction(getImageDataIndex)

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

	const kernelFunction = function (sourceImageLayer, cropLayer) {
		const sourceX = this.thread.x * this.constants.useEveryXPixel,
			sourceY = this.thread.y * this.constants.useEveryXPixel

		let sum = 0

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
	}

	return gpu
		.createKernel(kernelFunction)
		.setOutput([xAxisScans, yAxisScans])
		.setConstants({
			sourceImageLayerWidth: sourceImage.data[0].imageWidth,
			cropLayerWidth: crop.data[0].imageWidth,
			cropLayerLength: crop.data[0].imageLength,
			useEveryXPixel,
		})
}

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

	const kernelFunction = function (sourceImageLayer, cropLayer) {
		const sourceX =
				this.thread.x * this.constants.useEveryXPixel +
				this.constants.originX,
			sourceY =
				this.thread.y * this.constants.useEveryXPixel +
				this.constants.originY

		let sum = 0

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
	}

	return gpu
		.createKernel(kernelFunction)
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
