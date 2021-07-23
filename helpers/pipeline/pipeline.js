import {
	checkForErrors,
	pipelineOptimizedLayer,
	pipelineMatchesLayer,
	determineBestCandidate,
} from "./pipeline-steps"
/**
 * Runs through a given scanning pipeline
 * @param {Object} sourceImage
 * @param {Object} crop
 * @param {Object} layersConfig
 * @returns {Object} The results of the pipeline
 */
export const runPipeline = (
	sourceImage,
	crop,
	layersConfig,
	layerCompleteCallback = null
) => {
	const pipeline = []

	let errors = null

	let i = 0

	const incrementIndex = () => {
		i++
	}

	return new Promise((resolve) => {
        // Loop through the layers of the pipeline asynchronously,
        // allowing us to update the dom while the algorithm is running 
		const interval = setInterval(() => {
			// Return the results of the pipeline
			if (i == layersConfig.length) {
				clearInterval(interval)

				// Make sure the pipeline has a result
				if (pipeline[pipeline.length - 1][0][0] == null)
					errors = ["No match found"]

				resolve(
					errors == null
						? {
								pipeline,
								bestPosition: determineBestCandidate(
									pipeline[pipeline.length - 1][0]
								),
						  }
						: { errors }
				)
			}

			// Delay executing the next layer until the previous has been completed
			if (i == layersConfig.length || i > pipeline.length) return

			// Scan the whole image initially
			if (i === 0)
				pipelineOptimizedLayer({
					sourceImage,
					crop,
					layerConfig: layersConfig[i],
					layersConfig,
					layerCompleteCallback,
					incrementIndex,
					pipeline,
					i,
				})
			else { // Scan for the crop in the best results of the previous scan
				errors = checkForErrors({ pipeline, i })

				if (errors) resolve({ errors })
				else
					pipelineMatchesLayer({
						sourceImage,
						crop,
						layerConfig: layersConfig[i],
						layersConfig,
						layerCompleteCallback,
						incrementIndex,
						pipeline,
						i,
					})
			}
		}, 0)
	})
}
