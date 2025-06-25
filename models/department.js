const DataTypes = require('sequelize');

module.exports = (sequelize) => {
  const Model = sequelize.define('department', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
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
    this.hasMany(models.employee, { foreignKey: 'departmentId', as: 'employees' });
  };
  return Model;
}