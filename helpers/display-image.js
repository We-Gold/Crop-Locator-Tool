import * as plotty from "plotty"

const setCanvasDimensions = (canvasElement, canvasWidth, canvasHeight) => {
	canvasElement.style.width = `${canvasWidth}px`
	canvasElement.style.height = `${canvasHeight}px`
}

const resizeCanvas = ({
	canvasElement,
	canvasWidth = null,
	canvasHeight = null,
	width,
	height,
}) => {
	if (canvasWidth == null && canvasHeight == null) return

	// Calculate the image aspect ratio
	const aspectRatio = width / height

	// Fit the canvas size to the constraints
	if (canvasWidth != null) {
		const targetHeight = canvasWidth / aspectRatio

		setCanvasDimensions(canvasElement, canvasWidth, targetHeight)

		return
	}

	const targetWidth = canvasWidth * aspectRatio

	setCanvasDimensions(canvasElement, targetWidth, canvasHeight)
}

export const overlayCrop = (
	canvasElement,
	position,
    size,
	{
		strokeColor = "rgb(64, 196, 82)",
		highlightColor = "rgba(64, 196, 82, 0.5)",
	} = {}
) => {
    const ctx = canvasElement.getContext("2d")

    ctx.fillStyle = highlightColor
    ctx.strokeStyle = strokeColor

    const {x, y} = position

    const {w, h} = size

    ctx.fillRect(x, y, w, h)
    ctx.strokeRect(x, y, w, h)
}

export const displayImage = ({
	imageData,
	width,
	height,
	canvasElement,
	canvasWidth = null,
	canvasHeight = null,
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
        useWebGL: false
	})

	// Resize the canvas to match the image
	resizeCanvas({ canvasElement, canvasWidth, canvasHeight, width, height })

	// Render the plot to the canvas
	plot.render()

	return plot
}
