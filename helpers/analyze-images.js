import { handleErrors } from "./handle-errors"
import { displayImage } from "./show-images/display-image"
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

	const { errors, bestPosition, isRotated, reslicedDirection } =
		await searchForCrop()

	handleErrors(errors)

	if (errorsArePresent(errors)) displayDefaultLayerOfSourceImage()
	else {
		// The crop was found during the scan
		cropFound = true

		const position = createDuplicatePositionObject(bestPosition)

		addOneToZ(position)

		// Update the crop with its new data
		images.crop.position = position
		images.crop.reslicedDirection = reslicedDirection

		// Define the main crop used for nesting
		if (images.mainCrop == null) images.mainCrop = images.crop

		if (shouldNestImage()) {
			const cropOverlayConfig = {
				position,
				isNested: true,
			}

			// Show the crop overlaid on the main image
			if (isRotated) showRotatedCropOverlay(cropOverlayConfig)
			else showNormalCropOverlay(cropOverlayConfig)
		} else {
			// Update the main crop
			images.mainCrop = images.crop

			displayCurrentLayerOfSourceImage()

			if (isRotated) showRotatedCropOverlay({ position })
			else showNormalCropOverlay({ position })
		}
	}

	return cropFound
}

const errorsArePresent = (errors) => errors != undefined && errors.length > 0

const createDuplicatePositionObject = (position) => Object.assign({}, position)

const addOneToZ = (position) => position.z++
