import { handleErrors } from "./handle-errors"
import { images } from "./images-manager"
import {
	showNormalCropOverlay,
	showRotatedCropOverlay,
} from "./show-images/show-crops"
import { searchForCrop } from "./search-for-crop"
import {
	displayCurrentLayerOfSourceImage,
	displayDefaultLayerOfSourceImage,
} from "./show-images/display-commands"
import { shouldNestImage } from "./preprocess-image/should-nest-image"

/**
 * Locates the crop and passes the information on to the web interface
 */
export const analyzeImages = async () => {
	let cropFound = false

	// Searches the source image for the crop
	const { errors, bestPosition, isRotated, reslicedDirection } =
		await searchForCrop()

	// Display any errors in the web interface
	handleErrors(errors)

	// Displays a layer of the source image if the crop could not be found
	if (errorsArePresent(errors)) displayDefaultLayerOfSourceImage()
	else {
		// The crop was found during the scan
		cropFound = true

		// Creates a copy of the location of crop for later use
		const position = createDuplicatePositionObject(bestPosition)
		addOneToZ(position)

		// Update the crop with its new data
		images.crop.position = position
		images.crop.reslicedDirection = reslicedDirection

		// Define the main crop used for nesting
		if (images.mainCrop == null) images.mainCrop = images.crop

		// Determine if this image is nested within 
		// the previously scanned image
		const nestImage = shouldNestImage()

		if (nestImage) {
			// Update the main crop
			images.mainCrop = images.crop
		} else {
			// Display the correct layer of the source image
			displayCurrentLayerOfSourceImage()
		}

		const cropOverlayConfig = {
			position,
			isNested: nestImage,
		}

		// Show the crop overlaid on the main image
		if (isRotated) showRotatedCropOverlay(cropOverlayConfig)
		else showNormalCropOverlay(cropOverlayConfig)
	}

	return cropFound
}

const errorsArePresent = (errors) => errors != undefined && errors.length > 0

const createDuplicatePositionObject = (position) => Object.assign({}, position)

const addOneToZ = (position) => position.z++
