import { createImageUploadCallback } from "../tiff-decoding/input-upload-handler"
import { replaceCropInSourceImage } from "../show-images/display-image"
import { handleGuideTextToggle } from "./guide-text"
import { images } from "../images-manager"
import { analyzeImages } from "../analyze-images"

export const addUploadHandlers = () => {
	const {
		replaceCropUploadHandler,
		sourceImageUploadHandler,
		cropImageUploadHandler,
	} = createUploadListeners()

	window.addEventListener("load", function () {
		document
			.querySelector("#new-crop-input")
			.addEventListener("change", replaceCropUploadHandler)

		document
			.querySelector("#source-image-input")
			.addEventListener("change", sourceImageUploadHandler)

		document
			.querySelector("#crop-image-input")
			.addEventListener("change", cropImageUploadHandler)

		document
			.querySelector("#toggle-guide-text")
			.addEventListener("click", handleGuideTextToggle)
	})
}

const createUploadListeners = () => {
	const sourceImageUploadHandler = createImageUploadCallback({
		callback: (image) => {
			images.sourceImage = image

			analyzeImages()
		},
	})

	const cropImageUploadHandler = createImageUploadCallback({
		callback: (image) => {
			images.crop = image

			analyzeImages()
		},
	})

	const replaceCropUploadHandler = createImageUploadCallback({
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
