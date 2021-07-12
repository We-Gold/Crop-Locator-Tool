function getImageDataIndex(x, y, width) {
	return x + width * y
}

export const isImageRotated = (image) => {
	const { data, imageWidth, imageLength } = image.data[0]

	const topLeftCornerPixel = data[getImageDataIndex(0, 0, imageWidth)]
	const topRightCornerPixel =
		data[getImageDataIndex(imageWidth, 0, imageWidth)]
	const bottomLeftCornerPixel =
		data[getImageDataIndex(0, imageLength - 1, imageWidth)]
	const bottomRightCornerPixel =
		data[getImageDataIndex(imageWidth - 1, imageLength - 1, imageWidth)]

	if (
		topLeftCornerPixel !== 0 ||
		topRightCornerPixel !== 0 ||
		bottomLeftCornerPixel !== 0 ||
		bottomRightCornerPixel !== 0
	)
		return { isRotated: false }

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

	if (leftMostBlackPixel === imageWidth && bottomMostBlackPixel === 0)
		return { isRotated: false }

	// Check if the area between the left-most black pixel and the bottom-most black pixel is black
	const threshold = 0.45

	const width = imageWidth - leftMostBlackPixel

	const area = 0.5 * width * bottomMostBlackPixel

	let blackArea = 0

	for (let i = leftMostBlackPixel; i < imageWidth; i++) {
		for (let j = 0; j < bottomMostBlackPixel; j++) {
			if (data[getImageDataIndex(i, j, imageWidth)] === 0) blackArea++
		}
	}

	if (blackArea / area < threshold) return { isRotated: false }

	// Calculate the angle between the two black pixels
	const angle = (Math.atan(bottomMostBlackPixel / width) * 180) / Math.PI

	return { isRotated: true, angle }
}
