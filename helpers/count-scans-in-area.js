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

const constrainNumber = (number, min, max) =>
	Math.min(Math.max(number, min), max)