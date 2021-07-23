import * as tiff from "tiff"
import axios from "axios"
import { Buffer } from "buffer"

/**
 * Checks if real image path was provided
 */
const validateImagePath = (imagePath) => {
	const errors = []

	if (imagePath == null || imagePath == undefined)
		errors.push("No image path provided")

	return errors
}

/**
 * Loads the image from the given path and converts it to an array buffer
 * @param {string} imagePath 
 * @returns {ArrayBuffer}
 */
const imagePathToArrayBuffer = async (imagePath) => {
	// Get the image from the server
	const response = await axios.get(imagePath, { responseType: "arraybuffer" })

	// Load the image as an array buffer
	const buffer = Buffer.from(response.data, "utf-8")

	return buffer
}

/**
 * Loads the given image as a tiff
 * @returns {Array} An array of tiff layers
 */
export const loadImage = async ({ imagePath = null, arrayBuffer = null }) => {
	// Check to make sure some form of image has been provided
	if (imagePath == null && arrayBuffer == null)
		return { errors: ["No image provided"] }

	if (imagePath != null) {
		// Check to make sure the path to the image is valid
		const errors = validateImagePath(imagePath)

		// Return any errors that arise
		if (errors.length != 0)
			return { errors }

		// Store the loaded image
		arrayBuffer = await imagePathToArrayBuffer(imagePath)
	}

	let data

	try {
		// Attempt to decode the image as a tiff
		data = tiff.decode(arrayBuffer)
	} catch (err) {
		// Image is not a tiff
		return {
			errors: [
				"An image provided is not a tiff. Currently this tool only accepts tiffs.",
			],
		}
	}

	return { data }
}
