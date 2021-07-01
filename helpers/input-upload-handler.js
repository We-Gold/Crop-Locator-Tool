import { handleErrors } from "./handle-errors"
import { loadImage } from "./load-image"

export const createImageUploadCallback = ({
	errorHandler = handleErrors,
	callback,
}) => {
	return async (event) => {
		// Store the file that was uploaded
		const file = event.target.files[0]

		// Extract the raw data from the file
		const arrayBuffer = await file.arrayBuffer()

		// Attempt to load the file (confirms that it is a tiff)
		const { data, errors } = await loadImage({ arrayBuffer })

		// Handle any errors that arise
		errorHandler(errors)

		callback(data)
	}
}
