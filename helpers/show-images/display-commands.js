import { images } from "../images-manager"
import { displayImage } from "./display-image"
import { sourceCanvas } from "../dom-management/source-canvas"

export const displayDefaultLayerOfSourceImage = () => {
    const sourceImage = images.sourceImage.data[0]

    displayImage({
        imageData: sourceImage.data,
        width: sourceImage.imageWidth,
        height: sourceImage.imageLength,
        canvasElement: sourceCanvas,
    })
}

export const displayCurrentLayerOfSourceImage = () => {
    const sourceImageLayer = images.sourceImage.data[images.crop.position.z - 1]

    displayImage({
        imageData: sourceImageLayer.data,
        width: sourceImageLayer.imageWidth,
        height: sourceImageLayer.imageLength,
        canvasElement: sourceCanvas,
    })
}