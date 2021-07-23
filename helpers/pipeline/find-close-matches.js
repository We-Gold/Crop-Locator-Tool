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
export const findAllCloseMatches = ({
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
