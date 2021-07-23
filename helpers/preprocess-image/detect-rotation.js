function getImageDataIndex(x, y, width) {
	return x + width * y
}

/**
 * Checks if an image is rotated or not
 * @param {Object} image A decoded tiff
 * @returns {boolean}
 */
export const isImageRotated = (image) => {
	const { data, imageWidth, imageLength } = image.data[0]

	// Keep track of the results as state variables
	let isRotated = true
	let angle = null

	if (!allCornersAreBlack(data, imageWidth, imageLength)) isRotated = false

	const { leftMostBlackPixel, bottomMostBlackPixel } = findTrianglePoints(
		data,
		imageWidth,
		imageLength
	)

	// If either end of the potential "black triangle" which indicates rotation
	// is in the corner, there cannot be a triangle there, as it would 
	// have a side length of 0
	if (leftMostBlackPixel === imageWidth && bottomMostBlackPixel === 0)
		isRotated = false

	const { cornerIsATriangle, width } = isTheCornerATriangle(
		data,
		imageWidth,
		leftMostBlackPixel,
		bottomMostBlackPixel
	)

	if (!cornerIsATriangle) isRotated = false

	// Calculate the angle between the two black pixels
	if (isRotated)
		angle = (Math.atan(bottomMostBlackPixel / width) * 180) / Math.PI

	return { isRotated, angle }
}

const allCornersAreBlack = (data, imageWidth, imageLength) => {
	// Find the pixel values of all of the corners of the image
	const topLeftCornerPixel = data[getImageDataIndex(0, 0, imageWidth)]
	const topRightCornerPixel =
		data[getImageDataIndex(imageWidth, 0, imageWidth)]
	const bottomLeftCornerPixel =
		data[getImageDataIndex(0, imageLength - 1, imageWidth)]
	const bottomRightCornerPixel =
		data[getImageDataIndex(imageWidth - 1, imageLength - 1, imageWidth)]

	return (
		topLeftCornerPixel == 0 &&
		topRightCornerPixel == 0 &&
		bottomLeftCornerPixel == 0 &&
		bottomRightCornerPixel == 0
	)
}

const findTrianglePoints = (data, imageWidth, imageLength) => {
	// Find the left-most black pixel from the top right corner
	let leftMostBlackPixel = imageWidth

	for (let i = imageWidth - 1; i >= 0; i--) {
		if (data[getImageDataIndex(i - 1, 0, imageWidth)] === 0)
			leftMostBlackPixel = i
		else break
	}

	// Find the bottom-most black pixel from the top right corner
	let bottomMostBlackPixel = 0

	for (let i = 1; i <= imageLength; i++) {
		if (data[getImageDataIndex(imageWidth - 1, i, imageWidth)] === 0)
			bottomMostBlackPixel = i
		else break
	}

	return { leftMostBlackPixel, bottomMostBlackPixel }
}

// Check if the area between the left-most black pixel and the bottom-most black pixel is black
const isTheCornerATriangle = (
	data,
	imageWidth,
	leftMostBlackPixel,
	bottomMostBlackPixel
) => {
	const threshold = 0.45

	const width = imageWidth - leftMostBlackPixel

	const area = 0.5 * width * bottomMostBlackPixel

	let blackArea = 0

	for (let i = leftMostBlackPixel; i < imageWidth; i++) {
		for (let j = 0; j < bottomMostBlackPixel; j++) {
			if (data[getImageDataIndex(i, j, imageWidth)] === 0) blackArea++
		}
	}

	return { cornerIsATriangle: blackArea / area >= threshold, width }
}
