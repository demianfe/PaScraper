/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('votaciones_diputados', {
    asuntoId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'asuntos_diputados',
        key: 'asuntoId'
      }
    },
    diputadoId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'diputados',
        key: 'diputadoId'
      }
    },
    bloqueId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      references: {
        model: 'bloques_diputados',
        key: 'bloqueId'
      }
    },
    voto: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    }
  }, {
      timestamps: false,
      paranoid: true, //do not delete entries
      underscored: true,
      tableName: 'votaciones_diputados',
      freezeTableName: true
  });
};
