/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('diputados', {
    diputadoId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      references: {
        model: '',
        key: ''
      }
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    distrito: {
      type: DataTypes.STRING,
      allowNull: false
    },
    bloqueId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bloques_diputados',
        key: 'bloqueId'
      }
    }
  }, {
      timestamps: false,
      paranoid: true, //do not delete entries
      underscored: true,
      tableName: 'diputados',
      freezeTableName: true
  });
};
