import { handleErrors } from "../handle-errors"
import { makeImage } from "../images-manager"
import { loadImage } from "./load-image"

export const createImageUploadHandler = ({
	errorHandler = handleErrors,
	callback,
}) => {
	return async (event) => {
		// Store the file that was uploaded
		const file = event.target.files[0]

		// Extract the raw data from the file
		const arrayBuffer = await file.arrayBuffer()

		// Attempt to load the file
		const { data, errors } = await loadImage({
			arrayBuffer,
		})
		// Handle any errors that arise
		errorHandler(errors)

		if (data == null) return

		const image = makeImage({ data })

		callback(image)
	}
}
