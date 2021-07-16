import { setProgressBarToPercent } from "./progress-bar"

const handleError = (error) => {
	// Display the error in the crop info text box
	document.querySelector("#crop-info").innerHTML = `<span>${error}</span>`

	// Update the progress bar
	setProgressBarToPercent(1)
}

export const handleErrors = (errors) => {
	if (errors == null || errors == undefined) return

	errors.forEach((error) => handleError(error))
}
