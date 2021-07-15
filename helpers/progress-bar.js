export const setProgressBarToPercent = (percent) => {
    document.querySelector("#progress-bar > div").style.width = `${Math.round(percent * 100)}%`
}