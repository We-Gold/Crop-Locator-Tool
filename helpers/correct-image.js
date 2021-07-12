import Image from "image-js"

export const calculateOriginalDimensionsForRotatedImage = (position, currentDimensions, oldDimensions) => {
    const x = position.x - (oldDimensions.width - currentDimensions.width) / 2
    const y = position.y - (oldDimensions.height - currentDimensions.height) / 2

    return { position: { x, y }, width: oldDimensions.width, height: oldDimensions.height }
}

export const correctImage = (imageData, width, height, angle, layers = 1) => {
	let image = rotateImage(imageData, width, height, angle)

	image = cropImage(image, angle)

	return polyfillForTiff(image, layers)
}

const rotateImage = (imageData, width, height, angle) => {
	let image = new Image(width, height, imageData, { kind: "GREY" })

	image = image.rotate(-angle, { interpolation: "bilinear" })

	return image
}

const cropImage = (image, angle) => {
	const oldSideLength = image.parent.width

	const triangleHeight = Math.abs(oldSideLength * Math.sin(radians(angle)))
	const triangleWidth = Math.abs(oldSideLength * Math.cos(radians(angle)))

	const interceptPercentage =
		triangleHeight / (triangleWidth + triangleHeight)

	const smallHypotenuse = interceptPercentage * oldSideLength

	const x = smallHypotenuse * Math.cos(radians(angle))
	const y = triangleHeight - smallHypotenuse * Math.sin(radians(angle))

	const width = image.width - y - x
	const height = image.height - x - y

	image = image.crop({ x, y, width, height })

	return image
}

// Convert angle to radians
const radians = (angle) => (angle * Math.PI) / 180

const polyfillForTiff = (image, layers) => {
	image.imageWidth = image.width
	image.imageLength = image.height

	// Return an array with layer copies of the image
	return Array.from({ length: layers }, (_) => image)
}
