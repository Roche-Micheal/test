const DataTypes = require('sequelize');

module.exports = (sequelize) => {
  const Model = sequelize.define('customer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: false
    },
    created: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    modified: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  });

  Model.associate = function (models) {
    this.hasMany(models.employee, { foreignKey: 'customerId', as: 'employees' });
  };

  return Model;
}