/// <reference types="Cypress" />

describe("When a rotated image is uploaded", () => {
	beforeEach(() => {
		cy.visit("/")

		const sourceImageName = "source.tif"
		const rotatedImageName = "rotated.tif"

		// Upload the source image
		cy.get("#source-image-input").attachFile(sourceImageName)

		// Upload the rotated crop image
		cy.get("#crop-image-input").attachFile(rotatedImageName)

		cy.wait(2500)
	})

    it("locates the rotated crop", () => {
        cy.get("#crop-info").should("include.text", "Crop Position")
    })

	it("detects that the image is rotated", () => {
        cy.get("#crop-info").should("include.text", "Rotated")
    })
})