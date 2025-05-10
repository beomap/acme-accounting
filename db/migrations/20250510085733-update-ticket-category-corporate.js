'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Update all tickets with category 'registrationAddressChange' to 'corporate'
    await queryInterface.bulkUpdate(
      'tickets',
      { category: 'corporate' },
      { category: 'registrationAddressChange' },
    );
  },

  async down(queryInterface, Sequelize) {
    // Revert back to the old value if migration needs to be rolled back
    await queryInterface.bulkUpdate(
      'tickets',
      { category: 'registrationAddressChange' },
      { category: 'corporate' },
    );
  },
};
