import { runOptimizedScan, confirmMatches } from "./run-scans"
import { findAllCloseMatches } from "./find-close-matches"

const flatten = (array) => {
	return array.reduce((a, b) => a.concat(b), [])
}

// Performs a scan of the full image
export const optimizedScan = (
	sourceImage,
	crop,
	{ useEveryXPixel, useEveryXLayer, threshold }
) => {
	// Scan each layer of the image for the crop
	const [result, convertPosition] = runOptimizedScan(sourceImage, crop, {
		useEveryXPixel,
		useEveryXLayer,
	})

	// Finds all potential matches under the given threshold
	const positions = findAllCloseMatches({
		result,
		crop,
		convertPosition,
		threshold,
	})

	return [positions, convertPosition, result]
}

// Performs a scan of all given locations
export const matchesScan = (
	sourceImage,
	crop,
	positions,
	convertPosition,
	{ useEveryXPixel, useEveryXLayer, threshold }
) => {
	// Scan the area around the given potential match
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

	// Finds all potential matches under the given threshold
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
