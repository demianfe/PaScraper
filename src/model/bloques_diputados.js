/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
    return sequelize.define('bloques_diputados', {
    bloqueId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      references: {
        model: '',
        key: ''
      }
    },
    bloque: {
      type: DataTypes.STRING,
      allowNull: false
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false
    }
    }, {
	timestamps: false,
	paranoid: true, //do not delete entries
	underscored: true,
	tableName: 'bloques_diputados',
	freezeTableName: true
  });
};
