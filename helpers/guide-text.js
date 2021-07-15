let guideTextIsHidden = true

/**
 * Manages the guide text toggle button
 */
export const handleGuideTextToggle = () => {
    if(guideTextIsHidden) {
        showGuideText()
        setToggleToHide()

        guideTextIsHidden = false
        return
    } 

    hideGuideText()
    setToggleToShow()

    guideTextIsHidden = true
}

const showGuideText = () => {
    document.querySelector("#guide-text-container").style.display = "block"
} 

const hideGuideText = () => {
    document.querySelector("#guide-text-container").style.display = "none"
} 

const setToggleToShow = () => {
    document.querySelector("#toggle-guide-text").innerHTML = "Show Usage Guide"
} 

const setToggleToHide = () => {
    document.querySelector("#toggle-guide-text").innerHTML = "Hide Usage Guide"
} 