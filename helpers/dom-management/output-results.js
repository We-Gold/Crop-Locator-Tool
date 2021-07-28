import { images } from "../images-manager"

/**
 * Outputs information that was found through scanning the images
 */
export const outputResults = () => {
	// Collect all the ouput information
	const info = collectCropInfo()

	// Generate html to show the crop's position
	const resultHTML = `Crop Position: <br> x - ${info.x}, y - ${info.y}, z - ${
		info.z
	} ${images.crop.isRotated != null ? `<br> Rotated - ${info.angle}°` : ""} ${
		images.crop.reslicedDirection != null
			? `<br> Resliced from: ${info.resliced}`
			: ""
	}`

	const cropInfo = document.querySelector("#crop-info")

	cropInfo.innerHTML = resultHTML
}

const collectCropInfo = () => {
	const { x, y, z } = images.crop.position
	const { width, height } = images.crop.dimensions
	const length = images.crop.data.length
	const { isRotated, angle, reslicedDirection } = images.crop

	return {
		x: `${x}-${x + width}`,
		y: `${y}-${y + height}`,
		z: `${z}-${z + length}`,
		angle: isRotated != null ? `${Math.round(angle)}` : "",
		resliced:
			reslicedDirection != null
				? `${capitalizeFirstLetter(reslicedDirection)}`
				: "",
	}
}

const capitalizeFirstLetter = (str) => str[0].toUpperCase() + str.slice(1)
