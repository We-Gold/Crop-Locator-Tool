/// <reference types="Cypress" />

describe('The state of the page after uploading images', () => {
    beforeEach(() => {
        cy.visit('/')

        const sourceImageName = 'source.tif'
        const cropImageName = 'crop.tif'

        // Upload the source image
        cy.get("#source-image-input").attachFile(sourceImageName)

        // Upload the crop image
        cy.get("#crop-image-input").attachFile(cropImageName)

        cy.wait(1500)
    })

    it('should contain a main canvas with the crop overlay', () => {
        cy.get("#source-image-canvas").should('have.attr', 'width')
    })

    it('should have a full progress bar', () => {
        cy.get('#progress-bar > div').should('have.attr', 'style').and('include', 'width: 100%')
    })

    it('should show information about the crop', () => {
        cy.get('#crop-info').should('include.text', 'Crop Position')
    })
})