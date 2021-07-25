import { images } from "../images-manager"
import { analyzeImages } from "../analyze-images"
import { createImageUploadHandler } from "../tiff-decoding/input-upload-handler"
import { replaceCropInSourceImage } from "../show-images/display-image"
import { setInitialStylesForDOMElements } from "./initial-styles"
import { validateSourceAndCroppedImages } from "../tiff-decoding/validate-images"
import { handleErrors } from "../handle-errors"
import { outputResults } from "./output-results"
import { showCropOnBlackBackground } from "../show-images/show-crops"

export const createUploadListeners = () => {
	const sourceImageUploadHandler = createImageUploadHandler({
		callback: createMainUploadCallback("sourceImage"),
	})

	const cropImageUploadHandler = createImageUploadHandler({
		callback: createMainUploadCallback("crop"),
	})

	const replaceCropUploadHandler = createImageUploadHandler({
		callback: (image) => {
			if (images.crop == null || images.crop.position == null) return
			if (
				images.crop.dimensions.width != image.dimensions.width ||
				images.crop.dimensions.height != image.dimensions.height
			) {
				document.querySelector("#warning-text").style.display = "block"

				return
			}

			document.querySelector("#warning-text").style.display = "none"

			const replacedCropCanvas = document.querySelector(
				"#replaced-crop-canvas"
			)

			const sourceImageLayer =
				images.sourceImage.data[images.crop.position.z - 1]

			replaceCropInSourceImage({
				imageData: sourceImageLayer.data,
				width: sourceImageLayer.imageWidth,
				height: sourceImageLayer.imageLength,
				canvasElement: replacedCropCanvas,
				cropPosition: images.crop.position,
				cropDimensions: images.crop.dimensions,
				angle: images.crop.isRotated ? images.crop.angle : null,
				newCrop: image,
			})
		},
	})

	return {
		replaceCropUploadHandler,
		sourceImageUploadHandler,
		cropImageUploadHandler,
	}
}

const imagesAreDefined = () => images.sourceImage != null && images.crop != null

const imagesAreValid = () => {
    const validationErrors = validateSourceAndCroppedImages(
		images.sourceImage,
		images.crop
	)

	handleErrors(validationErrors)

	return validationErrors.length == 0
}

const createMainUploadCallback = (imageToModify) => {
	return async (image) => {
		images[imageToModify] = image

        // Check to make sure both images are valid
		if (!imagesAreDefined() || !imagesAreValid()) return

        setInitialStylesForDOMElements()

        const cropFound = await analyzeImages()
            
        if (cropFound) {
            outputResults()

            showCropOnBlackBackground()
        }
	}
}
