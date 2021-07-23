import { images } from "../images-manager"

/**
 * Outputs information that was found through scanning the images
 */
export const outputResults = () => {
	// Collect all the ouput information
	const info = {
		x: `${images.crop.position.x}-${
			images.crop.position.x + images.crop.dimensions.width
		}`,
		y: `${images.crop.position.y}-${
			images.crop.position.y + images.crop.dimensions.height
		}`,
		z: `${images.crop.position.z}-${
			images.crop.position.z + images.crop.data.length
		}`,
		angle:
			images.crop.isRotated != null
				? `${Math.round(images.crop.angle)}`
				: "",
		resliced:
			images.crop.reslicedDirection != null
				? `Resliced from: ${capitalizeFirstLetter(
						images.crop.reslicedDirection
				  )}`
				: "",
	}

	// Generate html to show the crop's position
	const resultHTML = `Crop Position: <br> x - ${info.x}, y - ${info.y}, z - ${
		info.z
	} ${images.crop.isRotated != null ? `<br> Rotated - ${info.angle}°` : ""} ${
		images.crop.reslicedDirection != null ? `<br> ${info.resliced}` : ""
	}`

	const cropInfo = document.querySelector("#crop-info")

	cropInfo.innerHTML = resultHTML
}

const capitalizeFirstLetter = (str) => str[0].toUpperCase() + str.slice(1)
