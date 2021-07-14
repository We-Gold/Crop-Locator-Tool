import Image from "image-js"

export const calculateOriginalDimensionsForRotatedImage = (
	position,
	currentDimensions,
	oldDimensions
) => {
	const x = position.x - Math.round((oldDimensions.width - currentDimensions.width) / 2)
	const y = position.y - Math.round((oldDimensions.height - currentDimensions.height) / 2)
    const z = position.z

	return {
		position: { x, y, z },
		width: oldDimensions.width,
		height: oldDimensions.height,
	}
}

export const correctImage = (imageData, width, height, angle, layers = 1) => {
	let image = rotateImage(imageData, width, height, angle)

	image = cropImageFromAngle(image, angle)

	return polyfillForTiff(image, layers)
}

const rotateImage = (imageData, width, height, angle) => {
	let image = new Image(width, height, imageData, { kind: "GREY" })

	image = image.rotate(-angle, { interpolation: "bilinear" })

	return image
}

const cropImageFromAngle = (image, angle) => {
	const oldSideLength = image.parent.width

	const triangleHeight = Math.abs(oldSideLength * Math.sin(radians(angle)))
	const triangleWidth = Math.abs(oldSideLength * Math.cos(radians(angle)))

	const interceptPercentage =
		triangleHeight / (triangleWidth + triangleHeight)

	const smallHypotenuse = interceptPercentage * oldSideLength

	const x = Math.trunc(smallHypotenuse * Math.cos(radians(angle)))
	const y = Math.trunc(triangleHeight - smallHypotenuse * Math.sin(radians(angle)))

	const width = image.width - y - x
	const height = image.height - x - y

	console.log({ x, y, width, height })

	image = image.crop({ x, y, width, height })

	return image
}

export const cropImage = (
	imageData,
	imageWidth,
	imageHeight,
	layers,
	{ width = 100, height = 100 } = {}
) => {
	let image = new Image(imageWidth, imageHeight, imageData, { kind: "GREY" })

    const cropWidth = Math.min(width, imageWidth)
    const cropHeight = Math.min(height, imageHeight)

    const x = (imageWidth - cropWidth) / 2
    const y = (imageHeight - cropHeight) / 2

	image = image.crop({
		x,
		y,
		width: cropWidth,
		height: cropHeight,
	})

	return polyfillForTiff(image, layers)
}

// Convert angle to radians
const radians = (angle) => (angle * Math.PI) / 180

const polyfillForTiff = (image, layers) => {
	image.imageWidth = image.width
	image.imageLength = image.height

	// Return an array with layer copies of the image
	return Array.from({ length: layers }, (_) => image)
}
