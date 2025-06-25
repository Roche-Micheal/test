const DataTypes = require('sequelize');
const crypto = require('crypto');
const bcrypt = require('bcryptjs')
const { to, TE } = require('../responseHandler');

module.exports = (sequelize) => {
  const Model = sequelize.define('employee', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: {
          msg: "Must be a valid email"
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    passwordToken: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    passwordTokenExpire: {
      type: DataTypes.DATE,
      defaultValue: () => {
        const currentTime = new Date();
        currentTime.setHours(currentTime.getHours() + 24);
        return currentTime;
      },
    },

    twoFactor: {
      type: DataTypes.BOOLEAN,
      defaultValue:false
    },
    otp: {
      type: DataTypes.INTEGER,
      allowNull: true,  
    },
    loginCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    otpCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    refreshToken: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    otpCreatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    blockTime: {
      type: DataTypes.DATE,
      allowNull: true
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
    this.roleId = this.belongsTo(models.role, { foreignKey: 'roleId', as: 'role' });    ;
    this.customerId = this.belongsTo(models.customer, { foreignKey: 'customerId', as: 'customer' });
    this.departmentId = this.belongsTo(models.department, { foreignKey: 'departmentId', as: 'department' });
  };

  Model.beforeSave(async (user, options) => {
    let err;
    if (user.changed('password')) {
      let salt, hash;
      let rounds = crypto.randomInt(4, 10);
      salt = await bcrypt.genSalt(rounds);
      console.log('hello');
      [err, hash] = await to(bcrypt.hash(user.password, salt)); 
      if (err) TE('Error in hashing the password');
      user.password = hash;
    }
  });

  return Model;
};
