// Perform SAD with the crop and the source image
export const sadKernelFunction = function (sourceImageLayer, cropLayer) {
    // Determine where to compare the crop to the source image for this thread
	const sourceX =
			this.thread.x * this.constants.useEveryXPixel +
			this.constants.originX,
		sourceY =
			this.thread.y * this.constants.useEveryXPixel +
			this.constants.originY

	let sum = 0

	// March through the source image
	// and compare each of the pixels in the area to the crop
	for (
		let _x = 0;
		_x < this.constants.cropLayerWidth;
		_x += this.constants.useEveryXPixel
	) {
		const x = sourceX + _x

		for (
			let _y = 0;
			_y < this.constants.cropLayerLength;
			_y += this.constants.useEveryXPixel
		) {
			const y = sourceY + _y

            // Get the array indices for the pixels
			const sourceImageLayerIndex = getImageDataIndex(
				x,
				y,
				this.constants.sourceImageLayerWidth
			)
			const cropLayerIndex = getImageDataIndex(
				x - sourceX,
				y - sourceY,
				this.constants.cropLayerWidth
			)

            // Get the pixel values at the given locations
			const sourceImageLayerPixel =
				sourceImageLayer[sourceImageLayerIndex]
			const cropLayerPixel = cropLayer[cropLayerIndex]

            // Calculate the absolute difference of the pixels
			const pixelDifference = Math.abs(
				sourceImageLayerPixel - cropLayerPixel
			)

			sum += pixelDifference
		}
	}

	return sum
}
