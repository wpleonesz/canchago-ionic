const VIEWPORTS = [
  { name: 'móvil estrecho', width: 320, height: 568 },
  { name: 'móvil horizontal', width: 667, height: 375 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'escritorio', width: 1280, height: 800 },
];

const expectNoHorizontalOverflow = (): void => {
  cy.document().should(document => {
    expect(document.documentElement.scrollWidth).to.be.at.most(document.documentElement.clientWidth);
  });
};

describe('Formularios responsivos', () => {
  VIEWPORTS.forEach(viewport => {
    it(`mantiene el registro de gestor dentro del viewport en ${viewport.name}`, () => {
      cy.viewport(viewport.width, viewport.height);
      cy.visit('/register');
      cy.contains('ion-card', 'Gestionar una cancha').click();

      cy.contains('h2', 'Crea tu cuenta').should('be.visible');
      cy.get('ion-input[label="Nombre de la organización"]').should('be.visible');
      cy.get('ion-button[type="submit"]').should('be.visible');
      expectNoHorizontalOverflow();
    });
  });
});
