import * as plotty from "plotty"
import { radians } from "./correct-image"

export const overlayCrop = (
	canvasElement,
	position,
	size,
	{
		strokeColor = "rgb(64, 196, 82)",
		highlightColor = "rgba(64, 196, 82, 0.3)",
	} = {}
) => {
	const ctx = canvasElement.getContext("2d")

	ctx.fillStyle = highlightColor
	ctx.strokeStyle = strokeColor

	const { x, y } = position

	const { w, h } = size

	ctx.fillRect(x, y, w, h)
	ctx.strokeRect(x, y, w, h)
}

export const displayImage = ({
	imageData,
	width,
	height,
	canvasElement,
	imageRange = [0, 255],
	colorScale = "greys",
}) => {
	// Create a plotty plot for the given image
	const plot = new plotty.plot({
		canvas: canvasElement,
		data: imageData,
		width,
		height,
		domain: imageRange,
		colorScale,
		useWebGL: false,
	})

	// Render the plot to the canvas
	plot.render()

	return plot
}

export const replaceCropInSourceImage = async ({
	imageData,
	width,
	height,
	canvasElement,
	imageRange = [0, 255],
	colorScale = "greys",
	cropPosition,
	cropDimensions,
	angle = null,
	newCrop,
}) => {
	const ctx = canvasElement.getContext("2d")

	const { x, y } = cropPosition
	const { width: cropWidth, height: cropHeight } = cropDimensions

	// Create a plotty plot for the given image
	const plot = new plotty.plot({
		canvas: canvasElement,
		data: imageData,
		width,
		height,
		domain: imageRange,
		colorScale,
		useWebGL: false,
	})

	// Render the plot to the canvas
	plot.render()

	// Convert the new crop to a canvas image
	const tempCanvas = document.createElement("canvas")

	const tempPlot = new plotty.plot({
		canvas: tempCanvas,
		data: newCrop.data[0].data,
		width: newCrop.dimensions.width,
		height: newCrop.dimensions.height,
		domain: imageRange,
		colorScale,
		useWebGL: false,
	})

	// Render the plot to the canvas
	tempPlot.render()

	const tempCanvasContext = tempCanvas.getContext("2d")

	const newCropImage = await createImageBitmap(
		tempCanvasContext.getImageData(
			0,
			0,
			newCrop.dimensions.width,
			newCrop.dimensions.height
		)
	)

	ctx.save()

	// Apply transformations
	ctx.translate(x + cropWidth / 2, y + cropHeight / 2)
	if (angle != null) ctx.rotate(radians(angle))

	ctx.drawImage(newCropImage, -cropWidth / 2, -cropHeight / 2)

	// Reset the transformation matrix
	ctx.restore()

	if (angle != null) {
		ctx.save()

		const image = await createImageBitmap(
			ctx.getImageData(x, y, cropWidth, cropHeight)
		)

		// Apply transformations
		ctx.translate(x + cropWidth / 2, y + cropHeight / 2)

		ctx.drawImage(image, -cropWidth / 2, -cropHeight / 2)

		// Reset the transformation matrix
		ctx.restore()
	}

	document.querySelector("#replaced-crop-canvas").style.visibility = "visible"

	return plot
}

export const showCroppedAreaOnImage = async ({
	imageData,
	width,
	height,
	canvasElement,
	imageRange = [0, 255],
	colorScale = "greys",
	cropPosition,
	cropDimensions,
	angle = null,
}) => {
	const ctx = canvasElement.getContext("2d")

	const { x, y } = cropPosition
	const { width: cropWidth, height: cropHeight } = cropDimensions

	const [canvasWidth, canvasHeight] = [width, height]

	// Create a plotty plot for the given image
	const plot = new plotty.plot({
		canvas: canvasElement,
		data: imageData,
		width,
		height,
		domain: imageRange,
		colorScale,
		useWebGL: false,
	})

	// Render the plot to the canvas
	plot.render()

	// Make every other area of the canvas black
	ctx.fillStyle = "rgb(0,0,0)"

	ctx.save()

	const image = await createImageBitmap(
		ctx.getImageData(x, y, cropWidth, cropHeight)
	)

	ctx.fillRect(0, 0, canvasWidth, canvasHeight)

	// Apply transformations
	ctx.translate(x + cropWidth / 2, y + cropHeight / 2)
	if (angle != null) ctx.rotate(radians(angle))

	ctx.drawImage(image, -cropWidth / 2, -cropHeight / 2)

	// Reset the transformation matrix
	ctx.restore()

	if (angle != null) {
		ctx.save()

		const image = await createImageBitmap(
			ctx.getImageData(x, y, cropWidth, cropHeight)
		)

		ctx.fillRect(0, 0, canvasWidth, canvasHeight)

		// Apply transformations
		ctx.translate(x + cropWidth / 2, y + cropHeight / 2)

		ctx.drawImage(image, -cropWidth / 2, -cropHeight / 2)

		// Reset the transformation matrix
		ctx.restore()
	}

	return plot
}
