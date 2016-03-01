/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('asuntos_diputados', {
    asuntoId: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    sesion: {
      type: DataTypes.STRING,
      allowNull: false
    },
    asunto: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    ano: {
      type: DataTypes.INTEGER(4),
      allowNull: false
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false
    },
    hora: {
      type: DataTypes.DATE,
      allowNull: false
    },
    base: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mayoria: {
      type: DataTypes.STRING,
      allowNull: false
    },
    resultado: {
      type: DataTypes.STRING,
      allowNull: false
    },
    presidente: {
      type: DataTypes.STRING,
      allowNull: false
    },
    presentes: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    ausentes: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    abstenciones: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    afirmativos: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    negativos: {
      type: DataTypes.INTEGER(11),
      allowNull: false
    },
    votopresidente: {
      type: DataTypes.STRING,
      allowNull: false
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    permalink: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
      timestamps: false,
      paranoid: true, //do not delete entries
      underscored: true,
      tableName: 'asuntos_diputados',
      freezeTableName: true
  });
};
