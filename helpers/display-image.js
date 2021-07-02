import * as plotty from "plotty"

const setCanvasDimensions = (canvasElement, canvasWidth, canvasHeight) => {
    canvasElement.style.width = `${canvasWidth}px`
    canvasElement.style.height = `${canvasHeight}px`
}

const resizeCanvas = ({canvasElement, canvasWidth = null, canvasHeight = null, width, height}) => {
    if(canvasWidth == null && canvasHeight == null) return

    // Calculate the image aspect ratio
    const aspectRatio = width / height

    // Fit the canvas size to the constraints
    if(canvasWidth != null) {
        const targetHeight = canvasWidth / aspectRatio

        setCanvasDimensions(canvasElement, canvasWidth, targetHeight)

        return
    }

    const targetWidth = canvasWidth * aspectRatio

    setCanvasDimensions(canvasElement, targetWidth, canvasHeight)
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
	})

    // Resize the canvas to match the image
    resizeCanvas({canvasElement, canvasWidth, canvasHeight, width, height})

    // Render the plot to the canvas
    plot.render()

    return plot
}
