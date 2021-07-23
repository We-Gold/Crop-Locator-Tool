import { generatePipelineConfig } from "./pipeline/generate-pipeline-config"
import { runPipeline } from "./pipeline/pipeline"

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

	const pipelineConfig = generatePipelineConfig(crop, isRotated)

	const {
		errors: pipelineErrors,
		pipeline,
		bestPosition,
	} = await runPipeline(
		sourceImage,
		crop,
		pipelineConfig,
		pipelineLayerCompleteCallback
	)

	return { errors: pipelineErrors, pipeline, bestPosition }
}
