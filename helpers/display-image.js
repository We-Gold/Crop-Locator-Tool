import * as plotty from "plotty"

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

	// Render the plot to the canvas
	plot.render()

	return plot
}
