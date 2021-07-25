import { setProgressBarToPercent } from "./progress-bar"

export const setInitialStylesForDOMElements = () => {
	document.querySelector("#replaced-crop-canvas").style.visibility = "hidden"

	document.querySelector("#info-area").style.visibility = "visible"

	document.querySelector("#warning-text").style.display = "none"

    setProgressBarToPercent(0)
}