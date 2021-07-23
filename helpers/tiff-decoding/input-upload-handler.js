import { handleErrors } from "../handle-errors"
import { loadImage } from "./load-image"

/* From: https://stackoverflow.com/questions/7460272/getting-image-dimensions-using-javascript-file-api */
const getHeightAndWidthFromDataUrl = (dataURL) =>
	new Promise((resolve) => {
		const img = new Image()
		img.onload = () => {
			resolve({
				imageHeight: img.height,
				imageWidth: img.width,
			})
		}
		img.src = dataURL
	})

export const createImageUploadCallback = ({
	errorHandler = handleErrors,
	callback,
}) => {
	return async (event) => {
		// Store the file that was uploaded
		const file = event.target.files[0]

		const getImageDimensions = async () => {
			// Convert the file to a data url
			const dataURL = window.URL.createObjectURL(file)

			// Extract the width and height from the image
			const dimensions = await getHeightAndWidthFromDataUrl(dataURL)

			return dimensions
		}

		// Extract the raw data from the file
		const arrayBuffer = await file.arrayBuffer()

		// Attempt to load the file
		const { data, errors } = await loadImage({
			arrayBuffer,
			getImageDimensions,
		})
		// Handle any errors that arise
		errorHandler(errors)

		if (data == null) return

		callback({
			data,
			original: data,
			dimensions: {
				width: data[0].imageWidth,
				height: data[0].imageLength,
			},
			originalDimensions: {
				width: data[0].imageWidth,
				height: data[0].imageLength,
			},
		})
	}
}
