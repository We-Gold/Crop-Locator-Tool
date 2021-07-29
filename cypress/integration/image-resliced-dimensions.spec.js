/// <reference types="Cypress" />

import { makeImage } from "../../helpers/images-manager"
import { calculateReslicedDimensions } from "../../helpers/preprocess-image/calculate-resliced-dimensions"

describe("The new dimensions of a resliced image", () => {
	it("Should have the correct dimensions when resliced from the top", () => {
		// Create a sample image
		const image = sampleImage()
		const topDimensions = calculateReslicedDimensions(image, "top")

		expect(topDimensions).to.eql({
			width: 300,
			height: 150,
			length: 200,
		})
	})

    it("Should have the correct dimensions when resliced from the left", () => {
		// Create a sample image
		const image = sampleImage()
		const topDimensions = calculateReslicedDimensions(image, "left")

		expect(topDimensions).to.eql({
			width: 200,
			height: 150,
			length: 300,
		})
	})
})

const sampleImage = () =>
	makeImage({
		data: new Array(150),
		dimensions: { width: 300, height: 200 },
	})