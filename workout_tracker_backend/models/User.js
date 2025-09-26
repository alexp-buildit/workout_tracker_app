const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 30],
      notEmpty: true
    }
  },
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true,
      is: /^[\+]?[1-9][\d]{0,15}$/
    }
  },
  lastLogin: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['username']
    },
    {
      fields: ['phoneNumber']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Instance methods
User.prototype.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

User.prototype.getPublicProfile = function() {
  return {
    id: this.id,
    username: this.username,
    createdAt: this.createdAt,
    lastLogin: this.lastLogin
  };
};

// Static methods
User.findByUsername = async function(username) {
  return await User.findOne({
    where: {
      username: username.toLowerCase(),
      isActive: true
    }
  });
};

// Transform output to remove sensitive data
User.prototype.toJSON = function() {
  const values = { ...this.get() };
  delete values.updatedAt;
  return values;
};

module.exports = User;