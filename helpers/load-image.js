import * as tiff from "tiff"
import axios from "axios"
import { Buffer } from "buffer"

const validateImagePath = (imagePath) => {
	const errors = []

	if (imagePath == null || imagePath == undefined)
		errors.push("No image path provided")
	// Use regex to check if it is a tiff

	return errors
}

const imagePathToArrayBuffer = async (imagePath) => {
	// Get the image from the server
	const response = await axios.get(imagePath, { responseType: "arraybuffer" })

	// Load the image as an array buffer
	const buffer = Buffer.from(response.data, "utf-8")

	return buffer
}

const createTiffPolyfill = arrayBuffer => [{ data: new Uint8Array(arrayBuffer) }]

export const loadImage = async ({ imagePath = null, arrayBuffer = null }) => {
	// Check to make sure some form of image has been provided
	if (imagePath == null && arrayBuffer == null)
		return { errors: ["No image provided"] }

	if (imagePath != null) {
		// Check to make sure the path to the image is valid
		const errors = validateImagePath(imagePath)

		// Return any errors that arise
		if (errors.length != 0) return { errors }

		// Store the loaded image
		arrayBuffer = await imagePathToArrayBuffer(imagePath)
	}

	let data
	
	try {
		// Attempt to decode the image as a tiff
		data = tiff.decode(arrayBuffer)
	} catch (err) {
		// Warn the user that their image is not a tiff
		console.warn("The image provided is not a tiff")

		// Fall back to the original image data
		data = createTiffPolyfill(arrayBuffer)
	}

	return { data }
}
