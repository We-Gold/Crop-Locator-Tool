/**
 * Generates the config for an image scanning pipeline
 * 
 * Note to superusers:
 * 
 * The numbers used here are hard-coded.
 * 
 * They were acquired experimentally, and they may
 * need to be modified if this system does not produce 
 * the intended results.
 * 
 * @param {Object} crop 
 * @param {boolean} isRotated 
 * @returns A list of pipeline layers
 */
export const generatePipelineConfig = (crop, isRotated) => {
    const useEveryXPixel = selectHowManyPixelsToSkip(crop)

    // Use a higher threshold for rotated images
    // due to interpolation artifacts
    const finalThreshold = isRotated ? 0.03 : 0.01

	// The following pipeline follows a three step process
	// Note: only the results of the scan beneath each threshold are 
	// 		passed on to the next layer.
	// 		Threshold: 0-1, indicates how close of a match the image is
	// 1) Scanning the whole image, skipping 50 layers at a time
	// 2) Scan the the best results of the last layer, skipping 5 layers at a time
	// 3) Scan the the best results of the last layer, scanning each layer and pixel
	return [
		{ useEveryXPixel, useEveryXLayer: 50, threshold: 0.1 },
		{ useEveryXPixel, useEveryXLayer: 5, threshold: 0.12 },
		{
			useEveryXPixel: 1,
			useEveryXLayer: 1,
			threshold: finalThreshold,
		},
	]
}


/**
 * @param {Object} crop
 */
 const selectHowManyPixelsToSkip = (crop) => {
	const referenceDimension = Math.min(crop.data[0].imageWidth, crop.data[0].imageLength)

	if (referenceDimension <= 50) return 1
	if (referenceDimension < 100) return 4

	return 10
}
