import { isImageNested } from "./image-is-nested"
import { images } from "../images-manager"

// For superusers:
// Disabling this will disable the image nesting feature
const isNesting = true

export const shouldNestImage = () => {
    const nested = isImageNested(
        {
            x: images.crop.position.x,
            y: images.crop.position.y,
            layer: images.crop.position.z,
            width: images.crop.dimensions.width,
            height: images.crop.dimensions.height,
        },
        {
            x: images.mainCrop.position.x,
            y: images.mainCrop.position.y,
            layer: images.mainCrop.position.z,
            width: images.mainCrop.dimensions.width,
            height: images.mainCrop.dimensions.height,
        }
    )

    return isNesting && nested
}