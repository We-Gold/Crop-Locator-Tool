/// <reference types="Cypress" />

describe("The initial state", () => {
	beforeEach(() => {
		cy.visit("/")
	})

	it("should not show the usage guide", () => {
		cy.get("#guide-text-container").should("not.be.visible")
	})

	it("should not show the info section", () => {
		cy.get("#info-area").should("not.be.visible")
	})
})
