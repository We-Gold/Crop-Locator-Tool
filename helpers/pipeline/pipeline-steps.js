import { optimizedScan, matchesScan } from "./scan-step"

export const checkForErrors = (pipelineInfo) => {
	let errors = null

	if (
		!previousScanFoundMatch(pipelineInfo) ||
		!pipelineHasValidOutputs(pipelineInfo)
	)
		errors = ["No match found"]

	return errors
}

const previousScanFoundMatch = ({ pipeline, i }) =>
	!(pipeline[i - 1][0] == null || pipeline[i - 1][0].length === 0)

const pipelineHasValidOutputs = ({ pipeline, i }) =>
	pipeline[i - 1][0].some((p) => p != null)

export const pipelineMatchesLayer = ({
	sourceImage,
	crop,
	layerConfig,
	layersConfig,
	incrementIndex,
	pipeline,
	layerCompleteCallback = null,
	i,
}) => {
	const { useEveryXPixel, useEveryXLayer, threshold } = layerConfig

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

	// Increment the progress bar
	if (layerCompleteCallback != null)
		layerCompleteCallback({
			layers: layersConfig.length,
			layerFinished: i + 1,
		})

	incrementIndex()
}

export const pipelineOptimizedLayer = ({
	sourceImage,
	crop,
	layerConfig,
	layersConfig,
	incrementIndex,
	pipeline,
	layerCompleteCallback = null,
	i,
}) => {
	const { useEveryXPixel, useEveryXLayer, threshold } = layerConfig

	// Run an optimized scan, searching the full image for the crop
	const [positions, convertPosition, result] = optimizedScan(
		sourceImage,
		crop,
		{ useEveryXPixel, useEveryXLayer, threshold }
	)

	pipeline.push([positions, convertPosition, result])

	// Increment the progress bar
	if (layerCompleteCallback != null)
		layerCompleteCallback({
			layers: layersConfig.length,
			layerFinished: i + 1,
		})

	incrementIndex()
}

// Determine the best candiate for a match
export const determineBestCandidate = (positions) => {
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
